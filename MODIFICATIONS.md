<!--
  @AUTHOR: Garima Mittal
  @FILE: MODIFICATIONS.md
  @RESPONSIBILITY: Complete audit log of every file created, modified, and its single architectural responsibility.
  @DEPENDENCIES: None
-->

# SolIMS ERP — Comprehensive File & Module Modification Log

| File Path | Author | Responsibility Summary |
| :--- | :--- | :--- |
| `CONTEXT.md` | Garima Mittal | High-density architectural constitution, sequences, and business rules index. |
| `IMPLEMENTATION_PLAN.md` | Garima Mittal | 7-milestone execution blueprint with file paths, schemas, APIs, and verification gates. |
| `ARCHITECTURE.md` | Garima Mittal | Technical specification of SolIMS ERP architecture, data flows, and Odoo design patterns. |
| `ROUTES.md` | Garima Mittal | Complete catalog of API endpoints, HTTP verbs, RBAC access gates, and payload schemas. |
| `STATE.md` | Garima Mittal | State transition matrices, finite state machine (FSM) guardrails, and lifecycle freeze rules. |
| `ENVIRONMENT.md` | Garima Mittal | Environment variable definitions, default configuration fallbacks, and security credentials. |
| `MODIFICATIONS.md` | Garima Mittal | Complete audit log of every file created, modified, and its architectural responsibility. |
| `README.md` | Garima Mittal | Executive documentation with Mermaid architecture & FSM diagrams, ERD, and demo instructions. |
| `server/package.json` | Garima Mittal | Backend dependencies and run scripts. |
| `server/src/server.js` | Garima Mittal | Express server entry point, Socket.IO gateway, middleware pipeline, and route registration. |
| `server/src/config/erpConfig.js` | Garima Mittal | Enterprise configuration parameters, pricing models, warranty policies, and sequence formats. |
| `server/src/config/db.js` | Garima Mittal | Resilient MongoDB connection with automatic MongoMemoryServer fallback. |
| `server/src/core/sequenceRegistry.js` | Garima Mittal | Atomic Odoo ir.sequence code generation and self-healing index synchronization. |
| `server/src/core/socketEmitter.js` | Garima Mittal | Global Socket.IO instance and ERP real-time event broadcaster. |
| `server/src/middleware/authMiddleware.js` | Garima Mittal | Authenticates requests by verifying JWT sessions from cookies or authorization headers. |
| `server/src/middleware/rbacMiddleware.js` | Garima Mittal | Enforces role-based access control policies across protected ERP service routes. |
| `server/src/middleware/validateMiddleware.js` | Garima Mittal | Enforces Zod boundary validation schemas against incoming request bodies. |
| `server/src/middleware/errorHandler.js` | Garima Mittal | Centralized exception handling, structured JSON formatting, and telemetry logging. |
| `server/src/modules/auth/user.model.js` | Garima Mittal | Mongoose schema defining SolIMS user credentials, contact details, and RBAC tier. |
| `server/src/modules/auth/auth.validation.js` | Garima Mittal | Zod boundary schemas for authenticating users and demo persona switching requests. |
| `server/src/modules/auth/auth.service.js` | Garima Mittal | User credential verification, JWT token generation, and demo persona switching. |
| `server/src/modules/auth/auth.controller.js` | Garima Mittal | Authentication endpoints, cookie assignment, and persona switching handlers. |
| `server/src/modules/auth/auth.routes.js` | Garima Mittal | Express router defining endpoints for login, demo persona switcher, and session inspection. |
| `server/src/modules/leads/lead.model.js` | Garima Mittal | Mongoose schema for rooftop solar inquiries, technical surveys, and approval workflows. |
| `server/src/modules/leads/lead.validation.js` | Garima Mittal | Zod schemas for inquiries, survey scheduling, and technical survey outcomes. |
| `server/src/modules/leads/lead.service.js` | Garima Mittal | Rooftop inquiry intake, survey scheduling, technical measurements, and approval workflow. |
| `server/src/modules/leads/lead.controller.js` | Garima Mittal | Controllers handling lead creation, survey bookings, and approvals. |
| `server/src/modules/leads/lead.routes.js` | Garima Mittal | Express router defining inquiry endpoints, survey measurements, and approval security gates. |
| `server/src/modules/orders/order.model.js` | Garima Mittal | Mongoose schema for quotations, confirmed project orders, BOM line items, and payment status. |
| `server/src/modules/orders/order.validation.js` | Garima Mittal | Zod boundary schemas for generating quotes, capturing payments, and updating order status. |
| `server/src/modules/orders/order.service.js` | Garima Mittal | Auto-generates exact BOM, manages commercial quotes, captures advance payments, schedules crews. |
| `server/src/modules/orders/order.controller.js` | Garima Mittal | Controllers handling quotation creation, advance collection, and crew scheduling. |
| `server/src/modules/orders/order.routes.js` | Garima Mittal | Express router for auto-BOM quote generation, advance payments, and crew assignments. |
| `server/src/modules/inventory/serialAsset.model.js` | Garima Mittal | Mongoose schema tracking unique hardware serial numbers, lifecycle states, and warranty timestamps. |
| `server/src/modules/inventory/stockMove.model.js` | Garima Mittal | Mongoose schema recording immutable double-entry inventory transactions between stock nodes. |
| `server/src/modules/inventory/inventory.validation.js` | Garima Mittal | Zod schemas for scanning hardware serials, validating dispatch lists, and registering stock. |
| `server/src/modules/inventory/inventory.service.js` | Garima Mittal | Warehouse serial scanning, double-entry stock movements, and automatic warranty clock initiation. |
| `server/src/modules/inventory/inventory.controller.js` | Garima Mittal | Controllers handling warehouse stock, serial scanning, and dispatch confirmation. |
| `server/src/modules/inventory/inventory.routes.js` | Garima Mittal | Express router for stock inventory, serial scanning, and dispatch processing. |
| `server/src/modules/service/siteLog.model.js` | Garima Mittal | Mongoose schema recording field installation execution logs, roof photos, and digital signatures. |
| `server/src/modules/service/ticket.model.js` | Garima Mittal | Mongoose schema tracking customer breakdown tickets, live warranty evaluations, and repair billing. |
| `server/src/modules/service/service.validation.js` | Garima Mittal | Zod schemas for roof signoff logging, warranty lookups, and support ticket progression. |
| `server/src/modules/service/service.service.js` | Garima Mittal | Field roof signoffs, instant warranty lookups, and automated breakdown repair ticketing. |
| `server/src/modules/service/service.controller.js` | Garima Mittal | Controllers handling roof signoff, live warranty queries, and tickets. |
| `server/src/modules/service/service.routes.js` | Garima Mittal | Express router for mobile roof signoffs, warranty queries, and repair tickets. |
| `server/src/modules/accounting/journalEntry.model.js`| Garima Mittal | Mongoose schema enforcing double-entry accounting ledger entries with debit/credit parity. |
| `server/src/modules/accounting/accounting.validation.js`| Garima Mittal | Zod boundary schemas for manual journal entries and director financial date filtering. |
| `server/src/modules/accounting/accounting.service.js` | Garima Mittal | Director month-end P&L, project margin metrics, subsidy receivables, and double-entry journals. |
| `server/src/modules/accounting/accounting.controller.js`| Garima Mittal | Controllers delivering financial metrics, general ledger entries, and CSV export records. |
| `server/src/modules/accounting/accounting.routes.js` | Garima Mittal | Express router for Director P&L analytics, margin calculations, and general ledger endpoints. |
| `server/src/modules/diagnostics/diagnostics.service.js`| Garima Mittal | Real-time server runtime metrics, heap allocations, and database connectivity telemetry. |
| `server/src/modules/diagnostics/diagnostics.controller.js`| Garima Mittal | Controller serving diagnostic metrics and server health telemetry. |
| `server/src/modules/diagnostics/diagnostics.routes.js`| Garima Mittal | Router defining administrator-only system telemetry and runtime diagnostics endpoints. |
| `server/src/seed/seedDatabase.js` | Garima Mittal | Populates 170+ realistic records, 15 technicians, edge case scenarios, and syncs ir.sequence. |
| `client/package.json` | Garima Mittal | Frontend dependencies, scripts, and dev tools. |
| `client/vite.config.js` | Garima Mittal | Vite bundler, React plugin, and development API proxy for SolIMS. |
| `client/tailwind.config.js` | Garima Mittal | Tailwind CSS design tokens, Odoo brand palette, and scan paths. |
| `client/postcss.config.js` | Garima Mittal | PostCSS pipeline for Tailwind CSS and Autoprefixer. |
| `client/index.html` | Garima Mittal | HTML entry template with Inter and JetBrains Mono typography. |
| `client/src/styles/theme.css` | Garima Mittal | Global stylesheet providing Tailwind directives and reusable Odoo UI component utility classes. |
| `client/src/services/api.js` | Garima Mittal | HTTP client wrapper with timeout interceptor, authentication headers, and standard error handling. |
| `client/src/services/socket.js` | Garima Mittal | Client-side Socket.IO real-time connection and event subscription channels. |
| `client/src/context/AuthContext.jsx` | Garima Mittal | React Context for authentication state, 1-click persona switching, and processing flags. |
| `client/src/components/ProcessingOverlay.jsx` | Garima Mittal | Global modal overlay preventing double-click race conditions during active state mutations. |
| `client/src/components/NetworkTimeoutBanner.jsx` | Garima Mittal | Enterprise system latency banner strictly triggered by 15-second network timeout aborts. |
| `client/src/layouts/ProgressWorkflowRibbon.jsx` | Garima Mittal | Glowing Odoo finite state machine status progression ribbon with active stage glow. |
| `client/src/layouts/ControlPanelHeader.jsx` | Garima Mittal | Pinned top Odoo Control Panel Header with breadcrumbs, action buttons, and workflow ribbon. |
| `client/src/layouts/CommandPaletteModal.jsx` | Garima Mittal | Global Ctrl+K command palette providing quick route navigation and persona switching. |
| `client/src/layouts/MainLayout.jsx` | Garima Mittal | Master enterprise layout wrapping the Control Panel, top navigation ribbon, and global modals. |
| `client/src/modules/auth/LoginView.jsx` | Garima Mittal | Odoo authentication screen with 1-click demo persona switcher buttons for hackathon judges. |
| `client/src/modules/inquiries/InquiriesView.jsx` | Garima Mittal | Scene 1 & 2: Rooftop inquiries, survey scheduling, approval gates, and auto-BOM quotes. |
| `client/src/modules/warehouse/WarehouseDispatchView.jsx`| Garima Mittal | Scene 3: Warehouse serial barcode scanner, BOM verification, and auto-warranty clock initiation. |
| `client/src/modules/technician/TechnicianRoofSignoffView.jsx`| Garima Mittal | Scene 4: Mobile-optimized field installation signoff, roof photos, and digital canvas signature. |
| `client/src/modules/warranty/WarrantyLookupTicketView.jsx`| Garima Mittal | Scene 5: Instant rainy season warranty lookup, automated ₹0 vs billed repairs, and tickets. |
| `client/src/modules/director/DirectorDashboardView.jsx`| Garima Mittal | Scene 6: Director month-end P&L, project margins, subsidy tracker, and 1-click CSV export. |
| `client/src/modules/diagnostics/SystemDiagnosticsView.jsx`| Garima Mittal | Admin monospace diagnostics portal presenting memory, uptime telemetry, and DB health. |
| `client/src/App.jsx` | Garima Mittal | Top-level routing component managing authentication gate and active subdomain views. |
| `client/src/main.jsx` | Garima Mittal | Client root mounting React virtual DOM, AuthProvider, and Tailwind theme styles. |
| `package.json` | Garima Mittal | Monorepo helper script coordinator. |
