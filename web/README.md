# Web

This folder contains the standalone web app for the extension:

- `frontend/`: React + Create React App
- `backend/`: Spring Boot + Maven

## Structure

```text
web/
  frontend/
  backend/
```

## Requirements

- Node.js 16-18 recommended
- Java 21+
- Maven

## Frontend compatibility note

The frontend uses `react-scripts@3` and Webpack 4. On newer Node/OpenSSL combinations this can fail with:

```text
error:0308010C:digital envelope routines::unsupported
```

The npm `start` and `build` scripts in `frontend/package.json` already include:

```text
NODE_OPTIONS=--openssl-legacy-provider
```

so `npm start` and `npm run build` work without manually exporting that flag.

## Run frontend

```bash
cd web/frontend
npm install
npm start
```

Frontend URL:

```text
http://localhost:3000
```

Build frontend:

```bash
cd web/frontend
npm run build
```

## Run backend

If you are using VS Code, use the helper script below. Spring Boot DevTools can restart on file changes, but VS Code does not always recompile Java classes automatically while the app is running, so source changes may not be applied after save.

```bash
cd web/backend
sh ./dev.sh
```

This script watches `src/main/java` and `src/main/resources`, runs `mvn compile` when files change, and lets Spring Boot DevTools restart with freshly compiled classes.

If you are using IntelliJ, `./mvnw spring-boot:run` is correct only if auto-build while the app is running is enabled. With that setting on, you can run the backend directly with Maven:

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
npm start
```

3. Open:

```text
http://localhost:3000
```

## Current API

- `GET /api/health`

## Notes

- The frontend is set up to call the backend at `http://localhost:8080`.
- This structure is intended for an extension intro site now and account management later.
