/**
 * @AUTHOR: Garima Mittal
 * @FILE: erpConfig.js
 * @RESPONSIBILITY: Centralizes enterprise configuration parameters, pricing models, warranty policies, and sequence formats.
 * @DEPENDENCIES: None
 */

export const ERP_SYSTEM_CONFIG = Object.freeze({
  COMPANY_NAME: 'SolIMS Solutions',
  AUTHOR_NAME: 'Garima Mittal',
  PORT: process.env.PORT || 5000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'solims_super_secure_jwt_secret_2026',
  JWT_EXPIRES_IN_DAYS: 7,
  COOKIE_NAME: 'solims_session_token',

  RBAC_ROLES: Object.freeze({
    ADMIN: 'ADMIN',
    OPERATIONS: 'OPERATIONS',
    STAFF: 'STAFF',
    CUSTOMER: 'CUSTOMER'
  }),

  SEQUENCE_CODES: Object.freeze({
    INQUIRY: 'seq_inquiry',
    QUOTE: 'seq_quote',
    ORDER: 'seq_order',
    DISPATCH: 'seq_dispatch',
    TICKET: 'seq_ticket',
    JOURNAL: 'seq_journal',
    INVOICE: 'seq_invoice'
  }),

  SEQUENCE_DEFINITIONS: Object.freeze({
    seq_inquiry: { prefix: 'INQ/2026/', paddingLength: 4 },
    seq_quote: { prefix: 'QT/2026/', paddingLength: 4 },
    seq_order: { prefix: 'ORD/2026/', paddingLength: 4 },
    seq_dispatch: { prefix: 'DSP/2026/', paddingLength: 4 },
    seq_ticket: { prefix: 'TKT/2026/', paddingLength: 4 },
    seq_journal: { prefix: 'JRN/2026/', paddingLength: 4 },
    seq_invoice: { prefix: 'INV/2026/', paddingLength: 4 }
  }),

  WARRANTY_DAYS: Object.freeze({
    SOLAR_PANELS: 7300,       // 20 years
    INVERTER: 730,             // 2 years
    BATTERY_STORAGE: 730,      // 2 years
    CHARGE_CONTROLLER: 730,    // 2 years
    SAFETY_EARTHING: 730       // 2 years
  }),

  SYSTEM_CAPACITIES_KW: Object.freeze([1, 2, 3, 4, 5]),

  SYSTEM_VARIANTS: Object.freeze({
    ON_GRID: 'ON_GRID',
    OFF_GRID: 'OFF_GRID'
  }),

  BOM_TEMPLATES: Object.freeze({
    // Standard baseline multiplier per 1 kW
    BASE_PANEL_WATTS: 550,
    PANEL_COUNT_PER_KW: 2,
    STANDS_PER_KW: 1,
    WIRING_METERS_PER_KW: 30,
    SAFETY_EARTHING_KITS: 1,
    BASE_LABOR_RATE_INR: 1200,
    OUT_OF_WARRANTY_VISIT_FEE_INR: 1200,
    DEFAULT_INVERTER_OUT_OF_WARRANTY_COST_INR: 8500,
    DEFAULT_BATTERY_OUT_OF_WARRANTY_COST_INR: 14000
  }),

  SUBSIDY_BENCHMARKS: Object.freeze({
    // Residential PM Surya Ghar / National rooftop benchmark
    UP_TO_1KW_INR: 30000,
    UP_TO_2KW_INR: 60000,
    THREE_KW_AND_ABOVE_INR: 78000
  }),

  MINIMUM_ADVANCE_PERCENTAGE: 0.20
});
