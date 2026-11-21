<!--
  @AUTHOR: Garima Mittal
  @FILE: ARCHITECTURE.md
  @RESPONSIBILITY: Technical specification of SolIMS ERP architecture, data flows, and Odoo design patterns.
  @DEPENDENCIES: CONTEXT.md
-->

# SolIMS ERP — System Architecture Specification

## 1. Architectural Overview
SolIMS is an enterprise-grade ERP built specifically for rooftop solar EPC (Engineering, Procurement, Construction) and long-term asset lifecycle management. It replaces ad-hoc WhatsApp quotes, paper site registers, and untracked hardware serials with an automated, unified digital backbone.

```
                           +----------------------------------------+
                           |   Odoo-Style Web Application Shell     |
                           |  (React 18 + Vite + Tailwind + Lucide) |
                           +-------------------+--------------------+
                                               |
                                     HTTP / WebSocket (JSON)
                                               |
                                               v
+---------------------------------------------------------------------------------------+
|                                 Node.js / Express Core                                |
|                                                                                       |
|  +--------------------+   +-----------------------+   +----------------------------+  |
|  | Security Boundary  |   | Odoo Core Engine      |   | Real-Time Event Bus        |  |
|  | - JWT Cookie Auth  |   | - Atomic ir.sequence  |   | - Socket.IO Broadcast Gateway| |
|  | - 4-Tier RBAC      |   | - FSM State Guards    |   +----------------------------+  |
|  | - Zod Input Gates  |   | - Double-Entry Ledger |                                   |
|  +--------------------+   +-----------------------+                                   |
|                                                                                       |
|  +---------------------------------------------------------------------------------+  |
|  | Subdomain Business Modules (/src/modules/)                                      |  |
|  | - Auth         - Inquiries & Feasibility       - Orders & Auto-BOM Proposal     |  |
|  | - Inventory    - Roof Execution & Sign-off     - Breakdown & Warranty Engine    |  |
|  | - Accounting & Director P&L                    - Monospace System Diagnostics   |  |
|  +---------------------------------------------------------------------------------+  |
+------------------------------------------+--------------------------------------------+
                                           |
                                   Mongoose ODM
                                           |
                                           v
                        +--------------------------------------+
                        |   MongoDB Multi-Collection Cluster   |
                        |   (Local / MongoMemoryServer fallback)|
                        +--------------------------------------+
```

## 2. Decoupled Odoo 'Apps' Subdomains
Each business module in `server/src/modules/` is strictly encapsulated with five distinct layers:
1. `*.model.js`: Mongoose schema, validation hooks, indexes, and audit references (`updatedBy`).
2. `*.validation.js`: Zod schema defining strict types and payload boundaries.
3. `*.service.js`: Domain business logic, single-responsibility functions (< 25-30 lines).
4. `*.controller.js`: Express request/response transport boundary.
5. `*.routes.js`: Route registration, middleware bindings (JWT, RBAC, Zod).

## 3. Odoo Core Engine Mechanisms
- **Atomic `ir.sequence` Registry**:
  Corporate tracking codes are generated atomically using `$inc` counters in collection `ir_sequences`. It self-heals against manual seeds or external record insertions.
- **Double-Entry Ledgers**:
  - *Inventory*: Hardware movements debit destination nodes (`Customers`) and credit source nodes (`WH/Stock`).
  - *Accounting*: Every financial journal entry enforces mathematical parity (`totalDebit === totalCredit`).
- **Automated Warranty Engine**:
  Warranty clocks start automatically upon warehouse dispatch without manual date entry:
  - Solar PV Panels: 20 Years (7,300 days)
  - Inverter, Battery Bank, Charge Controller: 2 Years (730 days)
  - Fault diagnosis automatically bifurcates costs: ₹0 for active warranty, standard parts + ₹1,200 labor for expired assets.
