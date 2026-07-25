# Tazkarti

Tazkarti is a full-stack event ticketing system with assigned-seat booking, an admin event dashboard, Redis seat reservations.

## Tech Stack

- React, TypeScript, Vite, Tailwind CSS
- ASP.NET Core 8, Identity, JWT cookies
- Entity Framework Core, SQL Server
- Redis for temporary seat locks
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
- `redis`: Redis seat locks

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
- Full-stack Playwright tests with SQL Server and Redis service containers
- Playwright reports and failure artifacts
- Build docker images and push them to registery
