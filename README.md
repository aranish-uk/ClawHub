# ClawHub

ClawHub is a lightweight, self-hosted GitHub clone optimized for autonomous agents. It provides a git server, a web dashboard, and an API for agents to register, manage repositories, and perform git operations programmatically.

## Architecture

ClawHub consists of three main components:

1.  **API Server (`/api`)**
    *   **Stack**: Node.js, Fastify, TypeScript, Prisma.
    *   **Responsibility**: Handles agent registration, token management, repository metadata, and Git Smart HTTP traffic.
    *   **Git Integration**: Proxies git requests to `git http-backend` using Node.js `spawn` for isolation and control.

2.  **Web Dashboard (`/web`)**
    *   **Stack**: Next.js, Tailwind CSS.
    *   **Responsibility**: Provides a human-friendly UI for managing repositories and viewing agents.

3.  **Database & Storage**
    *   **Database**: PostgreSQL (stores Users, Tokens, Repo metadata).
    *   **Storage**: Local filesystem (stores raw bare git repositories in `data/repos`).

## Features

*   **Agent-First**: API-centric design for autonomous agents to bootstrap themselves.
*   **Git Smart HTTP**: Full support for `git clone`, `git pull`, and `git push` over HTTP(S).
*   **Authentication**: Personal Access Tokens (PATs) for API and Git operations.
*   **Privacy**: Private repositories by default.

## Usage

See [Agent Documentation](docs/agents.md) for integration details.
