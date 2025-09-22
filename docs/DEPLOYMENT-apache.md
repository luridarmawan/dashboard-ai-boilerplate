# Apache Deployment Guide

This document provides instructions for deploying the application behind an Apache web server in a production environment.

## Prerequisites

- Apache HTTP Server installed
- mod_proxy and mod_proxy_http modules enabled
- Access to Apache configuration files

## Production Build

First, create a production build of the application:

```bash
npm run build
```

This will generate the optimized frontend files in the `dist` directory.

## Apache Configuration

When deploying behind Apache, use the following configuration:

```apache

<VirtualHost *:80>
    ServerName your.domain.tld
    DocumentRoot "/your/path/dist"
    ErrorLog "/your/log/path/your.domain.tld-error_log"
    CustomLog "/your/log/path/your.domain.tld-access_log" common

    # Set cache headers for static assets
    <LocationMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
        Header append Cache-Control "public, immutable"
    </LocationMatch>

    # API proxy configuration
    ProxyPreserveHost On
    ProxyRequests Off

    # Proxy for main API
    ProxyPass /api http://localhost:8082/api
    ProxyPassReverse /api http://localhost:8082/api

    # Proxy for AI API
    ProxyPass /api/ai http://localhost:8082/api/ai
    ProxyPassReverse /api/ai http://localhost:8082/api/ai

    # WebSocket proxy settings for AI streaming
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:8082/api/ai/$1" [P,L]

    # Proxy settings for websockets
    ProxyPass /api/ai/ws ws://localhost:8082/api/ai/ws
    ProxyPassReverse /api/ai/ws ws://localhost:8082/api/ai/ws

    <Directory "/your/path/dist">
        Require all granted
        AllowOverride All
        # Options +Indexes +FollowSymLinks
        Options -Indexes +FollowSymLinks
        Options -MultiViews

        RewriteEngine On
        RewriteBase /

        RewriteCond %{REQUEST_FILENAME} -f [OR]
        RewriteCond %{REQUEST_FILENAME} -d
        RewriteRule ^ - [L]

        RewriteRule ^ index.html [L]
    </Directory>
    DirectoryIndex index.html


</VirtualHost>
```

### Required Apache Modules

Ensure the following Apache modules are enabled:

```bash
# Required modules
a2enmod rewrite
a2enmod proxy
a2enmod proxy_http
a2enmod proxy_wstunnel
a2enmod headers
a2enmod expires
```

### Important Configuration Notes

The following configuration directives are critical for proper operation:

- `ProxyPreserveHost On` - Preserves the original Host header for proper routing
- `ProxyRequests Off` - Disables forward proxying for security
- WebSocket proxy settings - Essential for AI streaming functionality
- Rewrite rules - Required for proper SPA routing

These settings are especially important for the `/api/ai/*` endpoints to ensure proper streaming functionality.

## Environment Variables

Ensure all required environment variables from `.env` are properly configured in your production environment:

- `APP_PORT` - Port for the frontend application (default: 5173)
- `VITE_API_PORT` - Port for the API server (default: 8082)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- Email configuration settings
- AI API settings if using external AI services

## Starting the Application

After configuring Apache, start both the frontend and API server:

```bash
# Start the API server
npm run server

# Serve the frontend build (using a process manager like PM2)
npm run preview
```

It's recommended to use a process manager like PM2 to keep the applications running in production.

## SSL Configuration (Recommended)

For production deployments, always use HTTPS. Here's an example configuration with SSL:

```apache

<VirtualHost *:443>
    ServerName your.domain.tld
    DocumentRoot "/your/path/dist"
    ErrorLog "/your/log/path/your.domain.tld-error_log"
    CustomLog "/your/log/path/your.domain.tld-access_log" common

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/your/certificate.crt
    SSLCertificateKeyFile /path/to/your/private.key

    # HSTS Header
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"

    # Set cache headers for static assets
    <LocationMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
        Header append Cache-Control "public, immutable"
    </LocationMatch>

    # API proxy configuration
    ProxyPreserveHost On
    ProxyRequests Off

    # Proxy for main API
    ProxyPass /api http://localhost:8082/api
    ProxyPassReverse /api http://localhost:8082/api

    # Proxy for AI API
    ProxyPass /api/ai http://localhost:8082/api/ai
    ProxyPassReverse /api/ai http://localhost:8082/api/ai

    # WebSocket proxy settings for AI streaming
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:8082/api/ai/$1" [P,L]

    # Proxy settings for websockets
    ProxyPass /api/ai/ws ws://localhost:8082/api/ai/ws
    ProxyPassReverse /api/ai/ws ws://localhost:8082/api/ai/ws

    <Directory "/your/path/dist">
        Require all granted
        AllowOverride All
        # Options +Indexes +FollowSymLinks
        Options -Indexes +FollowSymLinks
        Options -MultiViews

        RewriteEngine On
        RewriteBase /

        RewriteCond %{REQUEST_FILENAME} -f [OR]
        RewriteCond %{REQUEST_FILENAME} -d
        RewriteRule ^ - [L]

        RewriteRule ^ index.html [L]
    </Directory>
    DirectoryIndex index.html


</VirtualHost>

# Redirect HTTP to HTTPS
<VirtualHost *:80>
    ServerName your.domain.tld
    Redirect permanent / https://your.domain.tld/
</VirtualHost>
```

Enable SSL module:
```bash
a2enmod ssl
