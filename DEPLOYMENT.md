# Debian VPS Deployment

The Vite frontend is served by Nginx. A localhost-only Node service handles private event inquiries and sends them through authenticated SMTP.

Node.js `20.19` or newer is required. Verify the deployed runtime before installing or restarting:

```bash
/usr/bin/node --version
```

If Node is installed elsewhere, replace `/usr/bin/node` in both this check and the systemd `ExecStart` with the same verified absolute path.

## SMTP Environment

Create `/home/DEPLOY_USER/maggiemaesaustin.com/.env` from `.env.example` and replace every placeholder with the SMTP provider's values:

```env
PORT=3001
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
EVENT_INQUIRY_FROM="Maggie Mae's Events <events@maggiemaesaustin.com>"
EVENT_INQUIRY_TO=info@maggiemaesaustin.com
```

Use port `465` with `SMTP_SECURE=true` for implicit TLS. Use port `587` with `SMTP_SECURE=false` for STARTTLS. The From address must be authorized by the SMTP provider.

Protect the environment file:

```bash
chmod 600 /home/DEPLOY_USER/maggiemaesaustin.com/.env
```

## systemd Service

Create `/etc/systemd/system/maggiemaes-api.service`:

```ini
[Unit]
Description=Maggie Mae's private event inquiry API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=DEPLOY_USER
Group=DEPLOY_USER
WorkingDirectory=/home/DEPLOY_USER/maggiemaesaustin.com
EnvironmentFile=/home/DEPLOY_USER/maggiemaesaustin.com/.env
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
[Install]
WantedBy=multi-user.target
```

Replace `DEPLOY_USER` with the account that owns the checkout, then enable the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now maggiemaes-api
sudo systemctl status maggiemaes-api
```

The API validates the SMTP connection before listening. Startup errors are available with:

```bash
sudo journalctl -u maggiemaes-api -n 100 --no-pager
```

## Nginx

Add a shared request zone inside the Nginx `http` block:

```nginx
limit_req_zone $binary_remote_addr zone=private_event_api:10m rate=10r/m;
```

Then add this location to the existing HTTPS server block:

```nginx
location /api/ {
    limit_req zone=private_event_api burst=5 nodelay;
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Validate and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Deploy Updates

Run from the checkout after each release:

```bash
git pull
npm install
npm run build
sudo systemctl restart maggiemaes-api
```

Nginx only needs reloading when its configuration changes.
