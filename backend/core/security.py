"""
DevPulse Core Security Utilities.
Provides SSRF defenses, URL validation, and input sanitization for external content.
"""

import socket
import ipaddress
import urllib.parse
import re
import html
from typing import Tuple

BLOCKED_HOSTNAMES = {
    'localhost',
    'metadata.google.internal',
    'metadata.internal',
    '169.254.169.254',
}

BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network('127.0.0.0/8'),        # Loopback
    ipaddress.ip_network('10.0.0.0/8'),         # Private Class A
    ipaddress.ip_network('172.16.0.0/12'),      # Private Class B
    ipaddress.ip_network('192.168.0.0/16'),     # Private Class C
    ipaddress.ip_network('169.254.0.0/16'),     # Link-local / Cloud Metadata
    ipaddress.ip_network('0.0.0.0/8'),          # Current network
    ipaddress.ip_network('224.0.0.0/4'),        # Multicast
    ipaddress.ip_network('240.0.0.0/4'),        # Reserved
    ipaddress.ip_network('::1/128'),            # IPv6 Loopback
    ipaddress.ip_network('fc00::/7'),           # IPv6 Unique Local
    ipaddress.ip_network('fe80::/10'),          # IPv6 Link-local
]


def validate_safe_url(url: str, allow_private_for_test: bool = False) -> Tuple[bool, str]:
    """
    Validates that a URL is safe to fetch via HTTP/HTTPS, preventing SSRF attacks
    against cloud metadata services, localhost, and private intranet infrastructure.
    """
    if not url or not isinstance(url, str):
        return False, "URL must be a non-empty string"

    parsed = urllib.parse.urlparse(url.strip())

    if parsed.scheme.lower() not in ('http', 'https'):
        return False, f"Invalid URL scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted."

    hostname = parsed.hostname
    if not hostname:
        return False, "URL missing valid hostname"

    hostname_lower = hostname.lower()

    if hostname_lower in BLOCKED_HOSTNAMES:
        return False, f"Access to host '{hostname}' is blocked for security reasons."

    # In testing environment, allow test domain or localhost if explicitly flagged
    if allow_private_for_test:
        return True, ""

    try:
        # Resolve hostname to IP addresses
        addr_info = socket.getaddrinfo(hostname, None)
        for family, socktype, proto, canonname, sockaddr in addr_info:
            ip_str = sockaddr[0]
            ip_obj = ipaddress.ip_address(ip_str)

            for blocked_net in BLOCKED_IP_NETWORKS:
                if ip_obj in blocked_net:
                    return False, f"Resolved IP {ip_str} belongs to restricted network ({blocked_net}). SSRF blocked."
    except socket.gaierror:
        # DNS resolution failure will be handled by HTTP client
        pass
    except Exception as e:
        return False, f"Hostname resolution error: {str(e)}"

    return True, ""


# Prompt Injection Defense Patterns
PROMPT_INJECTION_PATTERNS = [
    re.compile(r'(?i)(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts|directives)'),
    re.compile(r'(?i)system\s*:\s*you\s+are\s+now'),
    re.compile(r'(?i)new\s+system\s+instruction'),
    re.compile(r'(?i)output\s+(?:the\s+)?(?:system\s+prompt|secret\s+key|api\s+key|environment\s+variables)'),
    re.compile(r'(?i)override\s+(?:system|developer|safety)\s+mode'),
]


def sanitize_external_text(text: str, max_length: int = 100000) -> str:
    """
    Sanitizes external untrusted text retrieved from feeds:
    - Strips executable code and script tags
    - Unescapes HTML entities
    - Defangs known prompt-injection triggers
    - Enforces sensible length boundaries
    """
    if not text:
        return ""

    # Strip script and iframe tags
    clean = re.sub(r'(?is)<(script|iframe|object|embed)[^>]*>.*?</\1>', ' ', text)
    clean = re.sub(r'<[^>]+>', ' ', clean)
    clean = html.unescape(clean)

    # Defang prompt injection attempts by neutralizing command structure
    for pattern in PROMPT_INJECTION_PATTERNS:
        clean = pattern.sub('[filtered potential injection directive]', clean)

    # Normalize whitespace
    clean = re.sub(r'\s+', ' ', clean).strip()

    return clean[:max_length]
