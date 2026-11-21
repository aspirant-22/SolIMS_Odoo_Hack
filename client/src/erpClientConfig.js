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

  // High-Contrast Status Badge Color Mappings (SolIMS Forest-Emerald & Soft-Mint Grid System)
  STATUS_BADGES: Object.freeze({
    // Inquiries
    Draft: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    Survey_Scheduled: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    Survey_Completed: { bg: 'bg-[#E6F4EC]', text: 'text-[#135D3B]', border: 'border-[#135D3B]/20' },
    Approved: { bg: 'bg-[#E6F4EC]', text: 'text-[#135D3B]', border: 'border-[#135D3B]/20' },
    Quoted: { bg: 'bg-[#E6F4EC]', text: 'text-[#135D3B]', border: 'border-[#135D3B]/20' },
    Rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },

    // Project Orders
    Advance_Paid: { bg: 'bg-[#E6F4EC]', text: 'text-[#135D3B]', border: 'border-[#135D3B]/20' },
    Packed: { bg: 'bg-[#E6F4EC]', text: 'text-[#135D3B]', border: 'border-[#135D3B]/20' },
    Dispatched: { bg: 'bg-[#E6F4EC]', text: 'text-[#135D3B]', border: 'border-[#135D3B]/20' },
    Installed: { bg: 'bg-[#E6F4EC]', text: 'text-[#135D3B]', border: 'border-[#135D3B]/20' },
    Done: { bg: 'bg-[#E6F4EC]', text: 'text-[#135D3B]', border: 'border-[#135D3B]/20' },
    Cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },

    // Tickets
    Diagnosed: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    Parts_Replaced: { bg: 'bg-[#E6F4EC]', text: 'text-[#135D3B]', border: 'border-[#135D3B]/20' },

    // Asset Hardware Statuses
    WAREHOUSE_STOCK: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
    ALLOCATED_FOR_DISPATCH: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    ACTIVE_IN_FIELD: { bg: 'bg-[#E6F4EC]', text: 'text-[#135D3B]', border: 'border-[#135D3B]/20' },
    REPLACED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
  }),

  // Demo Persona Profiles
  DEMO_PERSONAS: Object.freeze([
    {
      role: 'ADMIN',
      title: 'Director (Executive)',
      email: 'admin@solims.com',
      badgeColor: 'bg-[#E6F4EC] text-[#135D3B] border-[#135D3B]/20',
      description: 'P&L, Margins, PM Surya Ghar Subsidies, Telemetry'
    },
    {
      role: 'OPERATIONS',
      title: 'Operations Manager',
      email: 'ops@solims.com',
      badgeColor: 'bg-emerald-50 text-[#135D3B] border-emerald-200',
      description: 'Survey Approvals, BOM Generation, Stock Dispatch'
    },
    {
      role: 'STAFF',
      title: 'Field Lead Technician',
      email: 'tech@solims.com',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      description: 'Roof Installation, Testing & Digital Signoff'
    },
    {
      role: 'CUSTOMER',
      title: 'Homeowner Client',
      email: 'customer@solims.com',
      badgeColor: 'bg-[#E6F4EC] text-[#135D3B] border-[#135D3B]/20',
      description: 'Solar Generation, 20-Yr Warranty Certificates, Portal'
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
  return (
    ERP_CLIENT_CONFIG.STATUS_BADGES[statusKey] || {
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-200'
    }
  );
};

export default ERP_CLIENT_CONFIG;
