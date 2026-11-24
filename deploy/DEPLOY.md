# Deploying VINC Code to code.vinc-lab.com

Target: the VPS at `45.195.129.15`, which already runs other sites behind **Caddy** with **Docker**.
VINC Code runs as one container (`vinc-code`). Caddy handles HTTPS and forwards
`code.vinc-lab.com` to it. Nothing else on the server is touched.

## 0. Before you start

- DNS: `dig +short code.vinc-lab.com` should print `45.195.129.15`.
- Find out how Caddy runs on the VPS:
  ```bash
  docker ps --format '{{.Names}}  {{.Image}}' | grep -i caddy
  ```
  - Prints a container (e.g. `caddy  caddy:2`) → **Option B: Caddy in Docker**.
  - Prints nothing → check `systemctl status caddy`. If it is running → **Option A: Caddy on the host**.
- Option A only: check that port 3100 is free. `ss -ltnp | grep ':3100'` should print nothing.
  If it is taken, use another port in `docker-compose.yml` and in the Caddyfile below.

## 1. Get the code onto the VPS

The repository is private, so the VPS needs read access: add a read-only **deploy key**
(GitHub → repo → Settings → Deploy keys) or use a fine-grained token.

```bash
sudo mkdir -p /opt/vinc-code && sudo chown "$USER" /opt/vinc-code
git clone git@github.com:bhavansh-arora/vinc-code.git /opt/vinc-code
cd /opt/vinc-code
git checkout main   # or the branch you are deploying
```

## 2. Create the .env file

```bash
cd /opt/vinc-code
echo "ADMIN_USERNAME=admin" > .env
echo "ADMIN_PASSWORD=$(openssl rand -base64 24)" >> .env
chmod 600 .env
cat .env   # save this password in your password manager
```

The first VINC admin is created from these values the first time the app starts.

## 3. Option B only: join Caddy's Docker network

Find the network Caddy's container is on:

```bash
docker inspect <caddy-container> --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

In `docker-compose.yml`, delete the two `ports:` lines, uncomment the two `networks:` lines under the
service and the `networks:` block at the bottom, and replace `caddy` with that network's name.

## 4. Build and start

```bash
cd /opt/vinc-code
docker compose up -d --build
docker compose ps                 # STATUS should become "healthy" within a minute
docker compose logs --tail 20     # shows: Created the first VINC admin "admin"
```

Option A check: `curl http://127.0.0.1:3100/api/health` prints `{"ok":true}`.

## 5. Add the site to Caddy

Add this block to your Caddyfile, next to your other sites.

**Option A (Caddy on the host)**, usually `/etc/caddy/Caddyfile`:
```caddyfile
code.vinc-lab.com {
	encode zstd gzip
	reverse_proxy 127.0.0.1:3100
}
```
```bash
sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy
```

**Option B (Caddy in Docker)**, in the Caddyfile that container uses:
```caddyfile
code.vinc-lab.com {
	encode zstd gzip
	reverse_proxy vinc-code:3000
}
```
```bash
docker exec <caddy-container> caddy validate --config /etc/caddy/Caddyfile
docker exec <caddy-container> caddy reload --config /etc/caddy/Caddyfile
```

`reload` applies the change without restarting your other sites. Caddy gets the HTTPS
certificate for `code.vinc-lab.com` automatically on the first visit.

## 6. First sign-in

1. Open https://code.vinc-lab.com and sign in with the admin username and password from `.env`.
2. Remove the password from the server and restart the container:
   ```bash
   sed -i '/^ADMIN_PASSWORD=/d' .env && docker compose up -d
   ```
3. In the admin dashboard, add your first school. Do **not** run `npm run seed` on this server;
   it is for demo data only.

## 7. Daily backups

The database lives in the Docker volume `vinc-code_vinc-data`. Create a backup script:

```bash
mkdir -p /opt/vinc-backups && cat > /opt/vinc-backups/backup.sh <<'SCRIPT'
#!/bin/sh
# Daily VINC Code database backup. Keeps 30 days.
set -e
docker exec vinc-code rm -f /app/data/backup.db
docker exec vinc-code node -e "new (require('node:sqlite').DatabaseSync)('/app/data/vinc.db').exec(\"VACUUM INTO '/app/data/backup.db'\")"
docker cp vinc-code:/app/data/backup.db "/opt/vinc-backups/vinc-$(date +%F).db"
docker exec vinc-code rm -f /app/data/backup.db
find /opt/vinc-backups -name 'vinc-*.db' -mtime +30 -delete
SCRIPT
chmod 700 /opt/vinc-backups/backup.sh
```

Test it once, then schedule it for 02:15 every night (this adds the line to root's crontab for you):

```bash
/opt/vinc-backups/backup.sh && ls -l /opt/vinc-backups
(crontab -l 2>/dev/null | grep -v vinc-backups/backup.sh; echo '15 2 * * * /opt/vinc-backups/backup.sh >> /opt/vinc-backups/backup.log 2>&1') | crontab -
```

`VACUUM INTO` will not overwrite an existing file, which is why the script removes `backup.db` before and after.
Copy backups off the server too, for example to cloud storage.

## Updating

Take a backup first, then pull and rebuild:

```bash
/opt/vinc-backups/backup.sh
cd /opt/vinc-code
git pull
docker compose up -d --build
```

When an update changes the database structure, the app upgrades the database by itself on its first start,
inside a transaction, keeping all data.

The database is kept in the volume, so updates never touch student data.
To roll back: `git checkout <previous-commit> && docker compose up -d --build`.

## Troubleshooting

| Symptom | Check |
|---|---|
| Caddy shows 502 | `docker compose ps` (is it healthy?). Option B: is the container on Caddy's network? |
| Certificate error | DNS must point to the VPS, and ports 80 and 443 must be open. Check `journalctl -u caddy` or `docker logs <caddy-container>`. |
| Cannot sign in at all | `docker compose logs`. If no admin was created, ADMIN_PASSWORD was missing or shorter than 12 characters. |
| Locked out after wrong passwords | Wait 10 minutes. |
