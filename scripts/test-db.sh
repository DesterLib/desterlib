#!/bin/bash

# Script to manage the test PostgreSQL database for local development

case "$1" in
  start)
    echo "Starting test PostgreSQL database..."
    docker-compose -f docker-compose.test.yml up -d
    echo "Test database is running on port 5433"
    echo "Connection string: postgresql://postgres:postgres@localhost:5433/desterlib_test"
    ;;
  stop)
    echo "Stopping test PostgreSQL database..."
    docker-compose -f docker-compose.test.yml down
    ;;
  restart)
    echo "Restarting test PostgreSQL database..."
    docker-compose -f docker-compose.test.yml restart
    ;;
  status)
    docker-compose -f docker-compose.test.yml ps
    ;;
  logs)
    docker-compose -f docker-compose.test.yml logs -f postgres
    ;;
  reset)
    echo "Resetting test database (this will remove all data)..."
    docker-compose -f docker-compose.test.yml down -v
    docker-compose -f docker-compose.test.yml up -d
    echo "Waiting for database to start..."
    sleep 5
    echo "Running migrations after reset..."
    cd apps/api
    DATABASE_URL="postgresql://postgres:postgres@localhost:5433/desterlib_test" npx prisma migrate dev --name init
    cd ../..
    echo "Test database has been reset and migrated"
    ;;
  migrate)
    echo "Running Prisma migrations..."
    cd apps/api
    DATABASE_URL="postgresql://postgres:postgres@localhost:5433/desterlib_test" npx prisma migrate dev --name init
    ;;
  push)
    echo "Pushing schema to database..."
    cd apps/api
    DATABASE_URL="postgresql://postgres:postgres@localhost:5433/desterlib_test" npx prisma db push
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs|reset|migrate|push}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the test database"
    echo "  stop    - Stop the test database"
    echo "  restart - Restart the test database"
    echo "  status  - Show database status"
    echo "  logs    - Show database logs"
    echo "  reset   - Reset database (removes all data)"
    echo "  migrate - Run Prisma migrations"
    echo "  push    - Push Prisma schema to database"
    exit 1
    ;;
esac
