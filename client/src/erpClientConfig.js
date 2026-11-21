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

  // High-Contrast Semantic Status Badge Color Mappings
  STATUS_BADGES: Object.freeze({
    // Draft / Neutral: bg-slate-100 text-slate-700 border-slate-200
    Draft: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    Neutral: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    WAREHOUSE_STOCK: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },

    // Pending / Scheduled / Subsidy Pending: bg-amber-50 text-amber-800 border-amber-200
    Survey_Scheduled: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    Waiting: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    Pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    'Subsidy Pending': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    Subsidy_Pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    'Eligibility Pre-Verified': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    Diagnosed: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    ALLOCATED_FOR_DISPATCH: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },

    // Quoted / Dispatched / In Progress: bg-sky-50 text-sky-800 border-sky-200
    Quoted: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
    Dispatched: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
    'In Progress': { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
    In_Progress: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
    Advance_Paid: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
    BALANCE_DUE: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
    Packed: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
    Parts_Replaced: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },

    // Approved / Completed / Under Warranty / Profitable: bg-emerald-50 text-emerald-800 border-emerald-200
    Approved: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    Survey_Completed: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    Installed: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    Done: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    Completed: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    Active: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    ACTIVE_IN_FIELD: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    'Under Warranty': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    Under_Warranty: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    Profitable: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    Disbursed: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    Subsidized: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },

    // Rejected / Expired Warranty / Loss: bg-rose-50 text-rose-700 border-rose-200
    Rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    Cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    'Expired Warranty': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    Expired_Warranty: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    Expired: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    Loss: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    REPLACED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
  }),

  // Demo Persona Profiles
  DEMO_PERSONAS: Object.freeze([
    {
      role: 'ADMIN',
      title: 'Director (Executive)',
      email: 'admin@solims.com',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: 'P&L Margins, PM Surya Ghar Subsidies & Telemetry'
    },
    {
      role: 'OPERATIONS',
      title: 'Operations Manager',
      email: 'ops@solims.com',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      description: 'Survey Approvals, Auto-BOM & Warehouse Dispatches'
    },
    {
      role: 'STAFF',
      title: 'Field Lead Technician',
      email: 'tech@solims.com',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      description: 'Mobile Roof Sign-off, Wattage Test & Touch Signature'
    },
    {
      role: 'CUSTOMER',
      title: 'Homeowner Client',
      email: 'customer@solims.com',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description: 'Live Generation, 20-Yr Warranty Certificates & Portal'
    }
  ])
});

export const formatCurrencyInr = (amount) => {
  const numeric = typeof amount === 'number' ? amount : Number(amount) || 0;
  return new Intl.NumberFormat(ERP_CLIENT_CONFIG.LOCALE, {
    style: 'currency',
    currency: ERP_CLIENT_CONFIG.CURRENCY,
    maximumFractionDigits: 0
  }).format(numeric);
};

export const calculateEstimatedSubsidyInr = (capacityKw, variant = 'ON_GRID') => {
  if (variant === 'OFF_GRID') return 0;
  const kw = Number(capacityKw) || 0;
  if (kw <= 0) return 0;
  if (kw === 1) return ERP_CLIENT_CONFIG.SUBSIDY_BENCHMARKS.UP_TO_1KW_INR;
  if (kw === 2) return ERP_CLIENT_CONFIG.SUBSIDY_BENCHMARKS.UP_TO_2KW_INR;
  return ERP_CLIENT_CONFIG.SUBSIDY_BENCHMARKS.THREE_KW_AND_ABOVE_INR;
};

export const getStatusBadgeStyle = (statusKey) => {
  if (!statusKey) {
    return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
  }

  if (ERP_CLIENT_CONFIG.STATUS_BADGES[statusKey]) {
    return ERP_CLIENT_CONFIG.STATUS_BADGES[statusKey];
  }

  const normalized = String(statusKey).toLowerCase().replace(/[_-]/g, ' ');

  // 1. Rejected / Expired Warranty / Loss / Cancelled
  if (
    normalized.includes('reject') ||
    normalized.includes('cancel') ||
    normalized.includes('expire') ||
    normalized.includes('loss') ||
    normalized.includes('fail') ||
    normalized.includes('replaced')
  ) {
    return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
  }

  // 2. Approved / Completed / Under Warranty / Profitable / Installed / Done
  if (
    normalized.includes('approv') ||
    normalized.includes('complete') ||
    normalized.includes('install') ||
    normalized.includes('done') ||
    normalized.includes('profit') ||
    normalized.includes('disburs') ||
    normalized.includes('subsidized') ||
    normalized.includes('resolved') ||
    normalized.includes('under warranty') ||
    normalized.includes('active')
  ) {
    return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' };
  }

  // 3. Quoted / Dispatched / In Progress / Advance Paid / Packed
  if (
    normalized.includes('quote') ||
    normalized.includes('dispatch') ||
    normalized.includes('progress') ||
    normalized.includes('advance') ||
    normalized.includes('packed')
  ) {
    return { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' };
  }

  // 4. Pending / Scheduled / Subsidy Pending / Waiting / Diagnosed
  if (
    normalized.includes('pending') ||
    normalized.includes('schedul') ||
    normalized.includes('wait') ||
    normalized.includes('diagnos') ||
    normalized.includes('submitted') ||
    normalized.includes('review')
  ) {
    return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };
  }

  // 5. Draft / Neutral / Default
  return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
};

export default ERP_CLIENT_CONFIG;
