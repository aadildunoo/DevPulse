#!/usr/bin/env bash
# ==============================================================================
# DevPulse - Local Development Orchestrator
# Starts Django REST API backend (port 8001) and Next.js frontend (port 3000)
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Default configuration (can be overridden by environment or flags)
BACKEND_PORT="${BACKEND_PORT:-8001}"
FRONTEND_PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"
AUTO_KILL=false
FORCE_SEED=false
RUN_INGEST=false
BACKEND_ONLY=false
FRONTEND_ONLY=false
USE_DOCKER=false

# ANSI color codes
BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# ------------------------------------------------------------------------------
# Help / Usage
# ------------------------------------------------------------------------------
show_help() {
    echo -e "${BOLD}DevPulse Local Development Launcher${NC}"
    echo -e ""
    echo -e "Usage: ./start.sh [OPTIONS]"
    echo -e ""
    echo -e "Options:"
    echo -e "  -k, --kill              Kill any existing processes occupying ports $BACKEND_PORT or $FRONTEND_PORT"
    echo -e "  -s, --seed              Run baseline seed command (categories, technologies, sources)"
    echo -e "  -i, --ingest            Run live news and security CVE ingestion pipeline after start"
    echo -e "  -b, --backend-only      Start only the Django backend"
    echo -e "  -f, --frontend-only     Start only the Next.js frontend"
    echo -e "  -d, --docker            Launch local environment using Docker Compose instead"
    echo -e "  -p, --port <port>       Frontend port (default: $FRONTEND_PORT)"
    echo -e "  --backend-port <port>   Backend port (default: $BACKEND_PORT)"
    echo -e "  -h, --help              Show this help message"
    echo -e ""
    echo -e "Examples:"
    echo -e "  ./start.sh              # Start both backend and frontend locally"
    echo -e "  ./start.sh --kill       # Clean up stale processes and start"
    echo -e "  ./start.sh --seed       # Ensure baseline data is seeded"
    echo -e "  ./start.sh --docker     # Run using docker compose"
    exit 0
}

# ------------------------------------------------------------------------------
# Parse Arguments
# ------------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    case "$1" in
        -k|--kill)
            AUTO_KILL=true
            shift
            ;;
        -s|--seed)
            FORCE_SEED=true
            shift
            ;;
        -i|--ingest)
            RUN_INGEST=true
            shift
            ;;
        -b|--backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        -f|--frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        -d|--docker)
            USE_DOCKER=true
            shift
            ;;
        -p|--port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        --backend-port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            ;;
    esac
done

# ------------------------------------------------------------------------------
# Docker mode delegate
# ------------------------------------------------------------------------------
if [ "$USE_DOCKER" = true ]; then
    echo -e "${BLUE}${BOLD}==> Starting DevPulse in Docker mode...${NC}"
    if ! command -v docker &>/dev/null; then
        echo -e "${RED}Error: Docker is not installed or not in PATH.${NC}"
        exit 1
    fi
    docker compose up --build
    exit $?
fi

# ------------------------------------------------------------------------------
# Check and free ports
# ------------------------------------------------------------------------------
get_port_pids() {
    local port="$1"
    if command -v fuser &>/dev/null; then
        fuser "$port/tcp" 2>/dev/null | tr -s ' ' '\n' | grep -E '^[0-9]+$' || true
    elif command -v ss &>/dev/null; then
        ss -tulpn "sport = :$port" 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2 || true
    else
        lsof -iTCP:"$port" -sTCP:LISTEN -Fp 2>/dev/null | sed -n 's/^p//p' || true
    fi
}

check_port() {
    local port="$1"
    local name="$2"
    local pids
    pids=$(get_port_pids "$port")

    if [ -n "$pids" ]; then
        if [ "$AUTO_KILL" = true ]; then
            echo -e "${YELLOW}==> Freeing port $port ($name) occupied by PID(s): $pids...${NC}"
            for pid in $pids; do
                kill -9 "$pid" 2>/dev/null || true
            done
            sleep 0.5
        else
            echo -e "${RED}Error: Port $port ($name) is already in use by PID(s): $pids.${NC}"
            echo -e "${YELLOW}Tip: Run './start.sh --kill' to automatically terminate existing processes, or change ports.${NC}"
            exit 1
        fi
    fi
}

# ------------------------------------------------------------------------------
# Environment Setup (.env)
# ------------------------------------------------------------------------------
setup_env() {
    if [ ! -f "$ROOT_DIR/.env" ]; then
        if [ -f "$ROOT_DIR/.env.example" ]; then
            echo -e "${YELLOW}==> Creating .env from .env.example...${NC}"
            cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
        fi
    fi
}

# ------------------------------------------------------------------------------
# Backend Setup & Resolution
# ------------------------------------------------------------------------------
resolve_python() {
    local venv_python="$BACKEND_DIR/.venv/bin/python"
    
    if [ -f "$venv_python" ] && [ -x "$venv_python" ]; then
        PYTHON_BIN="$venv_python"
        return 0
    fi

    echo -e "${YELLOW}==> Virtual environment not found at backend/.venv. Setting up...${NC}"
    
    if command -v uv &>/dev/null; then
        echo -e "${BLUE}==> Using uv to create virtual environment...${NC}"
        uv venv "$BACKEND_DIR/.venv" --python 3.12 2>/dev/null || uv venv "$BACKEND_DIR/.venv"
        uv pip install --python "$BACKEND_DIR/.venv" -r "$BACKEND_DIR/requirements.txt"
    elif command -v python3 &>/dev/null; then
        echo -e "${BLUE}==> Using python3 venv...${NC}"
        python3 -m venv "$BACKEND_DIR/.venv"
        "$BACKEND_DIR/.venv/bin/pip" install --upgrade pip
        "$BACKEND_DIR/.venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt"
    else
        echo -e "${RED}Error: Neither uv nor python3 is available. Please install Python 3.12+.${NC}"
        exit 1
    fi

    PYTHON_BIN="$BACKEND_DIR/.venv/bin/python"
}

# ------------------------------------------------------------------------------
# Frontend Setup
# ------------------------------------------------------------------------------
setup_frontend() {
    if ! command -v node &>/dev/null || ! command -v npm &>/dev/null; then
        echo -e "${RED}Error: Node.js and npm are required to run the frontend.${NC}"
        exit 1
    fi

    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        echo -e "${BLUE}==> Installing frontend dependencies (npm install)...${NC}"
        (cd "$FRONTEND_DIR" && npm install)
    fi
}

# ------------------------------------------------------------------------------
# Database Preparation
# ------------------------------------------------------------------------------
prepare_database() {
    echo -e "${BLUE}==> [Backend] Applying database migrations...${NC}"
    (cd "$BACKEND_DIR" && "$PYTHON_BIN" manage.py migrate --noinput)

    # Check if database has any data
    local needs_seed=false
    if [ "$FORCE_SEED" = true ]; then
        needs_seed=true
    else
        local has_data
        has_data=$(cd "$BACKEND_DIR" && "$PYTHON_BIN" -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'devpulse.settings')
django.setup()
from news.models import Category
print('YES' if Category.objects.exists() else 'NO')
" 2>/dev/null || echo "NO")
        if [ "$has_data" = "NO" ]; then
            needs_seed=true
        fi
    fi

    if [ "$needs_seed" = true ]; then
        echo -e "${GREEN}==> [Backend] Seeding baseline categories, technologies, and verified sources...${NC}"
        (cd "$BACKEND_DIR" && "$PYTHON_BIN" manage.py seed_devpulse)
    fi

    if [ "$RUN_INGEST" = true ]; then
        echo -e "${PURPLE}==> [Backend] Running live intelligence ingestion pipeline...${NC}"
        (cd "$BACKEND_DIR" && "$PYTHON_BIN" manage.py run_ingestion)
    fi
}

# ------------------------------------------------------------------------------
# Process tracking & Cleanup Handler
# ------------------------------------------------------------------------------
BACKEND_PID=""
FRONTEND_PID=""

kill_tree() {
    local pid="$1"
    if [ -z "$pid" ]; then return; fi
    local children
    children=$(pgrep -P "$pid" 2>/dev/null || true)
    for child in $children; do
        kill_tree "$child"
    done
    kill -TERM "$pid" 2>/dev/null || true
}

cleanup() {
    trap - SIGINT SIGTERM EXIT
    echo -e "\n${YELLOW}${BOLD}==> Shutting down DevPulse development services...${NC}"
    
    if [ -n "$BACKEND_PID" ]; then
        kill_tree "$BACKEND_PID"
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill_tree "$FRONTEND_PID"
    fi

    # Extra assurance for any lingering processes on our ports
    local stray_b
    stray_b=$(lsof -ti :"$BACKEND_PORT" 2>/dev/null || true)
    if [ -n "$stray_b" ]; then
        kill -9 $stray_b 2>/dev/null || true
    fi

    local stray_f
    stray_f=$(lsof -ti :"$FRONTEND_PORT" 2>/dev/null || true)
    if [ -n "$stray_f" ]; then
        kill -9 $stray_f 2>/dev/null || true
    fi

    echo -e "${GREEN}==> All services stopped cleanly. Goodbye!${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# ------------------------------------------------------------------------------
# Banner
# ------------------------------------------------------------------------------
show_banner() {
    echo -e ""
    echo -e "${CYAN}${BOLD}  ██████╗ ███████╗██╗   ██╗██████╗ ██╗   ██╗██╗     ███████╗${NC}"
    echo -e "${CYAN}${BOLD}  ██╔══██╗██╔════╝██║   ██║██╔══██╗██║   ██║██║     ██╔════╝${NC}"
    echo -e "${CYAN}${BOLD}  ██║  ██║█████╗  ██║   ██║██████╔╝██║   ██║██║     ███████╗${NC}"
    echo -e "${CYAN}${BOLD}  ██║  ██║██╔══╝  ╚██╗ ██╔╝██╔═══╝ ██║   ██║██║     ╚════██║${NC}"
    echo -e "${CYAN}${BOLD}  ██████╔╝███████╗ ╚████╔╝ ██║     ╚██████╔╝███████╗███████║${NC}"
    echo -e "${CYAN}${BOLD}  ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝      ╚═════╝ ╚══════╝╚══════╝${NC}"
    echo -e "   ${BOLD}Global Technology Intelligence Platform (Local Dev)${NC}"
    echo -e ""
    echo -e "  ${BOLD}Active Endpoints:${NC}"
    if [ "$BACKEND_ONLY" != true ]; then
        echo -e "  ➜ ${GREEN}Frontend Application:${NC}   http://localhost:${FRONTEND_PORT}"
        echo -e "  ➜ ${GREEN}Admin Dashboard:${NC}        http://localhost:${FRONTEND_PORT}/admin-dashboard"
    fi
    if [ "$FRONTEND_ONLY" != true ]; then
        echo -e "  ➜ ${CYAN}Backend REST API:${NC}       http://localhost:${BACKEND_PORT}/api/v1/"
        echo -e "  ➜ ${CYAN}Interactive API Docs:${NC}   http://localhost:${BACKEND_PORT}/api/v1/docs/"
        echo -e "  ➜ ${CYAN}System Health Check:${NC}    http://localhost:${BACKEND_PORT}/api/v1/health/"
    fi
    echo -e ""
    echo -e "  ${PURPLE}Press [Ctrl+C] to gracefully stop both servers.${NC}"
    echo -e "${BOLD}--------------------------------------------------------------------${NC}"
}

# ------------------------------------------------------------------------------
# Main Execution
# ------------------------------------------------------------------------------
main() {
    setup_env

    # 1. Check ports first before performing setup work
    if [ "$FRONTEND_ONLY" != true ]; then
        check_port "$BACKEND_PORT" "Backend"
    fi
    if [ "$BACKEND_ONLY" != true ]; then
        check_port "$FRONTEND_PORT" "Frontend"
    fi

    # 2. Setup backend environment and database
    if [ "$FRONTEND_ONLY" != true ]; then
        resolve_python
        prepare_database
    fi

    # 3. Setup frontend environment
    if [ "$BACKEND_ONLY" != true ]; then
        setup_frontend
    fi

    show_banner

    # Start Backend
    if [ "$FRONTEND_ONLY" != true ]; then
        (
            cd "$BACKEND_DIR"
            export PYTHONUNBUFFERED=1
            exec "$PYTHON_BIN" manage.py runserver "$HOST:$BACKEND_PORT" 2>&1 | while IFS= read -r line; do
                printf "${CYAN}[Backend]${NC} %s\n" "$line"
            done
        ) &
        BACKEND_PID=$!
    fi

    # Start Frontend
    if [ "$BACKEND_ONLY" != true ]; then
        (
            cd "$FRONTEND_DIR"
            export NEXT_PUBLIC_API_URL="http://localhost:${BACKEND_PORT}/api/v1"
            exec npm run dev -- -p "$FRONTEND_PORT" 2>&1 | while IFS= read -r line; do
                printf "${GREEN}[Frontend]${NC} %s\n" "$line"
            done
        ) &
        FRONTEND_PID=$!
    fi

    # Keep script running and wait for background processes
    wait
}

main
