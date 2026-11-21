<!--
  @AUTHOR: Garima Mittal
  @FILE: IMPLEMENTATION_PLAN.md
  @RESPONSIBILITY: 7-milestone execution blueprint for SolIMS Odoo ERP with exact file paths, schemas, APIs, and verification gates.
  @DEPENDENCIES: CONTEXT.md
-->

# SolIMS ERP Execution Blueprint & Milestone Plan

## Milestone 1: Constitution, Monorepo Scaffolding & Core Infrastructure
- **Deliverables**:
  - `CONTEXT.md` & `IMPLEMENTATION_PLAN.md`
  - `server/package.json` and `client/package.json`
  - `server/src/config/erpConfig.js` (Tax rates, warranty terms, thresholds, sequence formats)
  - `server/src/config/db.js` (Mongoose connection with robust local/in-memory auto-fallback)
  - `server/src/core/sequenceRegistry.js` (Self-healing `$inc` atomic counters for `INQ`, `QT`, `ORD`, `DSP`, `TKT`, `JRN`, `INV`)
  - `server/src/middleware/authMiddleware.js` & `rbacMiddleware.js`
  - Express server entry point `server/src/server.js` with CORS, Helmet, cookie-parser, and Socket.IO initialization
  - Git commit: `chore(init): add CONTEXT.md, implementation plan, and SolIMS MERN scaffold` & push.

## Milestone 2: Domain Mongoose Schemas & Zod Boundary Gates
- **Deliverables**:
  - Models (`server/src/modules/`):
    - `auth/user.model.js`: Users with roles (`ADMIN`, `OPERATIONS`, `STAFF`, `CUSTOMER`), hashed passwords, phone, active state.
    - `leads/lead.model.js`: Inquiries, roof specs, survey measurements, audit trail.
    - `orders/order.model.js`: Orders, BOM breakdown, pricing, advance tracking, FSM status.
    - `inventory/serialAsset.model.js`: Individual serialized hardware with warranty timestamps & customer links.
    - `inventory/stockMove.model.js`: Double-entry inventory movements (`WH/Stock` to `Customers`).
    - `service/siteLog.model.js`: Mobile roof execution logs, crew timestamps, photo URLs, signature SVG/Base64.
    - `service/ticket.model.js`: Repair tickets, fault diagnosis, warranty auto-eval, billable amounts.
    - `accounting/journalEntry.model.js`: Double-entry financial journal lines (Debit === Credit).
  - Validations:
    - Zod schemas for all module request payloads.
  - Git commit: `feat(models): add SolIMS domain Mongoose schemas and Zod ingestion gates` & push.

## Milestone 3: ERP Services, FSM Transition Guards & Double-Entry Ledgers
- **Deliverables**:
  - `auth`: Controller & routes for login, profile, logout, session check.
  - `leads`: Lead creation, survey scheduling, survey result submission, survey approval gate.
  - `orders`: Auto-BOM generation based on capacity (1 kW - 5 kW) & grid type (On-Grid vs Off-Grid), payment capture, FSM state updates.
  - `inventory`: Stock move execution, barcode/serial scanning endpoint, automated warranty calculation upon dispatch.
  - `service`: Site log completion with homeowner signature, rainy-season warranty lookup, ticket creation & auto-billing calculator.
  - `accounting`: Double-entry journal builder, director P&L aggregations, subsidy claim status ledger.
  - `diagnostics`: System health, memory/uptime stats, and live telemetry log stream.
  - Socket.IO event broadcasting for real-time order and ticket changes.
  - Git commit: `feat(api): implement SolIMS ERP services, warranty engine, and double-entry ledgers` & push.

## Milestone 4: Comprehensive Historical Seed Script & Sequence Sync
- **Deliverables**:
  - `server/src/seed/seedDatabase.js`:
    - 4 Demo Persona Accounts (`admin@solims.com`, `ops@solims.com`, `tech@solims.com`, `customer@solims.com`).
    - 150+ realistic records across leads, quotations, project orders, serialized hardware items, site logs, tickets, and journal entries.
    - Edge cases:
      - Inquiry in Draft needing survey.
      - Approved survey ready for Quote generation.
      - Confirmed 3 kW On-Grid order awaiting warehouse dispatch.
      - Confirmed 5 kW Off-Grid order awaiting battery serial scanning.
      - Inverter installed 18 months ago (covered warranty scenario: ₹0).
      - Inverter installed 26 months ago (expired warranty scenario: auto-billed ₹8,500 parts + ₹1,200 labor).
      - Active roof signoff pending customer signature.
    - Automated `ir.sequence` synchronization at completion.
  - Git commit: `feat(seed): add comprehensive SolIMS historical seed script and sequence sync` & push.

## Milestone 5: Odoo Enterprise Web Client & Inquiry-to-Quote Flow
- **Deliverables**:
  - Vite + React + Tailwind CSS configuration (`vite.config.js`, `tailwind.config.js`, `theme.css`).
  - Core layouts:
    - `ControlPanelHeader.jsx`: Odoo breadcrumbs, quick action buttons, search bar.
    - `ProgressWorkflowRibbon.jsx`: Status stage progression ribbon (`Draft ➔ Waiting ➔ Ready ➔ Done`).
    - `CommandPaletteModal.jsx`: `Ctrl + K` global navigation palette.
    - `ProcessingOverlay.jsx`: Double-click race condition prevention overlay.
    - `NetworkTimeoutBanner.jsx`: Genuine 15s timeout alert.
  - Auth module:
    - `LoginView.jsx` with 1-Click Demo Persona Switcher (Director, Ops Manager, Technician, Homeowner).
  - Inquiries module:
    - Inquiry creation & technician survey scheduling.
    - Survey approval gate with roof tilt, azimuth, area, and cable validation.
    - Auto-BOM quote generator for 1 kW to 5 kW On-Grid/Off-Grid packages.
  - Git commit: `feat(ui): build SolIMS Odoo shell, demo persona switcher, and inquiry-to-quote modules` & push.

## Milestone 6: Field Operations, Serial Scanner, Warranty & Director P&L
- **Deliverables**:
  - `WarehouseDispatchView.jsx`: Interactive serial scanner to scan inverters, batteries, and panel batches before dispatch, verifying quantities against BOM.
  - `TechnicianRoofSignoffView.jsx`: Mobile-friendly installation logger with timestamps, PV size confirmation, photo upload, and canvas signature capture.
  - `WarrantyLookupTicketView.jsx`: Real-time serial/customer lookup showing active warranty status, remaining days, and automated ₹0 vs billable repair breakdown.
  - `DirectorDashboardView.jsx`: Month-end P&L, project margin metrics, subsidy status tracker, open repairs, and 1-Click CSV export.
  - `SystemDiagnosticsView.jsx`: Admin-only terminal with live server telemetry, DB health, and audit logs.
  - Git commit: `feat(modules): add serial dispatch scanner, roof sign-off, warranty lookup, and director P&L` & push.

## Milestone 7: Build Verification, System Documentation & Executive README
- **Deliverables**:
  - Run production builds (`npm run build` in client, node checks in server).
  - Generate living documentation: `ARCHITECTURE.md`, `ROUTES.md`, `STATE.md`, `ENVIRONMENT.md`, `MODIFICATIONS.md`.
  - Comprehensive `README.md` with system overview, Mermaid architecture & FSM diagrams, ERD, Persona credentials table, and setup instructions.
  - Git commit: `docs: finalize SolIMS architecture docs, Mermaid diagrams, and production build verification` & push.
