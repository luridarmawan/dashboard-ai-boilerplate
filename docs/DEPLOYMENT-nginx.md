# Deployment Guide

This document provides instructions for deploying the application in a production environment, including nginx configuration.

## Production Build

First, create a production build of the application:

```bash
npm run build
```

This will generate the optimized frontend files in the `dist` directory.

## Nginx Configuration

When deploying behind nginx, use the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend files
    location / {
        root /path/to/your/app/dist;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy
    location /api {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
    
    # AI API proxy (if needed)
    location /api/ai {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
}
```

### Important Configuration Notes

The following configuration directives are critical for proper operation:

- `proxy_http_version 1.1;` - Ensures HTTP/1.1 is used for better connection handling
- `proxy_set_header Connection "";` - Clears the Connection header for HTTP/1.1 keep-alive
- `proxy_buffering off;` - Disables buffering for real-time responses, especially important for AI streaming endpoints

These settings are especially important for the `/api/ai/*` endpoints to ensure proper streaming functionality.

## Environment Variables

Ensure all required environment variables from `.env.example` are properly configured in your production environment:

- `APP_PORT` - Port for the frontend application (default: 5173)
- `VITE_API_PORT` - Port for the API server (default: 8082)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- Email configuration settings
- AI API settings if using external AI services

## Starting the Application

After configuring nginx, start both the frontend and API server:

```bash
# Start the API server
npm run server

# Serve the frontend build (using a process manager like PM2)
npm run preview
```

It's recommended to use a process manager like PM2 to keep the applications running in production.