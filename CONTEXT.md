<!--
  @AUTHOR: Garima Mittal
  @FILE: CONTEXT.md
  @RESPONSIBILITY: Token-saving technical constitution defining architectural guardrails, sequences, RBAC, and schemas for SolIMS ERP.
  @DEPENDENCIES: None (Reference Constitution)
-->

# SolIMS ERP Constitution & Architecture Index

## 1. PROJECT IDENTITY & BUSINESS PROFILE
- **Entity**: SolIMS Solutions (Rooftop Solar EPC & Asset Lifecycle Management)
- **Author**: Garima Mittal
- **Target**: Odoo Hackathon Finale
- **Core Operations**: 40 projects/month, 1 kW to 5 kW On-Grid & Off-Grid rooftop systems, 15 technicians, warranty tracking up to 20 years.

## 2. DIRECTORY ARCHITECTURE (MODULAR ODOO SUBDOMAINS)
```
SolIMS/
├── CONTEXT.md
├── IMPLEMENTATION_PLAN.md
├── ARCHITECTURE.md
├── ROUTES.md
├── STATE.md
├── ENVIRONMENT.md
├── MODIFICATIONS.md
├── README.md
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── erpConfig.js
│   │   ├── core/
│   │   │   ├── sequenceRegistry.js
│   │   │   ├── socketEmitter.js
│   │   │   └── auditPlugin.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── rbacMiddleware.js
│   │   │   ├── validateMiddleware.js
│   │   │   └── errorHandler.js
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── leads/
│   │   │   ├── orders/
│   │   │   ├── inventory/
│   │   │   ├── service/
│   │   │   ├── accounting/
│   │   │   └── diagnostics/
│   │   ├── seed/
│   │   │   └── seedDatabase.js
│   │   └── server.js
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── styles/
│   │   │   └── theme.css
│   │   ├── config/
│   │   │   └── erpClientConfig.js
│   │   ├── layouts/
│   │   │   ├── ControlPanelHeader.jsx
│   │   │   ├── ProgressWorkflowRibbon.jsx
│   │   │   ├── MainLayout.jsx
│   │   │   └── CommandPaletteModal.jsx
│   │   ├── components/
│   │   │   ├── ProcessingOverlay.jsx
│   │   │   ├── NetworkTimeoutBanner.jsx
│   │   │   └── DataTable.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── inquiries/
│   │   │   ├── orders/
│   │   │   ├── warehouse/
│   │   │   ├── technician/
│   │   │   ├── warranty/
│   │   │   ├── director/
│   │   │   └── diagnostics/
│   │   ├── App.jsx
│   │   └── main.jsx
```

## 3. ODOO `ir.sequence` REGISTRY (ATOMIC COUNTERS)
| Sequence Code | Prefix Format | Sample Reference | Target Subdomain |
| :--- | :--- | :--- | :--- |
| `seq_inquiry` | `INQ/2026/` | `INQ/2026/0001` | Lead / Survey Inquiry |
| `seq_quote` | `QT/2026/` | `QT/2026/0001` | Quotation / BOM Proposal |
| `seq_order` | `ORD/2026/` | `ORD/2026/0001` | Confirmed Project Order |
| `seq_dispatch` | `DSP/2026/` | `DSP/2026/0001` | Warehouse Dispatch Pick List |
| `seq_ticket` | `TKT/2026/` | `TKT/2026/0001` | Maintenance & Repair Service |
| `seq_journal` | `JRN/2026/` | `JRN/2026/0001` | Double-Entry General Ledger |
| `seq_invoice` | `INV/2026/` | `INV/2026/0001` | Commercial Customer Invoice |

## 4. RBAC MATRIX & DEMO PERSONAS
| Persona / Role | Email | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Director / Admin** (`ADMIN`) | `admin@solims.com` | `admin123` | Full access: P&L analytics, subsidies, diagnostics, overrides |
| **Operations Manager** (`OPERATIONS`) | `ops@solims.com` | `ops123` | Leads approval, BOM dispatch, stock moves, warranty tickets |
| **Field Technician** (`STAFF`) | `tech@solims.com` | `tech123` | Survey measurements, roof installation logs, signature upload |
| **Homeowner** (`CUSTOMER`) | `customer@solims.com` | `customer123` | View project stage, warranty card, signoff copy, request ticket |

## 5. HARD BUSINESS GUARDRAILS & STATE MACHINES (FSM)
- **Inquiry FSM**: `Draft` ➔ `Survey_Scheduled` ➔ `Survey_Completed` ➔ `Approved` ➔ `Quoted` (or `Rejected`).
  - *Guardrail*: Customer quotation CANNOT be generated unless roof survey is approved with tilt, azimuth, area, and cable distance verified.
- **Project Order FSM**: `Draft` ➔ `Advance_Paid` ➔ `Packed` ➔ `Dispatched` ➔ `Installed` ➔ `Done` (or `Cancelled`).
  - *Guardrail*: Warehouse packing unlocks only after >= 20% advance received. Dispatch locks until every serial number matches required BOM quantities.
- **Warranty Auto-Clock**:
  - Solar PV Panels: 20 Years (7,300 days)
  - Inverter: 2 Years (730 days)
  - Battery Bank: 2 Years (730 days)
  - Charge Controller / Earthing: 2 Years (730 days)
  - *Rule*: Clock auto-starts upon `DELIVERY_CONFIRMED` event. No manual date inputs allowed.
- **Service Ticket Warranty Rules**:
  - Valid Warranty: Parts cost = ₹0, Labour cost = ₹0 (`isCovered: true`).
  - Expired Warranty: Parts cost = Standard catalog price, Labour cost = ₹1,200 per technician visit.
- **Double-Entry Accounting & Stock**:
  - Stock: Physical move debits Destination Location (`Customers` / `In-Transit`) and credits Source Location (`WH/Stock`).
  - Ledger: Debits === Credits strictly enforced on every revenue, inventory, or expense journal entry.

## 6. CODE QUALITY MANDATES
- Strictly forbid generic identifiers (`data`, `res`, `item`, `obj`, `element`).
- Functions strictly under 25-30 lines, single responsibility.
- Zod schemas at API boundary.
- Global `isSystemProcessing` overlay for race conditions.
- Standardized header on all code files.
