<!--
  @AUTHOR: Garima Mittal
  @FILE: ROUTES.md
  @RESPONSIBILITY: Complete catalog of API endpoints, HTTP verbs, RBAC access gates, and payload schemas.
  @DEPENDENCIES: server.js, all route definitions
-->

# SolIMS ERP — Complete API Routing Directory

## 1. Authentication & Persona Subdomain (`/api/auth`)
| Method | Endpoint | RBAC Tier | Controller Handler | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | `handleUserLogin` | Authenticates email & password, sets JWT cookie |
| `POST` | `/api/auth/switch-persona` | Public | `handleDemoPersonaSwitch` | Instant 1-click persona switch for hackathon judges |
| `POST` | `/api/auth/logout` | Authenticated | `handleUserLogout` | Terminates JWT session cookie |
| `GET` | `/api/auth/profile` | Authenticated | `handleGetSessionProfile` | Returns currently active user session object |

## 2. Inquiries & Technical Survey Subdomain (`/api/leads`)
| Method | Endpoint | RBAC Tier | Controller Handler | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/leads` | Public | `handleCreateInquiry` | Creates new rooftop solar inquiry (`INQ/2026/0001`) with zero login |
| `GET` | `/api/leads/track/:query` | Public | `handleTrackOrderOrInquiry` | Public tracking lookup by reference code or phone |
| `GET` | `/api/leads` | Authenticated | `handleGetAllInquiries` | Fetches all inquiries with survey details |
| `GET` | `/api/leads/:id` | Authenticated | `handleGetInquiryById` | Fetches single inquiry record |
| `POST` | `/api/leads/:id/schedule-survey` | `ADMIN`, `OPERATIONS` | `handleScheduleSurvey` | Assigns technician for on-site roof measurement visit |
| `POST` | `/api/leads/:id/record-survey` | `ADMIN`, `OPERATIONS`, `STAFF` | `handleRecordSurveyResults` | Records tilt, azimuth, cable drop, and roof type |
| `POST` | `/api/leads/:id/approve-survey` | `ADMIN`, `OPERATIONS` | `handleApproveSurvey` | Operational approval gate unlocking commercial quoting |

## 3. Commercial Quotes & Project Orders (`/api/orders`)
| Method | Endpoint | RBAC Tier | Controller Handler | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/orders` | Authenticated | `handleGetAllOrders` | Lists all commercial quotes and project orders |
| `GET` | `/api/orders/:id` | Authenticated | `handleGetOrderById` | Fetches single order with full BOM breakdown |
| `POST` | `/api/orders/generate-quote` | `ADMIN`, `OPERATIONS` | `handleGenerateQuote` | Auto-generates BOM and proposal (`QT/2026/0001`) |
| `POST` | `/api/orders/:id/advance-payment`| `ADMIN`, `OPERATIONS` | `handleCaptureAdvancePayment` | Captures >= 20% advance, records double-entry journal, unlocks dispatch |
| `POST` | `/api/orders/:id/assign-crew` | `ADMIN`, `OPERATIONS` | `handleAssignCrew` | Schedules installation date and crew members |

## 4. Warehouse Inventory & Serial Dispatch (`/api/inventory`)
| Method | Endpoint | RBAC Tier | Controller Handler | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/inventory` | Authenticated | `handleGetWarehouseInventory` | Lists all serialized hardware stock in warehouse |
| `POST` | `/api/inventory/scan-serial` | `ADMIN`, `OPERATIONS` | `handleScanSerialForOrder` | Validates scanned barcode against order BOM |
| `POST` | `/api/inventory/confirm-dispatch`| `ADMIN`, `OPERATIONS` | `handleConfirmDispatch` | Dispatches order, creates double-entry stock moves, and starts warranty clocks |

## 5. Field Service, Roof Sign-off & Breakdown Tickets (`/api/service`)
| Method | Endpoint | RBAC Tier | Controller Handler | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/service/roof-signoff` | `ADMIN`, `STAFF`, `OPERATIONS` | `handleSubmitRoofSignoff` | Logs start/finish time, generation watts, photos, and homeowner signature |
| `GET` | `/api/service/warranty-lookup` | Authenticated | `handleWarrantyLookup` | Real-time warranty evaluation by serial/customer |
| `GET` | `/api/service/tickets` | Authenticated | `handleGetAllTickets` | Lists all customer service breakdown tickets |
| `POST` | `/api/service/tickets` | Authenticated | `handleCreateTicket` | Files breakdown ticket with auto-calculated ₹0 vs billable charges |
| `POST` | `/api/service/tickets/:id/resolve`| `ADMIN`, `OPERATIONS`, `STAFF` | `handleResolveTicket` | Resolves ticket with customer working confirmation |

## 6. Accounting & Executive P&L Subdomain (`/api/accounting`)
| Method | Endpoint | RBAC Tier | Controller Handler | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/accounting/director-summary`| `ADMIN`, `OPERATIONS` | `handleGetDirectorSummary` | Month-end P&L, project margin metrics, subsidy pipeline |
| `GET` | `/api/accounting/ledger` | `ADMIN` | `handleGetGeneralLedger` | Full double-entry general ledger records |

## 7. Diagnostics Subdomain (`/api/diagnostics`)
| Method | Endpoint | RBAC Tier | Controller Handler | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/diagnostics/telemetry` | `ADMIN` | `handleGetSystemTelemetry` | Live V8 heap memory, uptime, and database metrics |
| `GET` | `/api/health` | Public | Inline handler | Basic HTTP alive check |
