# Deploying LoseWeight.net

Mirrors how `satis.az` is set up on the same cPanel server.

## Server

- SSH: `ssh -p 21098 root@203.161.35.63` (hostname `nc-ph-5152.websiteca.com`, key auth)
- cPanel user: `ugn`
- PHP for this project: `/opt/cpanel/ea-php84/root/usr/bin/php`
- Node on the box: v20, `pm2` at `/usr/bin/pm2`

## How satis.az is wired, and what we copy

| Piece | satis.az | loseweight.net |
| --- | --- | --- |
| Frontend docroot | `/home/ugn/satis.az` (proxy only) | `/home/ugn/loseweight.net` |
| Frontend process | pm2 `next.satis.az` on 127.0.0.1:3034 | pm2 `next.loseweight.net` on 127.0.0.1:3044 |
| API docroot | `/home/ugn/api.satis.az/public` | `/home/ugn/loseweight-src/backend/public` |
| Database | `ugn_satisaz` | `ugn_loseweight` |

The public domain's document root holds nothing but an `.htaccess` that reverse-proxies
every request to the Next.js process on localhost. Laravel is served normally from the
API subdomain's `public/` directory.

satisaz is two separate repositories cloned twice. loseweight is a single monorepo cloned
once to `/home/ugn/loseweight-src`, so the API document root points into it and one
`git pull` updates backend and frontend together.

Two things cost real time on the first deploy, both worth knowing:

1. **The API subdomain needs PHP 8.4 with PHP-FPM.** Laravel 13 pulls Symfony 8
   components that require `>= 8.4.1`, enforced by `vendor/composer/platform_check.php`.
   Setting the version alone is not enough: without an FPM pool the vhost silently falls
   back to the system default (8.0 on this box) and every request returns the Composer
   platform error. Set it in MultiPHP Manager with PHP-FPM ticked.
2. **Changing a document root in cPanel may leave stale vhost blocks.** After repointing
   `loseweight.net`, `httpd.conf` contained four blocks for it (two with the old
   `public/` root, matched first) instead of two, producing a 502. WHM's Apache
   Configuration rebuild, or `/usr/local/cpanel/scripts/rebuildhttpdconf` followed by
   `apachectl graceful`, regenerates from `/var/cpanel/userdata` and clears them. Back up
   `httpd.conf` first and diff the other domains' blocks afterward.

## One-time setup

### 1. Subdomain and document roots (in WHM/cPanel)

- Create subdomain `api.loseweight.net` with document root
  `/home/ugn/loseweight-src/backend/public`, PHP version `ea-php84`, PHP-FPM enabled.
- Change `loseweight.net`'s document root from `/home/ugn/loseweight.net/public` to
  `/home/ugn/loseweight.net`. It currently points at a Laravel-style `public/` directory
  left over from an earlier attempt; the Next.js proxy needs the parent.
- Issue SSL for both `loseweight.net` and `api.loseweight.net` (AutoSSL).

### 2. Proxy .htaccess

Create `/home/ugn/loseweight.net/.htaccess`, matching satis.az:

```apache
DirectoryIndex disabled
RewriteEngine On

RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
RewriteRule ^(.*)$ https://%1/$1 [R=301,L]

RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

RewriteRule ^$ http://127.0.0.1:3044/ [P,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:3044/$1 [P,L]
```

Keep the `.well-known` directory so AutoSSL renewals keep working.

### 3. Database

```sql
CREATE DATABASE ugn_loseweight CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ugn_loseweight'@'localhost' IDENTIFIED BY '<password>';
GRANT ALL PRIVILEGES ON ugn_loseweight.* TO 'ugn_loseweight'@'localhost';
```

### 4. Clone and install

```bash
su - ugn
cd /home/ugn

git clone https://github.com/rashad404/loseweight.git loseweight-src
# api.loseweight.net's document root points straight at
# /home/ugn/loseweight-src/backend/public. No symlink needed.

cd /home/ugn/loseweight-src/backend
composer install --optimize-autoloader --no-dev
cp .env.example .env
# fill in the production values below
/opt/cpanel/ea-php84/root/usr/bin/php artisan key:generate
/opt/cpanel/ea-php84/root/usr/bin/php artisan migrate --force
/opt/cpanel/ea-php84/root/usr/bin/php artisan db:seed --force
/opt/cpanel/ea-php84/root/usr/bin/php artisan storage:link
chmod -R 775 storage bootstrap/cache
chown -R ugn:ugn storage bootstrap/cache

cd /home/ugn/loseweight-src/frontend
npm ci
cp .env.example .env.production
# fill in the production values below
npm run build
pm2 start npm --name next.loseweight.net -- start -- -p 3044
pm2 save
```

The proxy document root `/home/ugn/loseweight.net` stays a thin directory holding only
`.htaccess` and `.well-known`, exactly like `/home/ugn/satis.az`.

## Environment

### `backend/.env`

```
APP_NAME=LoseWeight
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.loseweight.net
FRONTEND_URL=https://loseweight.net

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=ugn_loseweight
DB_USERNAME=ugn_loseweight
DB_PASSWORD=<password>

CORS_ALLOWED_ORIGINS=https://loseweight.net,https://www.loseweight.net
SANCTUM_STATEFUL_DOMAINS=loseweight.net

WALLET_API_URL=https://api.kimlik.az/api
WALLET_URL=https://kimlik.az
WALLET_CLIENT_ID=<oauth client id>
WALLET_CLIENT_SECRET=<oauth client secret>

ADMIN_SEED_PASSWORD=<strong password, only used by the seeder>
```

### `frontend/.env.production`

```
NEXT_PUBLIC_API_URL=https://api.loseweight.net/api
NEXT_PUBLIC_SITE_URL=https://loseweight.net

NEXT_PUBLIC_WALLET_URL=https://kimlik.az
NEXT_PUBLIC_WALLET_API_URL=https://api.kimlik.az/api
NEXT_PUBLIC_WALLET_CLIENT_ID=<oauth client id>
```

`NEXT_PUBLIC_SITE_URL` feeds `sitemap.xml`, `robots.txt`, and every canonical tag. If it
is wrong, search engines index the wrong host, so check it before the first deploy.

## Routine deploys

```bash
su - ugn
cd /home/ugn/loseweight-src && git pull

# Backend
cd backend
composer install --optimize-autoloader --no-dev
/opt/cpanel/ea-php84/root/usr/bin/php artisan migrate --force
/opt/cpanel/ea-php84/root/usr/bin/php artisan config:cache
/opt/cpanel/ea-php84/root/usr/bin/php artisan route:cache

# Frontend
cd ../frontend
npm ci
npm run build
pm2 restart next.loseweight.net
```

For zero-downtime frontend deploys, copy the satis.az `build-production.sh` pattern:
build into a sibling directory, then swap it in and restart pm2, so the running site is
never serving a half-built `.next`.

## Checks after deploying

```bash
curl -sI https://loseweight.net | head -1
curl -s https://api.loseweight.net/api/health
curl -s https://loseweight.net/sitemap.xml | head -5
curl -s -o /dev/null -w '%{http_code}\n' https://loseweight.net/az/guides
curl -s -o /dev/null -w '%{http_code}\n' https://loseweight.net/guides/kalori-defisiti
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://loseweight.net/en/planner
```

`/az/guides` should be 200 with Azerbaijani guides listed. `/guides/kalori-defisiti`
should be 404, because guides do not cross locales. `/en/planner` should be a 308 to
`/planner`: English is the default locale and lives at the root, so it carries no prefix,
and the old prefixed URLs redirect permanently.
