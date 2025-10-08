# Database Setup

This directory contains the Docker configuration for the Account Manager PostgreSQL database.

## 🔐 Security Setup

### Environment Variables
Database credentials are stored in environment variables for security:

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with secure credentials:**
   ```bash
   # Update these with your own secure values
   POSTGRES_USER=your_secure_username
   POSTGRES_PASSWORD=your_very_secure_password
   POSTGRES_DB=account_manager
   ```

3. **Never commit the `.env` file** - it's already in .gitignore

### Current Configuration
- **Database**: PostgreSQL 16
- **Admin Interface**: Adminer (lightweight web UI)
- **Ports**: 
  - Database: 5432 (configurable via `DB_PORT`)
  - Adminer: 8080 (configurable via `ADMINER_PORT`)

## 🚀 Usage

### Start the database:
```bash
docker-compose up -d
```

### Access Adminer:
1. Open http://localhost:8080
2. Login with:
   - **System**: PostgreSQL
   - **Server**: db
   - **Username**: [your POSTGRES_USER]
   - **Password**: [your POSTGRES_PASSWORD]
   - **Database**: [your POSTGRES_DB]

### Connect from your app:
```
Host: localhost (or 'db' from within Docker network)
Port: 5432
Database: account_manager
Username: [from .env]
Password: [from .env]
```

## 📁 Files

- `docker-compose.yml` - Docker services configuration
- `.env` - **Secure credentials (DO NOT COMMIT)**
- `.env.example` - Template for environment variables
- `init-db/` - Database initialization scripts
  - `01-schema.sql` - Database schema
  - `02-sample-data.sql` - Sample data for testing

## 🔄 Reset Database

To completely reset the database:

```bash
docker-compose down -v  # Removes volumes (deletes all data)
docker-compose up -d    # Recreates with fresh data
```

## 🔒 Security Notes

- Always use strong passwords in production
- Never commit `.env` files
- Change default credentials before deployment
- Use Docker secrets in production environments
- Consider using managed database services for production