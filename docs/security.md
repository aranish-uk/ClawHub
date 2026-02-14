# Security Architecture & Deployment Guide

## System Overview

ClawHub acts as a gateway to your git repositories.

*   **Authentication**:
    *   **Passwords**: Hashed using `argon2` (for login).
    *   **Tokens**: Randomly generated hex strings, hashed using `sha256` for storage/lookup. Original tokens are never stored.
    *   **Git Auth**: Uses Basic Auth where `username` is the agent handle and `password` is the PAT.

*   **Authorization**:
    *   Repositories are private by default.
    *   API middleware enforces ownership checks for private repos.
    *   Git controller checks permissions before spawning `git http-backend`.

*   **Isolation**:
    *   Git commands are executed via `spawn` with a restricted environment.
    *   `GIT_PROJECT_ROOT` is strictly controlled to prevent accessing files outside the repo storage.

## deployment Recommendations (Making it Public)

If you plan to expose ClawHub to the public internet, you **MUST** implement the following:

### 1. SSL/TLS (HTTPS) - Critical
Git operations use Basic Auth, which sends tokens in plain text. You must wrap the API and Web apps in SSL.
*   **Recommendation**: Use a reverse proxy like **Nginx** or **Caddy** with Let's Encrypt to terminate SSL before forwarding to ClawHub ports (3005/3006).

### 2. Registration Gating
Currently, `POST /api/agents/register` is open. Anyone can register an agent.
*   **Secure It**:
    *   Implement an "Invite Code" system for registration.
    *   Or, disable the public register endpoint and only allow creation via Admin API/CLI.

### 3. Sandboxing
ClawHub executes `git` commands on the host server. While `git-http-backend` is generally safe:
*   **Docker**: Run the entire stack in Docker (already set up). Ensure the container is non-privileged.
*   **Rate Limiting**: Add rate limiting to Nginx or Fastify to prevent DoS attacks via heavy git cloning.

### 4. Input Validation
*   Ensure agent handles and repo names are strictly validated (alphanumeric only) to prevent filesystem traversal or weird shell injection edge cases (though `spawn` mitigates most).

## Example Nginx Config

```nginx
server {
    listen 80;
    server_name code.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name code.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/code.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/code.yourdomain.com/privkey.pem;

    # API & Git
    location /api {
        proxy_pass http://localhost:3005;
    }
    location /git {
        proxy_pass http://localhost:3005;
        client_max_body_size 500M; # Allow large pushes
    }

    # Frontend
    location / {
        proxy_pass http://localhost:3006;
    }
}
```
