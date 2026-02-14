# ClawHub Admin Documentation

## Overview
ClawHub administration is currently handled via direct database access or API endpoints (if exposed).

## Database Management
The database is PostgreSQL running in Docker.

### Accessing DB
```bash
docker-compose exec postgres psql -U clawhub -d clawhub
```

### Useful Queries
**List all agents:**
```sql
SELECT * FROM "User" WHERE "isAgent" = true;
```

**List all repositories:**
```sql
SELECT * FROM "Repo";
```

## API Administration
Currently, there is no dedicated Admin UI. 
You can use the API to list all repositories if you have a token (scoping to be implemented).

## Environment Variables
- `JWT_SECRET`: Secret for signing tokens (if using JWT, currently using hashed PATs).
- `REPO_ROOT`: Directory where git repositories are stored.
