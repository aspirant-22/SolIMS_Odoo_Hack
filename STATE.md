<!--
  @AUTHOR: Garima Mittal
  @FILE: STATE.md
  @RESPONSIBILITY: State transition matrices, finite state machine (FSM) guardrails, and lifecycle freeze rules.
  @DEPENDENCIES: CONTEXT.md
-->

# SolIMS ERP — State Progression & FSM Specifications

## 1. Inquiry Lifecycle State Machine (`inquiryWorkflowStatus`)
```
[Draft] ---> [Survey_Scheduled] ---> [Survey_Completed] ---> [Approved] ---> [Quoted]
   |                                                              |
   +--------------------------------------------------------> [Rejected]
```

### Transition Guardrails:
1. `Draft ➔ Survey_Scheduled`: Requires technician assignment.
2. `Survey_Scheduled ➔ Survey_Completed`: Requires azimuth direction, tilt angle degrees, shadow-free area, roof structure type, and cable distance measurements.
3. `Survey_Completed ➔ Approved`: Requires operational sign-off.
4. **Hard Security Guardrail**: Commercial quote generation is **strictly rejected** unless `inquiryWorkflowStatus === 'Approved'`.
5. `Approved ➔ Quoted`: Automatic upon quotation creation. Generates proposal `QT/2026/0001`.

---

## 2. Customer Portal State Machine & Isolation
The Customer My-Solar Portal decouples customer-facing milestone tracking from internal ERP execution:
- **Project Ribbon**: `Enquiry ➔ Survey Approved ➔ Quote Confirmed ➔ Dispatched ➔ Installed` (Real-time read state).
- **Warranty State Clock**: Auto-calculated based on dispatch date:
  - <= 730 days: `ACTIVE_WARRANTY` (₹0 Parts, ₹0 Labor).
  - > 730 days: `EXPIRED_WARRANTY` (Standard Catalog Parts + ₹1,200 Labor).
- **Role Isolation**: No internal operations (P&L ledgers, stock allocation, diagnostics) are exposed or rendered in the Customer UI.

---

## 2. Project Order Lifecycle State Machine (`orderWorkflowStatus`)
```
[Draft Quote] ---> [Advance_Paid] ---> [Packed] ---> [Dispatched] ---> [Installed] ---> [Done]
       |                                                                                  ^
       +------------------------------> [Cancelled] --------------------------------------+
```

### Transition Guardrails:
1. `Draft ➔ Advance_Paid`: Requires >= 20% advance payment. Creates double-entry journal entry (`Cash ➔ Customer Advance Liabilities`) and generates tracking order reference (`ORD/2026/0001`).
2. `Advance_Paid ➔ Dispatched`: Unlocks warehouse packing list. Every serialized item (inverter, battery, charge controller, panels) must be scanned and verified against BOM. Starts 2-year / 20-year warranty clocks automatically upon dispatch.
3. `Dispatched ➔ Installed`: Field crew completes physical installation, tests power generation (Watts), uploads roof photos, and captures homeowner digital screen signature. Updates hardware asset status to `ACTIVE_IN_FIELD`.
4. `Installed ➔ Done`: Destructive mutations frozen. Read-only historical ledger record.

---

## 3. Service Ticket Lifecycle State Machine (`ticketWorkflowStatus`)
```
[Draft / Open] ---> [Diagnosed] ---> [Parts_Replaced] ---> [Done]
       |                                                     ^
       +-----------------------> [Cancelled] ----------------+
```

### Transition Guardrails:
1. `Draft ➔ Diagnosed`: Automated warranty evaluation evaluates active status. If <= 730 days, parts and labor are locked at ₹0; if expired, bills standard parts + ₹1,200 labor.
2. `Diagnosed ➔ Done`: Can only transition to `Done` once customer confirms power generation restored (`resolutionConfirmationByCustomer === true`).
