# DesterLib

This repository includes both the api and the web app for Dester App

## Docker Setup

### Development

```bash
docker-compose up
```

This will:

- Start PostgreSQL database
- Build and run the API with hot reload
- Automatically build the web app and serve it through the API

### Production

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

This will:

- Use the built container without volume mounts
- Serve the production build of the web app through the API
- Run the API in production mode

The API serves both the REST API endpoints and the built web application on port 3001.
