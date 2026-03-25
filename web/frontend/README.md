# Frontend

This frontend is a React app built with Create React App (`react-scripts@3.4.1`), `styled-components`, and `react-router-dom`.

## Requirements

- Node.js 16-18 recommended
- npm

## Run locally

```bash
npm install
npm start
```

Dev server:

```text
http://localhost:3000
```

## Build

```bash
npm run build
```

## Compatibility note

This project uses Webpack 4 through `react-scripts@3`. On newer Node/OpenSSL versions, that stack can throw:

```text
error:0308010C:digital envelope routines::unsupported
```

The package scripts already include:

```text
NODE_OPTIONS=--openssl-legacy-provider
```

so no extra shell setup is required before running `npm start` or `npm run build`.

## Tech stack

- React 17
- Create React App
- Styled Components
- React Router
