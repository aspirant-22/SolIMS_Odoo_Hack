/**
 * @AUTHOR: Garima Mittal
 * @FILE: erpClientConfig.js
 * @RESPONSIBILITY: Centralized client configuration parameters, timeout thresholds, formatting, badges, and route definitions.
 * @DEPENDENCIES: None
 */

export const ERP_CLIENT_CONFIG = Object.freeze({
  COMPANY_NAME: 'SolIMS Solutions',
  PLATFORM_TAGLINE: 'Power every project.',
  AUTHOR_NAME: 'Garima Mittal',

  // Network & Transport Configurations
  API_BASE_URL: import.meta.env?.VITE_API_BASE_URL || '',
  NETWORK_TIMEOUT_THRESHOLD_MS: 15000,

  // Financial & Currency Formatting
  CURRENCY: 'INR',
  CURRENCY_SYMBOL: '₹',
  LOCALE: 'en-IN',

  // Solar Capacities (1 kW to 5 kW Rooftop Standard)
  SOLAR_CAPACITIES_KW: Object.freeze([1, 2, 3, 4, 5]),

  SOLAR_CAPACITY_OPTIONS: Object.freeze([
    { value: 1, label: '1 kW (1-2 BHK • ~120 kWh/month)', panels: 2, approxAreaSqFt: 100 },
    { value: 2, label: '2 kW (2-3 BHK • ~240 kWh/month)', panels: 4, approxAreaSqFt: 200 },
    { value: 3, label: '3 kW (3-4 BHK • ~360 kWh/month)', panels: 6, approxAreaSqFt: 300 },
    { value: 4, label: '4 kW (Villa / Large • ~480 kWh/month)', panels: 8, approxAreaSqFt: 400 },
    { value: 5, label: '5 kW (Commercial / High Load • ~600 kWh/month)', panels: 10, approxAreaSqFt: 500 }
  ]),

  SYSTEM_VARIANTS: Object.freeze({
    ON_GRID: { id: 'ON_GRID', label: 'On-Grid (Net-Metered)', description: 'Export excess generation back to DISCOM grid' },
    OFF_GRID: { id: 'OFF_GRID', label: 'Off-Grid (Battery Backup)', description: 'Zero power cuts with dedicated battery storage' }
  }),

  // PM Surya Ghar / National Rooftop Benchmark Subsidies
  SUBSIDY_BENCHMARKS: Object.freeze({
    UP_TO_1KW_INR: 30000,
    UP_TO_2KW_INR: 60000,
    THREE_KW_AND_ABOVE_INR: 78000
  }),

  // Public Route Definitions
  PUBLIC_ROUTES: Object.freeze({
    HOME: '/',
    FREE_QUOTE: '/quote',
    TRACK_ORDER: '/track',
    LOGIN: '/login',
    CALCULATOR: '/#calculator'
  }),

  // High-Contrast Status Badge Color Mappings (Odoo enterprise style)
  STATUS_BADGES: Object.freeze({
    // Inquiries
    Draft: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    Survey_Scheduled: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
    Survey_Completed: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    Approved: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    Quoted: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
    Rejected: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },

    // Project Orders
    Advance_Paid: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
    Packed: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
    Dispatched: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
    Installed: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    Done: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' },
    Cancelled: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },

    // Tickets
    Diagnosed: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    Parts_Replaced: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },

    // Asset Hardware Statuses
    WAREHOUSE_STOCK: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
    ALLOCATED_FOR_DISPATCH: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    ACTIVE_IN_FIELD: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    REPLACED: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' }
  }),

  // Demo Persona Profiles
  DEMO_PERSONAS: Object.freeze([
    {
      role: 'ADMIN',
      title: 'Director (Executive)',
      email: 'admin@solims.com',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      description: 'P&L, Margins, PM Surya Ghar Subsidies, Telemetry'
    },
    {
      role: 'OPERATIONS',
      title: 'Operations Manager',
      email: 'ops@solims.com',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      description: 'Survey Approvals, BOM Generation, Stock Dispatch'
    },
    {
      role: 'STAFF',
      title: 'Field Technician',
      email: 'tech@solims.com',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      description: 'Rooftop Surveys, Mobile Sign-off, Live Wattage Test'
    },
    {
      role: 'CUSTOMER',
      title: 'Homeowner (Customer)',
      email: 'customer@solims.com',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      description: 'Project Tracker, 20-Yr Warranty Certs, Rainy Help'
    }
  ])
});

/**
 * Currency formatter utility enforcing Indian numbering system (e.g. ₹1,50,000)
 */
export const formatCurrencyInr = (amountInr) => {
  const numericValue = Number(amountInr) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(numericValue);
};

/**
 * Calculates estimated PM Surya Ghar Central Government Subsidy based on capacity
 */
export const calculateEstimatedSubsidyInr = (capacityKw, variant = 'ON_GRID') => {
  if (variant === 'OFF_GRID') return 0; // Off-grid systems typically non-subsidized
  const kw = Number(capacityKw) || 0;
  if (kw <= 0) return 0;
  if (kw === 1) return ERP_CLIENT_CONFIG.SUBSIDY_BENCHMARKS.UP_TO_1KW_INR;
  if (kw === 2) return ERP_CLIENT_CONFIG.SUBSIDY_BENCHMARKS.UP_TO_2KW_INR;
  return ERP_CLIENT_CONFIG.SUBSIDY_BENCHMARKS.THREE_KW_AND_ABOVE_INR; // 3 kW - 5 kW capped at 78,000
};

/**
 * Returns badge styling for an ERP entity status
 */
export const getStatusBadgeStyle = (statusKey) => {
  return (
    ERP_CLIENT_CONFIG.STATUS_BADGES[statusKey] || {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200'
    }
  );
};

export default ERP_CLIENT_CONFIG;
