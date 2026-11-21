<!--
  @AUTHOR: Garima Mittal
  @FILE: ENVIRONMENT.md
  @RESPONSIBILITY: Environment variable definitions, default configuration fallbacks, and security credentials.
  @DEPENDENCIES: erpConfig.js, db.js
-->

# SolIMS ERP — Environment Configuration

## 1. Backend Runtime Environment (`server/.env`)
| Variable Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Number | `5000` | Express HTTP server listening port |
| `CLIENT_ORIGIN` | String | `http://localhost:5173` | Permitted CORS frontend origin |
| `MONGODB_URI` | String | `mongodb://127.0.0.1:27017/solims` | MongoDB connection URI with auto-fallback to `MongoMemoryServer` |
| `JWT_SECRET` | String | `solims_super_secure_jwt_secret_2026` | Cryptographic secret for signing session tokens |
| `NODE_ENV` | String | `development` | Runtime mode (`development`, `production`, `test`) |

## 2. Frontend Runtime Environment (`client/.env`)
| Variable Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | String | `/api` | Proxy endpoint root mapped to port `5000` |
| `VITE_APP_TITLE`| String | `SolIMS ERP` | Title displayed in browser tab |

## 3. Seed Personas & Access Credentials
| Persona Role | Email Address | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Director / Admin** | `admin@solims.com` | `admin123` | Full access: P&L analytics, subsidies, diagnostics, overrides |
| **Operations Manager**| `ops@solims.com` | `ops123` | Leads approval, BOM dispatch, stock moves, warranty tickets |
| **Field Technician** | `tech@solims.com` | `tech123` | Survey measurements, roof installation logs, signature upload |
| **Homeowner Client** | `customer@solims.com` | `customer123`| View project stage, warranty card, signoff copy, request ticket |
