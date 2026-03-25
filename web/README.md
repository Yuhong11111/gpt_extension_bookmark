# Web

This folder contains the standalone web app for the extension:

- `frontend/`: React + Vite
- `backend/`: Spring Boot + Maven

## Structure

```text
web/
  frontend/
  backend/
```

## Requirements

- Node.js 16
- Java 21+
- Maven

## Run frontend

```bash
cd web/frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

Build frontend:

```bash
cd web/frontend
npm run build
```

## Run backend

```bash
cd web/backend
./mvnw spring-boot:run
```

Backend URL:

```text
http://localhost:8080
http://localhost:8080/api/health
```

Test backend:

```bash
cd web/backend
./mvnw test
```

If you want Maven dependencies stored inside this project instead of `~/.m2`:

```bash
cd web/backend
./mvnw -Dmaven.repo.local=.m2/repository spring-boot:run
```

```bash
cd web/backend
./mvnw -Dmaven.repo.local=.m2/repository test
```

## Run the full web app

1. Start the backend:

```bash
cd web/backend
./mvnw spring-boot:run
```

2. Start the frontend in another terminal:

```bash
cd web/frontend
npm install
npm run dev
```

3. Open:

```text
http://localhost:5173
```

## Current API

- `GET /api/health`

## Notes

- The frontend is set up to call the backend at `http://localhost:8080`.
- This structure is intended for an extension intro site now and account management later.
