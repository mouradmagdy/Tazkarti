# Tazkarti

Tazkarti is a full-stack event ticketing system with assigned-seat booking and an admin event dashboard.

## Tech Stack

- React, TypeScript, Vite, Tailwind CSS
- ASP.NET Core 8, Identity, JWT cookies
- Entity Framework Core, SQL Server
- Atomic SQL Server seat holds with automatic expiry
- Cloudinary for event images
- Playwright and GitHub Actions
- Docker, Docker Compose, Nginx

## Main Features

- Browse upcoming events
- View event details and assigned-seat maps
- Reserve seats with a countdown hold
- Confirm bookings without double-selling seats
- Allow users to book multiple different seats for the same event
- Admin event and venue layout management
- Seeded demo events and venue layouts

## Local Development

Backend:

```bash
cd Tazkarti
dotnet restore
dotnet run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:5262
```

Use environment variables or .NET User Secrets for local secrets:

```bash
dotnet user-secrets set "Jwt:Secret" "your-long-random-secret"
dotnet user-secrets set "Cloudinary:CloudName" "your-cloud-name"
dotnet user-secrets set "Cloudinary:ApiKey" "your-api-key"
dotnet user-secrets set "Cloudinary:ApiSecret" "your-api-secret"
dotnet user-secrets set "Seed:Admin:Password" "your-admin-password"
```

## Docker Deployment

Run the full stack locally behind Nginx:

```bash
docker compose up --build
```

Open:

```bash
http://localhost:8080
```

Services:

- `frontend`: React production build served by Nginx
- `api`: ASP.NET Core backend
- `sqlserver`: SQL Server database

Stop containers:

```bash
docker compose down
```

Remove containers and local volumes:

```bash
docker compose down -v
```

Optional Docker environment overrides are documented in `.env.docker.example`.

## Tests

Frontend checks:

```bash
cd frontend
npm run lint
npm run build
npm run test:e2e
```

Backend build:

```bash
dotnet build Tazkarti/Tazkarti.csproj
```

Full-stack E2E tests require a running backend:

```powershell
cd frontend
$env:E2E_API_URL="http://localhost:8080"
npm run test:e2e:full
```

## CI/CD

GitHub Actions currently runs:

- Backend restore/build
- Frontend install/lint/build
- Playwright browser tests
- Full-stack Playwright tests with a SQL Server service container
- Playwright reports and failure artifacts
- Build Docker images and push them to the registry
- Deploy the API to MonsterASP.NET from the `deployment-monster-vercel` branch

## MonsterASP.NET + Vercel Deployment

This branch is designed for a Vercel frontend and a MonsterASP.NET API + SQL Server database. Use a Monster plan with HTTPS so the Vercel-to-Monster connection and authentication flow remain encrypted.

### 1. MonsterASP.NET

Create a .NET 8 website and an MSSQL database. In the website's environment-variable settings, add:

```text
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=<Monster MSSQL connection string>
Jwt__Secret=<at least 32 random characters>
Cloudinary__CloudName=<cloud name>
Cloudinary__ApiKey=<API key>
Cloudinary__ApiSecret=<API secret>
AllowedOrigins__0=https://<your-vercel-production-domain>
Auth__CookieSecure=true
Auth__CookieSameSite=None
Seed__Admin__Username=admin
Seed__Admin__Password=<strong one-time admin password>
Seed__Admin__FullName=Platform Admin
Seed__Admin__Gender=male
Seed__DemoData__Enabled=true
Seed__DemoData__ResetEvents=false
```

The API applies EF Core migrations on startup. `Seed__DemoData__Enabled=true` seeds six future-dated events only when the event table is empty; it does not erase bookings.

Enable WebDeploy in Monster's control panel, then add these GitHub environment secrets under the `production` environment:

```text
MONSTER_WEBSITE_NAME=siteXXXXX
MONSTER_SERVER_URL=https://siteXXXXX.siteasp.net:8172
MONSTER_USERNAME=siteXXXXX
MONSTER_PASSWORD=<WebDeploy password>
```

After adding the secrets, push a backend change to this branch to deploy. You can also manually rerun **Deploy API to MonsterASP.NET** after its first run. Verify `https://<api-host>/health` returns `{"status":"healthy"}`.

### 2. Vercel

Import this repository into Vercel with these project settings:

```text
Root Directory: frontend
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

The included rewrite proxies `/api/*` to `https://tazkarti-mourad.runasp.net` so the authentication cookie remains first-party. Leave both `API_ORIGIN` and `VITE_API_URL` unset in Vercel. After Vercel assigns the final production URL, make sure it exactly matches `AllowedOrigins__0` on Monster, then restart the API. Do not include a trailing slash in either URL.

### Secret rotation

A Cloudinary API secret was previously present in tracked configuration. Rotate that secret in Cloudinary before deployment and store the replacement only in Monster's environment variables.
