# Tazkarti

Tazkarti is a ticketing system built with a React/TypeScript frontend and an ASP.NET Core backend. The active backend is the `Tazkarti` folder.

## Tech Stack

- React, TypeScript, Vite, Tailwind CSS
- TanStack Query and TanStack Table
- ASP.NET Core 8, Identity, JWT cookies
- Entity Framework Core and SQL Server
- Redis reservation holds
- Cloudinary event images
- k6 load testing

## Local Setup

### Backend

```bash
cd Tazkarti
dotnet restore
dotnet run
```

Set real secrets through environment variables or .NET User Secrets:

```bash
dotnet user-secrets set "Jwt:Secret" "your-long-random-local-secret"
dotnet user-secrets set "Cloudinary:CloudName" "your-cloud-name"
dotnet user-secrets set "Cloudinary:ApiKey" "your-api-key"
dotnet user-secrets set "Cloudinary:ApiSecret" "your-api-secret"
dotnet user-secrets set "Seed:Admin:Password" "your-local-admin-password"
```

ASP.NET Core also accepts deployment environment variables such as `Jwt__Secret`, `Cloudinary__ApiSecret`, and `Seed__Admin__Password`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env` with:

```bash
VITE_API_URL=http://localhost:5262
```

## Demo Accounts

Demo usernames are useful for a deployed portfolio app, but reusable passwords should not be committed. Configure demo/admin passwords in the deployment environment, then document the current demo usernames in the deployed app or release notes.

## Booking Safety

The current booking flow uses Redis for temporary 5-minute holds and SQL Server as the final source of truth. Confirmation decrements event inventory with a conditional database update, so concurrent requests cannot reduce availability below zero.

## Roadmap

- Replace quantity-style booking with assigned-seat events only.
- Add venue, section, seat, event-seat, and booking-seat entities.
- Build an SVG seat map with pricing, accessibility, and a countdown.
- Add integration tests for high-contention booking scenarios.
- Add CI, Docker Compose, observability, payments, QR tickets, and check-in.

## Load Test

Pass a short-lived test JWT through the environment instead of hardcoding it:

```bash
k6 run -e TAZKARTI_JWT="your-test-token" grafana.js
```
