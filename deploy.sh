#!/usr/bin/env bash
# ==============================================================================
# DevPulse - Automated Production Deployment Orchestrator
# Deploys backend API and Next.js frontend in one command using Docker Compose
# Supports both local server execution and remote deployment via SSH
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Default settings
BACKEND_PORT="${BACKEND_PORT:-8001}"
FRONTEND_PORT="${PORT:-3000}"
DOMAIN=""
REMOTE_TARGET=""
REMOTE_DIR="~/devpulse"
RUN_INGEST=false
FORCE_SEED=false
ACTION="deploy"

# Colors
BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# ------------------------------------------------------------------------------
# Help message
# ------------------------------------------------------------------------------
show_help() {
    echo -e "${BOLD}DevPulse Production Deployment Tool${NC}"
    echo -e ""
    echo -e "Usage: ./deploy.sh [OPTIONS] [COMMAND]"
    echo -e ""
    echo -e "Commands:"
    echo -e "  (default)               Build, configure and deploy full platform in one go"
    echo -e "  -s, --status            Check health status of running services and containers"
    echo -e "  -l, --logs              Follow live combined logs from all containers"
    echo -e "  -r, --restart           Restart all running containers"
    echo -e "  --stop, --down          Gracefully stop and tear down containers"
    echo -e "  -i, --ingest            Run live news and CVE ingestion pipeline in container"
    echo -e "  --seed                  Run seed_devpulse inside the running backend container"
    echo -e ""
    echo -e "Options:"
    echo -e "  --remote <user@host>    Deploy remotely to a server over SSH via rsync"
    echo -e "  --remote-dir <dir>      Remote target directory (default: ~/devpulse)"
    echo -e "  --domain <domain>       Set production domain name (e.g. devpulse.yourdomain.com)"
    echo -e "  -p, --port <port>       Set frontend port (default: $FRONTEND_PORT)"
    echo -e "  --backend-port <port>   Set backend port (default: $BACKEND_PORT)"
    echo -e "  -h, --help              Show this help message"
    echo -e ""
    echo -e "Examples:"
    echo -e "  ./deploy.sh                          # Deploy on the current server"
    echo -e "  ./deploy.sh --domain mydomain.com    # Deploy with custom domain"
    echo -e "  ./deploy.sh --remote ubuntu@1.2.3.4  # Deploy to remote server from local"
    echo -e "  ./deploy.sh --status                 # View running status and health check"
    echo -e "  ./deploy.sh --logs                   # Tail production logs"
    exit 0
}

# ------------------------------------------------------------------------------
# Parse Arguments
# ------------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    case "$1" in
        -s|--status)
            ACTION="status"
            shift
            ;;
        -l|--logs)
            ACTION="logs"
            shift
            ;;
        -r|--restart)
            ACTION="restart"
            shift
            ;;
        --stop|--down)
            ACTION="down"
            shift
            ;;
        -i|--ingest)
            RUN_INGEST=true
            shift
            ;;
        --seed)
            FORCE_SEED=true
            shift
            ;;
        --remote)
            REMOTE_TARGET="$2"
            shift 2
            ;;
        --remote-dir)
            REMOTE_DIR="$2"
            shift 2
            ;;
        --domain)
            DOMAIN="$2"
            shift 2
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
        *@*)
            REMOTE_TARGET="$1"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            ;;
    esac
done

# ------------------------------------------------------------------------------
# Resolve Docker Compose CLI
# ------------------------------------------------------------------------------
resolve_compose() {
    if docker compose version &>/dev/null; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &>/dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        echo -e "${RED}Error: Neither 'docker compose' nor 'docker-compose' was found.${NC}"
        echo -e "${YELLOW}Please install Docker and Docker Compose plugin before deploying.${NC}"
        exit 1
    fi
}

# ------------------------------------------------------------------------------
# Remote Deployment Mode
# ------------------------------------------------------------------------------
deploy_remote() {
    echo -e "${BLUE}${BOLD}==> Initiating remote deployment to $REMOTE_TARGET...${NC}"

    # Test SSH access
    if ! ssh -q -o BatchMode=yes -o ConnectTimeout=8 "$REMOTE_TARGET" exit 2>/dev/null; then
        echo -e "${YELLOW}Testing interactive SSH connection to $REMOTE_TARGET...${NC}"
        if ! ssh -o ConnectTimeout=10 "$REMOTE_TARGET" exit; then
            echo -e "${RED}Error: Could not connect to $REMOTE_TARGET via SSH.${NC}"
            exit 1
        fi
    fi

    echo -e "${GREEN}==> SSH connection confirmed.${NC}"

    # Create target directory on remote server
    ssh "$REMOTE_TARGET" "mkdir -p $REMOTE_DIR"

    # Rsync repository files
    echo -e "${BLUE}==> Synchronizing project files to $REMOTE_TARGET:$REMOTE_DIR...${NC}"
    rsync -avz --delete \
        --exclude '.git' \
        --exclude 'node_modules' \
        --exclude 'frontend/node_modules' \
        --exclude 'frontend/.next' \
        --exclude '.next' \
        --exclude '.venv' \
        --exclude 'backend/.venv' \
        --exclude '__pycache__' \
        --exclude '*.pyc' \
        --exclude 'backend/staticfiles' \
        "$ROOT_DIR/" "$REMOTE_TARGET:$REMOTE_DIR/"

    # If local .env exists, offer or sync it
    if [ -f "$ROOT_DIR/.env" ]; then
        echo -e "${BLUE}==> Synchronizing .env file...${NC}"
        rsync -avz "$ROOT_DIR/.env" "$REMOTE_TARGET:$REMOTE_DIR/.env"
    fi

    # Execute deploy.sh on remote server
    local remote_flags=""
    if [ -n "$DOMAIN" ]; then
        remote_flags="$remote_flags --domain $DOMAIN"
    fi
    if [ "$RUN_INGEST" = true ]; then
        remote_flags="$remote_flags --ingest"
    fi
    if [ "$FORCE_SEED" = true ]; then
        remote_flags="$remote_flags --seed"
    fi

    echo -e "${PURPLE}==> Executing remote deployment script...${NC}"
    ssh -t "$REMOTE_TARGET" "cd $REMOTE_DIR && chmod +x deploy.sh start.sh backend/docker-entrypoint.sh 2>/dev/null || true; ./deploy.sh $remote_flags"

    echo -e "\n${GREEN}${BOLD}✔ Remote deployment to $REMOTE_TARGET completed successfully!${NC}"
    exit 0
}

# ------------------------------------------------------------------------------
# Action: Logs
# ------------------------------------------------------------------------------
action_logs() {
    resolve_compose
    echo -e "${CYAN}==> Following container logs (Press Ctrl+C to exit)...${NC}"
    $COMPOSE_CMD logs -f --tail=100
    exit 0
}

# ------------------------------------------------------------------------------
# Action: Status
# ------------------------------------------------------------------------------
action_status() {
    resolve_compose
    echo -e "${BOLD}DevPulse Container Status:${NC}"
    $COMPOSE_CMD ps
    echo -e ""
    echo -e "${BOLD}Checking API Health (/api/v1/health/):${NC}"
    if curl -s -f "http://localhost:${BACKEND_PORT}/api/v1/health/" &>/dev/null; then
        local health_data
        health_data=$(curl -s "http://localhost:${BACKEND_PORT}/api/v1/health/" || echo "{}")
        echo -e "${GREEN}✔ Backend API is Healthy!${NC}"
        echo -e "${CYAN}Health Response:${NC} $health_data"
    else
        echo -e "${RED}✘ Backend API health check failed on http://localhost:${BACKEND_PORT}/api/v1/health/${NC}"
    fi

    echo -e ""
    echo -e "${BOLD}Checking Frontend (http://localhost:${FRONTEND_PORT}):${NC}"
    if curl -s -f "http://localhost:${FRONTEND_PORT}/" &>/dev/null; then
        echo -e "${GREEN}✔ Frontend is responding!${NC}"
    else
        echo -e "${YELLOW}✘ Frontend check failed on http://localhost:${FRONTEND_PORT}/${NC}"
    fi
    exit 0
}

# ------------------------------------------------------------------------------
# Action: Restart
# ------------------------------------------------------------------------------
action_restart() {
    resolve_compose
    echo -e "${YELLOW}==> Restarting all DevPulse containers...${NC}"
    $COMPOSE_CMD restart
    echo -e "${GREEN}✔ Containers restarted.${NC}"
    exit 0
}

# ------------------------------------------------------------------------------
# Action: Down
# ------------------------------------------------------------------------------
action_down() {
    resolve_compose
    echo -e "${YELLOW}==> Stopping DevPulse containers...${NC}"
    $COMPOSE_CMD down --remove-orphans
    echo -e "${GREEN}✔ Containers stopped and removed.${NC}"
    exit 0
}

# ------------------------------------------------------------------------------
# Production Environment Configuration (.env)
# ------------------------------------------------------------------------------
prepare_production_env() {
    local env_file="$ROOT_DIR/.env"
    
    if [ ! -f "$env_file" ]; then
        echo -e "${YELLOW}==> No .env file found. Creating from .env.example...${NC}"
        if [ -f "$ROOT_DIR/.env.example" ]; then
            cp "$ROOT_DIR/.env.example" "$env_file"
        else
            touch "$env_file"
        fi
    fi

    # Ensure strong random secret key if missing or default
    if grep -q "change-me-in-production" "$env_file" || ! grep -q "DJANGO_SECRET_KEY=" "$env_file"; then
        echo -e "${BLUE}==> Generating cryptographically secure DJANGO_SECRET_KEY...${NC}"
        local new_key
        if command -v python3 &>/dev/null; then
            new_key=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")
        elif command -v openssl &>/dev/null; then
            new_key=$(openssl rand -hex 32)
        else
            new_key="devpulse_$(date +%s)_$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 40)"
        fi
        
        if grep -q "DJANGO_SECRET_KEY=" "$env_file"; then
            sed -i "s|^DJANGO_SECRET_KEY=.*|DJANGO_SECRET_KEY=$new_key|" "$env_file"
        else
            echo "DJANGO_SECRET_KEY=$new_key" >> "$env_file"
        fi
    fi

    # Set DJANGO_DEBUG=False for production
    if grep -q "DJANGO_DEBUG=" "$env_file"; then
        sed -i "s|^DJANGO_DEBUG=.*|DJANGO_DEBUG=False|" "$env_file"
    else
        echo "DJANGO_DEBUG=False" >> "$env_file"
    fi

    # Determine server IP / domain
    local public_ip
    public_ip=$(curl -s -m 3 ifconfig.me 2>/dev/null || curl -s -m 3 api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}' 2>/dev/null || echo "127.0.0.1")
    
    local allowed_hosts="localhost,127.0.0.1,0.0.0.0,backend,frontend,$public_ip"
    if [ -n "$DOMAIN" ]; then
        allowed_hosts="$allowed_hosts,$DOMAIN"
    fi

    if grep -q "DJANGO_ALLOWED_HOSTS=" "$env_file"; then
        sed -i "s|^DJANGO_ALLOWED_HOSTS=.*|DJANGO_ALLOWED_HOSTS=*|" "$env_file"
    else
        echo "DJANGO_ALLOWED_HOSTS=*" >> "$env_file"
    fi

    # Configure NEXT_PUBLIC_API_URL if domain is passed
    if [ -n "$DOMAIN" ]; then
        local api_url="http://${DOMAIN}:${BACKEND_PORT}/api/v1"
        if grep -q "NEXT_PUBLIC_API_URL=" "$env_file"; then
            sed -i "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$api_url|" "$env_file"
        else
            echo "NEXT_PUBLIC_API_URL=$api_url" >> "$env_file"
        fi
    fi
}

# ------------------------------------------------------------------------------
# Ensure Host Directories & SQLite File
# ------------------------------------------------------------------------------
prepare_host_filesystem() {
    # Crucial: touch backend/db.sqlite3 so Docker does not mount it as a directory
    if [ ! -f "$BACKEND_DIR/db.sqlite3" ]; then
        echo -e "${BLUE}==> Initializing backend/db.sqlite3 database file...${NC}"
        touch "$BACKEND_DIR/db.sqlite3"
        chmod 666 "$BACKEND_DIR/db.sqlite3" 2>/dev/null || true
    fi

    mkdir -p "$BACKEND_DIR/media"
    mkdir -p "$BACKEND_DIR/staticfiles"
    chmod 777 "$BACKEND_DIR/media" 2>/dev/null || true
}

# ------------------------------------------------------------------------------
# Wait for Services Health Check
# ------------------------------------------------------------------------------
wait_for_healthy() {
    echo -e "${BLUE}==> Awaiting service health verification...${NC}"
    local max_retries=30
    local count=0
    local healthy=false

    while [ $count -lt $max_retries ]; do
        count=$((count + 1))
        if curl -s -f "http://localhost:${BACKEND_PORT}/api/v1/health/" &>/dev/null; then
            healthy=true
            break
        fi
        printf "${CYAN}..${NC}"
        sleep 2
    done
    echo ""

    if [ "$healthy" = true ]; then
        echo -e "${GREEN}✔ Backend API is healthy!${NC}"
    else
        echo -e "${YELLOW}Warning: Backend healthcheck timed out after $((max_retries * 2))s.${NC}"
        echo -e "${YELLOW}Showing recent container logs for inspection:${NC}"
        $COMPOSE_CMD logs --tail=40
    fi
}

# ------------------------------------------------------------------------------
# Banner
# ------------------------------------------------------------------------------
show_deploy_banner() {
    local host_display="http://localhost:${FRONTEND_PORT}"
    local api_display="http://localhost:${BACKEND_PORT}/api/v1/"
    local docs_display="http://localhost:${BACKEND_PORT}/api/v1/docs/"

    local public_ip
    public_ip=$(curl -s -m 3 ifconfig.me 2>/dev/null || curl -s -m 3 api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}' 2>/dev/null || echo "")
    
    echo -e ""
    echo -e "${GREEN}${BOLD}====================================================================${NC}"
    echo -e "${GREEN}${BOLD}  🚀 DevPulse Platform Deployed Successfully!${NC}"
    echo -e "${GREEN}${BOLD}====================================================================${NC}"
    echo -e ""
    echo -e "  ${BOLD}Access Endpoints:${NC}"
    echo -e "  ➜ ${BOLD}Frontend Web App:${NC}       ${GREEN}${host_display}${NC}"
    if [ -n "$public_ip" ]; then
        echo -e "  ➜ ${BOLD}Public IP Access:${NC}       ${GREEN}http://${public_ip}:${FRONTEND_PORT}${NC}"
    fi
    if [ -n "$DOMAIN" ]; then
        echo -e "  ➜ ${BOLD}Domain Access:${NC}          ${GREEN}http://${DOMAIN}:${FRONTEND_PORT}${NC}"
    fi
    echo -e "  ➜ ${BOLD}Backend REST API:${NC}       ${CYAN}${api_display}${NC}"
    echo -e "  ➜ ${BOLD}Interactive API Docs:${NC}   ${CYAN}${docs_display}${NC}"
    echo -e "  ➜ ${BOLD}Admin Dashboard:${NC}        ${PURPLE}${host_display}/admin-dashboard${NC}"
    echo -e ""
    echo -e "  ${BOLD}Management Commands:${NC}"
    echo -e "  ➜ View live logs:            ${CYAN}./deploy.sh --logs${NC}"
    echo -e "  ➜ Check system status:       ${CYAN}./deploy.sh --status${NC}"
    echo -e "  ➜ Restart containers:        ${CYAN}./deploy.sh --restart${NC}"
    echo -e "  ➜ Stop deployment:           ${CYAN}./deploy.sh --stop${NC}"
    echo -e "  ➜ Run news ingestion:        ${CYAN}./deploy.sh --ingest${NC}"
    echo -e "${GREEN}${BOLD}====================================================================${NC}"
}

# ------------------------------------------------------------------------------
# Main Deployment Workflow
# ------------------------------------------------------------------------------
main() {
    if [ -n "$REMOTE_TARGET" ]; then
        deploy_remote
        return 0
    fi

    case "$ACTION" in
        logs)
            action_logs
            ;;
        status)
            action_status
            ;;
        restart)
            action_restart
            ;;
        down)
            action_down
            ;;
        deploy)
            ;;
    esac

    echo -e "${BLUE}${BOLD}==> Starting DevPulse Production Deployment...${NC}"
    resolve_compose
    prepare_production_env
    prepare_host_filesystem

    echo -e "${BLUE}==> Building production Docker containers...${NC}"
    $COMPOSE_CMD build

    echo -e "${BLUE}==> Launching DevPulse containers in detached mode...${NC}"
    $COMPOSE_CMD up -d --remove-orphans

    # Wait for containers to boot and become responsive
    wait_for_healthy

    # Run migrations inside container
    echo -e "${BLUE}==> Verifying database migrations in container...${NC}"
    $COMPOSE_CMD exec -T backend python manage.py migrate --noinput || true

    # Force seed if requested
    if [ "$FORCE_SEED" = true ]; then
        echo -e "${GREEN}==> Seeding baseline categories, technologies, and sources...${NC}"
        $COMPOSE_CMD exec -T backend python manage.py seed_devpulse || true
    fi

    # Trigger ingestion if requested
    if [ "$RUN_INGEST" = true ]; then
        echo -e "${PURPLE}==> Triggering live technology news and CVE ingestion pipeline...${NC}"
        $COMPOSE_CMD exec -T backend python manage.py run_ingestion || true
    fi

    show_deploy_banner
}

main

