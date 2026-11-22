/**
 * @AUTHOR: Garima Mittal
 * @FILE: seedDatabase.js
 * @RESPONSIBILITY: Populates 520+ rich, realistic enterprise records, 15 technicians, realistic Punjab/North India solar EPC scenarios, zero-duplicate serials, and syncs ir.sequence counters.
 * @DEPENDENCIES: mongoose, bcryptjs, db.js, sequenceRegistry.js, all domain models
 */

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { synchronizeSequenceCounter } from '../core/sequenceRegistry.js';
import { ERP_SYSTEM_CONFIG } from '../config/erpConfig.js';
import { UserModel } from '../modules/auth/user.model.js';
import { LeadModel } from '../modules/leads/lead.model.js';
import { OrderModel } from '../modules/orders/order.model.js';
import { SerialAssetModel } from '../modules/inventory/serialAsset.model.js';
import { StockMoveModel } from '../modules/inventory/stockMove.model.js';
import { StockItemModel } from '../modules/inventory/stockItem.model.js';
import { DEFAULT_STOCK_CATALOG } from '../modules/inventory/inventory.service.js';
import { SiteLogModel } from '../modules/service/siteLog.model.js';
import { TicketModel } from '../modules/service/ticket.model.js';
import { JournalEntryModel } from '../modules/accounting/journalEntry.model.js';
import { generateSampleDemoSimulatedEmails } from '../modules/notifications/simulatedEmail.service.js';

// Realistic North India & Punjab cities and addresses
const NORTH_INDIA_CITIES = [
  { city: 'Chandigarh', street: 'SCO 142, Sector 17-C' },
  { city: 'Ludhiana', street: 'Model Town, Near Krishna Mandir' },
  { city: 'Amritsar', street: 'Mall Road, Near Golden Temple' },
  { city: 'Jalandhar', street: 'Civil Lines, Urban Estate Phase 1' },
  { city: 'Mohali', street: 'Phase 7, Sector 61' },
  { city: 'Patiala', street: 'Leela Bhawan, Near Rajpura Road' },
  { city: 'Chandigarh', street: 'Sector 35-B, Inner Market' },
  { city: 'Ludhiana', street: 'Sarabha Nagar, Main Market' },
  { city: 'Amritsar', street: 'Ranjit Avenue, B-Block' },
  { city: 'Jalandhar', street: 'Model Town, Near Geeta Mandir' },
  { city: 'Mohali', street: 'Sector 82, JLPL Industrial Area' },
  { city: 'Patiala', street: 'Baradari Gardens Extension' }
];

const CUSTOMER_FIRST_NAMES = [
  'Harpreet', 'Gurpreet', 'Manpreet', 'Jaswinder', 'Balwinder', 'Amarjeet',
  'Ravinder', 'Kuldeep', 'Sukhdev', 'Davinder', 'Paramjit', 'Surinder',
  'Rajesh', 'Vikram', 'Raman', 'Sandeep', 'Mohit', 'Sunil', 'Amit', 'Pooja',
  'Simran', 'Harleen', 'Navjot', 'Kiran', 'Preeti', 'Anita', 'Ananya', 'Meenakshi'
];

const CUSTOMER_LAST_NAMES = [
  'Singh', 'Kaur', 'Sharma', 'Verma', 'Gupta', 'Malhotra', 'Bhatia', 'Chawla',
  'Dhillon', 'Grewal', 'Sandhu', 'Gill', 'Sidhu', 'Bajwa', 'Kohli', 'Kapoor'
];

/**
 * Distributes createdAt/updatedAt timestamps realistically across past 30 days:
 * ~10% strictly within Today (>= startOfToday and <= now)
 * ~35% cumulative within This Week (1 to 6 days ago)
 * 100% within This Month (7 to 28 days ago)
 */
export const distributePast30DaysDate = (index, totalCount) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const ratio = totalCount > 0 ? index / totalCount : 0;

  if (ratio < 0.10) {
    // ~10% Today: strictly between startOfToday and now
    const elapsedTodayMs = Math.max(now.getTime() - startOfToday.getTime(), 60000);
    const offsetMs = ((index % 14) + 1) * (elapsedTodayMs / 16);
    return new Date(startOfToday.getTime() + offsetMs);
  } else if (ratio < 0.35) {
    // ~35% This Week: between 1 and 6 days ago
    const daysAgo = 1 + ((index * 2) % 6);
    const hoursAgo = 1 + (index % 18);
    return new Date(now.getTime() - daysAgo * 86400000 - hoursAgo * 3600000);
  } else {
    // Remaining ~65% This Month: between 7 and 28 days ago
    const daysAgo = 7 + ((index * 3) % 21);
    const hoursAgo = 2 + (index % 18);
    return new Date(now.getTime() - daysAgo * 86400000 - hoursAgo * 3600000);
  }
};

export const seedEnterpriseUsers = async () => {
  const commonPasswordHash = await bcrypt.hash('admin123', 10);
  const opsPasswordHash = await bcrypt.hash('ops123', 10);
  const techPasswordHash = await bcrypt.hash('tech123', 10);
  const customerPasswordHash = await bcrypt.hash('customer123', 10);

  const primaryPersonas = [
    {
      fullName: 'Garima Mittal (Managing Director)',
      email: 'admin@solims.com',
      passwordHash: commonPasswordHash,
      role: ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN,
      phoneNumber: '+91 98100 11223',
      assignedSpecialization: 'Executive Leadership'
    },
    {
      fullName: 'Vikram Sethi (Operations Manager)',
      email: 'ops@solims.com',
      passwordHash: opsPasswordHash,
      role: ERP_SYSTEM_CONFIG.RBAC_ROLES.OPERATIONS,
      phoneNumber: '+91 98111 22334',
      assignedSpecialization: 'Warehouse & Logistics'
    },
    {
      fullName: 'Ramesh Sharma (Senior Roof Lead)',
      email: 'tech@solims.com',
      passwordHash: techPasswordHash,
      role: ERP_SYSTEM_CONFIG.RBAC_ROLES.STAFF,
      phoneNumber: '+91 98222 33445',
      assignedSpecialization: 'High-Voltage Wiring & Testing'
    },
    {
      fullName: 'Sunil Agrawal (Homeowner Client)',
      email: 'customer@solims.com',
      passwordHash: customerPasswordHash,
      role: ERP_SYSTEM_CONFIG.RBAC_ROLES.CUSTOMER,
      phoneNumber: '+91 98333 44556',
      assignedSpecialization: 'Residential Rooftop'
    }
  ];

  // Additional 14 technicians to complete the 15-technician crew profile
  const technicianCrewNames = [
    'Anil Kumar', 'Pradeep Verma', 'Dinesh Yadav', 'Rajesh Joshi',
    'Mohan Lal', 'Sanjay Patel', 'Amitabh Tiwari', 'Gaurav Chauhan',
    'Deepak Rawat', 'Manoj Negi', 'Suresh Gupta', 'Karan Malhotra',
    'Harish Pandey', 'Santosh Nair'
  ];

  const crewRecords = technicianCrewNames.map((techName, idx) => ({
    fullName: `${techName} (Technician #${idx + 2})`,
    email: `tech${idx + 2}@solims.com`,
    passwordHash: techPasswordHash,
    role: ERP_SYSTEM_CONFIG.RBAC_ROLES.STAFF,
    phoneNumber: `+91 98400 ${10000 + idx}`,
    assignedSpecialization: idx % 2 === 0 ? 'Roof Structure & Mounting' : 'Inverter & Battery Wiring'
  }));

  const insertedUsers = await UserModel.insertMany([...primaryPersonas, ...crewRecords]);
  console.log(`[SEED] Created ${insertedUsers.length} user accounts (4 demo personas + 14 technicians = 15 technicians total)`);
  return insertedUsers;
};

export const seedHistoricalHardwareInventory = async (adminUserId) => {
  const hardwareStockPool = [];
  const seededSerialSet = new Set();

  const registerSerial = (serial) => {
    if (seededSerialSet.has(serial)) {
      throw new Error(`CRITICAL: Duplicate serial number detected in seeder: ${serial}`);
    }
    seededSerialSet.add(serial);
    return serial;
  };

  // 1. Mandatory Demo Record 1: 18-month old inverter (under warranty: 730 days total - 547 days elapsed = 183 days left)
  hardwareStockPool.push({
    serialNumber: registerSerial('INV-2024-RAINY-ACTIVE'),
    assetCategory: 'INVERTER',
    modelDesignation: 'SolIMS Smart Inverter 3kW (Installed 18 Months Ago)',
    assetStatus: 'ACTIVE_IN_FIELD',
    customerFullName: 'Sunil Agrawal',
    customerPhoneNumber: '+91 98333 44556',
    installationSiteAddress: 'B-42, Sector 14, Noida, UP',
    orderReference: 'ORD/2024/0088',
    dispatchConfirmedTimestamp: new Date(Date.now() - 547 * 86400000),
    warrantyDurationDays: 730,
    warrantyExpiresTimestamp: new Date(Date.now() + 183 * 86400000), // active!
    updatedBy: adminUserId
  });

  // 2. Mandatory Demo Record 2: 26-month old inverter (expired warranty: 730 days total - 790 days elapsed = expired by 60 days)
  hardwareStockPool.push({
    serialNumber: registerSerial('INV-2024-RAINY-EXPIRED'),
    assetCategory: 'INVERTER',
    modelDesignation: 'SolIMS Classic Inverter 3kW (Installed 26 Months Ago)',
    assetStatus: 'ACTIVE_IN_FIELD',
    customerFullName: 'Rajendra Prasad',
    customerPhoneNumber: '+91 98765 11223',
    installationSiteAddress: 'Plot 104, Okhla Phase 3, New Delhi',
    orderReference: 'ORD/2024/0012',
    dispatchConfirmedTimestamp: new Date(Date.now() - 790 * 86400000),
    warrantyDurationDays: 730,
    warrantyExpiresTimestamp: new Date(Date.now() - 60 * 86400000), // expired!
    updatedBy: adminUserId
  });

  // 3. Generate remaining 148 serial assets across categories to guarantee exactly 150 unique serial assets
  // 40 Inverters, 40 Batteries, 40 Solar Panels, 28 Charge Controllers
  const serialConfig = [
    { category: 'INVERTER', prefix: 'INV-2026-', count: 40, days: ERP_SYSTEM_CONFIG.WARRANTY_DAYS.INVERTER },
    { category: 'BATTERY', prefix: 'BAT-2026-', count: 40, days: ERP_SYSTEM_CONFIG.WARRANTY_DAYS.BATTERY_STORAGE },
    { category: 'SOLAR_PANELS', prefix: 'SOL-2026-', count: 40, days: ERP_SYSTEM_CONFIG.WARRANTY_DAYS.SOLAR_PANELS },
    { category: 'CHARGE_CONTROLLER', prefix: 'CHG-2026-', count: 28, days: ERP_SYSTEM_CONFIG.WARRANTY_DAYS.CHARGE_CONTROLLER }
  ];

  for (const conf of serialConfig) {
    for (let i = 1; i <= conf.count; i++) {
      const serialCode = registerSerial(`${conf.prefix}${String(i).padStart(4, '0')}`);
      const isFieldActive = i <= Math.floor(conf.count * 0.6); // 60% in field, 40% warehouse stock
      const isExpired = isFieldActive && (i % 5 === 0); // realistic mix of active vs expired field warranties
      
      let dispatchTime = null;
      let expiryTime = null;
      
      if (isFieldActive) {
        if (isExpired) {
          // Installed 26-28 months ago => expired
          dispatchTime = new Date(Date.now() - (790 + i * 5) * 86400000);
          expiryTime = new Date(dispatchTime.getTime() + conf.days * 86400000);
        } else {
          // Installed 2-14 months ago => active warranty
          dispatchTime = new Date(Date.now() - (60 + i * 7) * 86400000);
          expiryTime = new Date(dispatchTime.getTime() + conf.days * 86400000);
        }
      }

      const cityObj = NORTH_INDIA_CITIES[i % NORTH_INDIA_CITIES.length];

      hardwareStockPool.push({
        serialNumber: serialCode,
        assetCategory: conf.category,
        modelDesignation: `SolIMS Pro ${conf.category} Gen-4`,
        assetStatus: isFieldActive ? 'ACTIVE_IN_FIELD' : 'WAREHOUSE_STOCK',
        customerFullName: isFieldActive ? `${CUSTOMER_FIRST_NAMES[i % CUSTOMER_FIRST_NAMES.length]} ${CUSTOMER_LAST_NAMES[i % CUSTOMER_LAST_NAMES.length]}` : null,
        customerPhoneNumber: isFieldActive ? `+91 98${100 + (i % 800)} ${10000 + i}` : null,
        installationSiteAddress: isFieldActive ? `${cityObj.street}, ${cityObj.city}, Punjab` : null,
        orderReference: isFieldActive ? `ORD/2026/${String(i).padStart(4, '0')}` : null,
        dispatchConfirmedTimestamp: dispatchTime,
        warrantyDurationDays: conf.days,
        warrantyExpiresTimestamp: expiryTime,
        updatedBy: adminUserId
      });
    }
  }

  // Safety Assertion: Set check guarantees zero duplicates
  if (seededSerialSet.size !== 150 || hardwareStockPool.length !== 150) {
    throw new Error(`CRITICAL: Serial asset count mismatch. Expected 150 unique, got ${seededSerialSet.size}`);
  }

  const insertedAssets = await SerialAssetModel.insertMany(hardwareStockPool);
  console.log(`[SEED] Created ${insertedAssets.length} unique hardware serial assets (Zero duplicates verified via Set check)`);
  return insertedAssets;
};

export const seedHistoricalLeadsAndSurveys = async (allUsersList) => {
  const techUsers = allUsersList.filter((u) => u.role === ERP_SYSTEM_CONFIG.RBAC_ROLES.STAFF);
  const sampleLeads = [];

  // 170 rich, realistic leads with Punjab & North India variance
  for (let idx = 0; idx < 170; idx++) {
    const cityObj = NORTH_INDIA_CITIES[idx % NORTH_INDIA_CITIES.length];
    const assignedTech = techUsers[idx % techUsers.length];
    const capacityKw = (idx % 5) + 1; // 1 kW to 5 kW variance
    const variant = idx % 3 === 0 ? 'OFF_GRID' : 'ON_GRID'; // On-Grid & Off-Grid variance

    let status = 'Approved';
    if (idx === 0) status = 'Draft';
    else if (idx === 1) status = 'Survey_Scheduled';
    else if (idx === 2) status = 'Survey_Completed';
    else if (idx % 7 === 0) status = 'Draft';
    else if (idx % 7 === 1) status = 'Survey_Scheduled';
    else if (idx % 7 === 2) status = 'Survey_Completed';
    else if (idx % 7 === 3) status = 'Quoted';
    else if (idx % 15 === 0) status = 'Rejected';

    const isSunilAgrawal = idx === 0;
    const fullName = isSunilAgrawal
      ? 'Sunil Agrawal'
      : `${CUSTOMER_FIRST_NAMES[idx % CUSTOMER_FIRST_NAMES.length]} ${CUSTOMER_LAST_NAMES[idx % CUSTOMER_LAST_NAMES.length]}`;
    const email = isSunilAgrawal
      ? 'customer@solims.com'
      : `client${idx + 1}@solims-lead.in`;
    const phone = isSunilAgrawal
      ? '+91 98333 44556'
      : `+91 98${100 + (idx % 800)} ${10000 + idx}`;
    const address = isSunilAgrawal
      ? 'B-42, Sector 14, Noida, UP'
      : `${cityObj.street}, ${cityObj.city}, Punjab`;

    sampleLeads.push({
      inquiryReference: `INQ/2026/${String(idx + 1).padStart(4, '0')}`,
      customerFullName: fullName,
      customerPhoneNumber: phone,
      customerEmailAddress: email,
      installationSiteAddress: address,
      approximateRoofAreaSqFt: capacityKw * 120 + 40 + (idx % 30),
      averageMonthlyElectricityBillInr: capacityKw * 2200 + (idx % 500),
      requestedCapacityKw: capacityKw,
      requestedVariant: variant,
      isSubsidyEligible: true,
      inquiryWorkflowStatus: status,
      surveyDetails: {
        azimuthDirection: idx % 2 === 0 ? 'South' : 'South-East',
        tiltAngleDegrees: 20 + (idx % 8),
        cableDistanceMeters: 15 + (idx % 25),
        shadowFreeAreaSqFt: capacityKw * 110,
        roofStructureType: idx % 3 === 0 ? 'Tin Shade' : 'RCC Flat',
        gridConnectionVoltage: capacityKw >= 4 ? 'Three-Phase 415V' : 'Single-Phase 230V',
        surveyRemarks: `Site inspected at ${cityObj.city}. Clear southern solar exposure verified.`,
        assignedTechnician: assignedTech._id,
        surveyCompletedAt: !['Draft', 'Survey_Scheduled'].includes(status) ? new Date(Date.now() - (180 - idx) * 86400000) : null
      },
      createdAt: distributePast30DaysDate(idx, 170),
      updatedAt: distributePast30DaysDate(idx, 170)
    });
  }

  const insertedLeads = await LeadModel.insertMany(sampleLeads);
  console.log(`[SEED] Created ${insertedLeads.length} rooftop inquiry and survey leads across Punjab & North India`);
  return insertedLeads;
};

export const seedOrdersAndInstallations = async (insertedLeads, allUsersList) => {
  const adminUser = allUsersList.find((u) => u.role === ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN);
  const techUsers = allUsersList.filter((u) => u.role === ERP_SYSTEM_CONFIG.RBAC_ROLES.STAFF);
  const sampleOrders = [];
  const pad = (n) => String(n).padStart(4, '0');

  // 140 rich ProjectOrders
  for (let idx = 0; idx < 140; idx++) {
    const lead = insertedLeads[idx];
    const quoteRef = `QT/2026/${pad(idx + 1)}`;
    const orderRef = `ORD/2026/${pad(idx + 1)}`;

    // Lifecycle: Draft -> Advance_Paid -> BALANCE_DUE -> Packed -> Dispatched -> Installed -> Done
    let orderStatus = 'Installed';
    if (idx === 0) orderStatus = 'Installed'; // Sunil Agrawal demo
    else if (idx === 1) orderStatus = 'Advance_Paid'; // ORD/2026/0002 demo
    else if (idx === 2) orderStatus = 'Draft';
    else if (idx === 3) orderStatus = 'BALANCE_DUE';
    else if (idx === 4) orderStatus = 'Packed';
    else if (idx === 5) orderStatus = 'Dispatched';
    else {
      const cycle = ['Draft', 'Advance_Paid', 'BALANCE_DUE', 'Packed', 'Dispatched', 'Installed', 'Done'];
      orderStatus = cycle[idx % cycle.length];
    }

    // Subsidy stages variance: NOT_SUBMITTED, DOCUMENTS_VERIFIED, INSPECTION_PENDING, SUBSIDY_DISBURSED
    const subsidyStages = ['NOT_SUBMITTED', 'DOCUMENTS_VERIFIED', 'INSPECTION_PENDING', 'SUBSIDY_DISBURSED'];
    const subsidyStage = subsidyStages[idx % subsidyStages.length];

    // Profitable vs. Loss-Making projects simulation:
    // Approximately 15 projects (~11%) are loss-making due to promotional pilot discounts or complex multi-string BOM overruns
    const isLossMaking = idx % 9 === 4;

    const standardGross = lead.requestedCapacityKw * 60000 + (lead.requestedVariant === 'OFF_GRID' ? 50000 : 0);
    const grossAmount = isLossMaking ? Math.round(standardGross * 0.45) : standardGross; // heavily discounted pilot contract => loss!
    const subsidy = lead.requestedCapacityKw >= 3 ? 78000 : lead.requestedCapacityKw * 30000;
    const netAmount = Math.max(10000, grossAmount - subsidy);

    const isDraft = orderStatus === 'Draft';
    const isFullyPaid = ['Installed', 'Done'].includes(orderStatus) && idx % 4 !== 0;
    const initialAdvance = isDraft ? 0 : Math.round(netAmount * 0.4);
    const totalPaid = isDraft ? 0 : (isFullyPaid ? netAmount : initialAdvance);
    const balanceDue = Math.max(0, netAmount - totalPaid);

    const paymentHistory = [];
    if (!isDraft && initialAdvance > 0) {
      paymentHistory.push({
        paymentKind: 'ADVANCE',
        amountInr: initialAdvance,
        paymentMode: 'UPI',
        transactionReference: `UPI-ADV-${100000 + idx}`,
        invoiceReference: `INV/2026/${pad(idx * 2 + 1)}`,
        recordedAt: new Date(Date.now() - (150 - idx) * 86400000),
        recordedBy: adminUser._id,
        recordedByName: adminUser.fullName
      });
      if (totalPaid > initialAdvance) {
        paymentHistory.push({
          paymentKind: 'BALANCE',
          amountInr: totalPaid - initialAdvance,
          paymentMode: 'NEFT_RTGS',
          transactionReference: `NEFT-BAL-${200000 + idx}`,
          invoiceReference: `INV/2026/${pad(idx * 2 + 2)}`,
          recordedAt: new Date(Date.now() - (70 - (idx % 50)) * 86400000),
          recordedBy: adminUser._id,
          recordedByName: adminUser.fullName
        });
      }
    }

    // Specialised 3-technician crew from all 15 technicians
    const inverterTech = techUsers[(idx * 3) % techUsers.length];
    const rooftopTech = techUsers[(idx * 3 + 1) % techUsers.length];
    const wiringTech = techUsers[(idx * 3 + 2) % techUsers.length];
    const scheduledDate = new Date(Date.now() + ((idx % 14) - 5) * 86400000);
    const hasCrew = !isDraft;

    const crewModificationLog = [];
    if (hasCrew) {
      const originalDate = new Date(scheduledDate.getTime() - 2 * 86400000);
      crewModificationLog.push({
        action: 'ASSIGNED',
        changedAt: new Date(Date.now() - 30 * 86400000),
        changedBy: adminUser._id,
        changedByName: adminUser.fullName,
        changes: [
          { field: 'inverterTechnician', label: 'Inverter Specialist', oldValue: 'Not assigned', newValue: inverterTech.fullName },
          { field: 'rooftopTechnician', label: 'Rooftop Mounting Technician', oldValue: 'Not assigned', newValue: rooftopTech.fullName },
          { field: 'wiringTechnician', label: 'High-Voltage Wiring Technician', oldValue: 'Not assigned', newValue: wiringTech.fullName },
          { field: 'scheduledInstallationDate', label: 'Scheduled Installation Date', oldValue: 'Not scheduled', newValue: originalDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
        ]
      });
    }

    // BOM items
    const panelCount = lead.requestedCapacityKw * 2;
    const panelPrice = 11000;
    const inverterPrice = lead.requestedCapacityKw * 12000 + 10000;

    const billOfMaterials = [
      {
        componentName: `Mono PERC Solar Panels (${panelCount} pcs)`,
        itemCategory: 'SOLAR_PANELS',
        quantityRequired: panelCount,
        unitOfMeasure: 'Panels',
        unitPriceInr: panelPrice,
        totalPriceInr: panelCount * panelPrice,
        requiresSerialTracking: true,
        allocatedSerialNumbers: []
      },
      {
        componentName: `${lead.requestedCapacityKw}kW Smart Inverter`,
        itemCategory: 'INVERTER',
        quantityRequired: 1,
        unitOfMeasure: 'Unit',
        unitPriceInr: inverterPrice,
        totalPriceInr: inverterPrice,
        requiresSerialTracking: true,
        allocatedSerialNumbers: []
      }
    ];

    if (lead.requestedVariant === 'OFF_GRID') {
      billOfMaterials.push({
        componentName: `Lithium Iron Phosphate Battery 5.12kWh`,
        itemCategory: 'BATTERY',
        quantityRequired: 1,
        unitOfMeasure: 'Unit',
        unitPriceInr: 65000,
        totalPriceInr: 65000,
        requiresSerialTracking: true,
        allocatedSerialNumbers: []
      });
    }

    const orderDate = distributePast30DaysDate(idx, 140);
    const isSubsidyDisbursed = subsidyStage === 'SUBSIDY_DISBURSED';

    sampleOrders.push({
      quotationReference: quoteRef,
      orderReference: !isDraft ? orderRef : null,
      leadInquiryId: lead._id,
      customerFullName: lead.customerFullName,
      customerPhoneNumber: lead.customerPhoneNumber,
      customerEmailAddress: lead.customerEmailAddress,
      installationSiteAddress: lead.installationSiteAddress,
      systemCapacityKw: lead.requestedCapacityKw,
      systemVariant: lead.requestedVariant,
      billOfMaterials,
      grossTotalAmountInr: grossAmount,
      estimatedSubsidyAmountInr: subsidy,
      netPayableAmountInr: netAmount,
      advancePaymentAmountInr: totalPaid,
      balancePaymentDueInr: balanceDue,
      paymentHistory,
      orderWorkflowStatus: orderStatus,
      assignedTechnicians: hasCrew ? [inverterTech._id, rooftopTech._id, wiringTech._id] : [],
      inverterTechnician: hasCrew ? inverterTech._id : null,
      rooftopTechnician: hasCrew ? rooftopTech._id : null,
      wiringTechnician: hasCrew ? wiringTech._id : null,
      scheduledInstallationDate: hasCrew ? scheduledDate : null,
      crewModificationLog,
      subsidyApplicationStatus: subsidyStage,
      subsidyDisbursedDate: isSubsidyDisbursed ? new Date(orderDate.getTime() + 5 * 86400000) : null,
      subsidyCompliance: {
        dcrPanelVerified: isSubsidyDisbursed || (idx % 2 === 0),
        serialsLinked: isSubsidyDisbursed || (!isDraft && idx % 3 !== 0),
        roofPhotoProof: isSubsidyDisbursed || ['Installed', 'Done'].includes(orderStatus),
        homeownerSigned: isSubsidyDisbursed || (['Installed', 'Done'].includes(orderStatus) && idx % 4 !== 0)
      },
      createdAt: orderDate,
      updatedAt: orderDate,
      updatedBy: adminUser._id
    });
  }

  const insertedOrders = await OrderModel.insertMany(sampleOrders);
  console.log(`[SEED] Created ${insertedOrders.length} commercial quotations & project orders (15 loss-making stress cases included)`);
  return insertedOrders;
};

export const seedWarehouseStockCatalog = async (adminUserId) => {
  // Ensure strictly positive warehouse stock balances
  const stockDocuments = DEFAULT_STOCK_CATALOG.map((item, index) => ({
    ...item,
    availableUnits: 80 + index * 15, // positive stock balance
    reservedUnits: 15 + index * 3,   // positive reserved balance
    totalDispatchedUnits: 40 + index * 6,
    restockHistory: [{
      quantityAdded: 100 + index * 20,
      restockedAt: new Date(Date.now() - (index + 4) * 86400000),
      restockedBy: adminUserId,
      restockedByName: 'Warehouse Superintendant',
      note: 'Verified positive opening stock balance'
    }],
    updatedBy: adminUserId
  }));

  const insertedStock = await StockItemModel.insertMany(stockDocuments);
  console.log(`[SEED] Created ${insertedStock.length} warehouse stock items with strictly positive balances`);
  return insertedStock;
};

export const seedServiceTicketsAndSiteLogs = async (insertedOrders, allUsersList) => {
  const techUsers = allUsersList.filter((u) => u.role === ERP_SYSTEM_CONFIG.RBAC_ROLES.STAFF);
  const sampleSiteLogs = [];

  // 1. Site Logs: exactly 60 verified rooftop installation logs
  const installedOrders = insertedOrders.filter((o) => ['Installed', 'Done'].includes(o.orderWorkflowStatus));
  for (let i = 0; i < 60; i++) {
    const order = installedOrders[i % installedOrders.length];
    const techUser = techUsers[i % techUsers.length];

    sampleSiteLogs.push({
      orderId: order._id,
      orderReference: order.orderReference || `ORD/2026/${String(i + 1).padStart(4, '0')}`,
      customerFullName: order.customerFullName,
      installationStartTime: new Date(Date.now() - (48 + i) * 3600000),
      installationFinishTime: new Date(Date.now() - (40 + i) * 3600000),
      confirmedCapacityKw: order.systemCapacityKw,
      powerGenerationTestedWatts: order.systemCapacityKw * 930,
      finishedRoofPhotos: [
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="%231E293B"/><rect x="40" y="60" width="520" height="280" rx="8" fill="%230F172A" stroke="%2338BDF8" stroke-width="2"/><text x="60" y="200" fill="%23FBBF24" font-family="monospace" font-size="16" font-weight="bold">SolIMS Verified Roof Array • Shading-Free</text></svg>'
      ],
      homeownerSignatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M10 40 Q 50 10 90 40 T 170 30" stroke="%23135D3B" stroke-width="3" fill="none"/></svg>',
      technicianNotes: `Site sign-off completed by certified technician ${techUser.fullName}. Grid voltage and inverter synchronize tested clean.`,
      leadTechnicianUser: techUser._id,
      completionStatus: 'CONFIRMED_AND_ACCEPTED',
      createdAt: distributePast30DaysDate(i, 60),
      updatedAt: distributePast30DaysDate(i, 60)
    });
  }

  await SiteLogModel.insertMany(sampleSiteLogs);
  console.log(`[SEED] Created ${sampleSiteLogs.length} verified site execution logs with digital signatures`);

  // 2. Service Tickets: exactly 50 breakdown tickets
  const ticketsList = [
    // Mandatory Demo Record 1: 18-mo active warranty (₹0)
    {
      ticketReference: 'TKT/2026/0001',
      customerFullName: 'Sunil Agrawal',
      customerPhoneNumber: '+91 98333 44556',
      installationSiteAddress: 'B-42, Sector 14, Noida, UP',
      targetSerialNumber: 'INV-2024-RAINY-ACTIVE',
      assetCategory: 'INVERTER',
      reportedFaultCode: 'ERR_INVERTER_GRID_FAIL',
      issueDescription: 'Monsoon downpour caused inverter to trip with error ERR_INVERTER_GRID_FAIL. Zero home generation.',
      isUnderActiveWarranty: true,
      warrantyExpiryDate: new Date(Date.now() + 183 * 86400000),
      sparePartCostInr: 0,
      laborChargeCostInr: 0,
      totalPayableAmountInr: 0,
      paymentStatus: 'NOT_REQUIRED',
      ticketWorkflowStatus: 'Done',
      resolutionConfirmationByCustomer: true,
      assignedTechnicianUser: techUsers[0]._id,
      technicianResolutionNotes: 'Replaced DC surge module under manufacturer 2-year warranty at ₹0 charge. System functioning normally.',
      resolvedTimestamp: new Date(),
      createdAt: distributePast30DaysDate(0, 50),
      updatedAt: distributePast30DaysDate(0, 50)
    },
    // Mandatory Demo Record 2: 26-mo expired warranty (billed ₹9,700)
    {
      ticketReference: 'TKT/2026/0002',
      customerFullName: 'Rajendra Prasad',
      customerPhoneNumber: '+91 98765 11223',
      installationSiteAddress: 'Plot 104, Okhla Phase 3, New Delhi',
      targetSerialNumber: 'INV-2024-RAINY-EXPIRED',
      assetCategory: 'INVERTER',
      reportedFaultCode: 'ERR_MOSFET_BURNOUT',
      issueDescription: 'Heavy rain thunderbolt burned inverter control board. Unit does not turn on.',
      isUnderActiveWarranty: false,
      warrantyExpiryDate: new Date(Date.now() - 60 * 86400000),
      sparePartCostInr: 8500,
      laborChargeCostInr: 1200,
      totalPayableAmountInr: 9700,
      paymentStatus: 'PENDING',
      ticketWorkflowStatus: 'Diagnosed',
      resolutionConfirmationByCustomer: false,
      assignedTechnicianUser: techUsers[1 % techUsers.length]._id,
      technicianResolutionNotes: 'Warranty expired 60 days ago. Billed ₹8,500 for replacement inverter card + ₹1,200 visit fee.',
      resolvedTimestamp: null,
      createdAt: distributePast30DaysDate(1, 50),
      updatedAt: distributePast30DaysDate(1, 50)
    }
  ];

  for (let i = 3; i <= 50; i++) {
    const isWarrantyActive = i % 2 !== 0;
    const partsCost = isWarrantyActive ? 0 : 8500;
    const laborCost = isWarrantyActive ? 0 : 1200;
    const totalCost = partsCost + laborCost;
    const assignedTech = techUsers[i % techUsers.length];
    const cityObj = NORTH_INDIA_CITIES[i % NORTH_INDIA_CITIES.length];
    const ticketDate = distributePast30DaysDate(i - 1, 50);

    ticketsList.push({
      ticketReference: `TKT/2026/${String(i).padStart(4, '0')}`,
      customerFullName: `${CUSTOMER_FIRST_NAMES[i % CUSTOMER_FIRST_NAMES.length]} ${CUSTOMER_LAST_NAMES[i % CUSTOMER_LAST_NAMES.length]}`,
      customerPhoneNumber: `+91 98999 ${20000 + i}`,
      installationSiteAddress: `${cityObj.street}, ${cityObj.city}, Punjab`,
      targetSerialNumber: `INV-2026-${String(i % 38 + 1).padStart(4, '0')}`,
      assetCategory: 'INVERTER',
      reportedFaultCode: i % 3 === 0 ? 'ERR_ZERO_POWER' : 'ERR_EARTHING_LEAKAGE',
      issueDescription: 'Monsoon heavy rain trip reported. Ground isolation resistance below threshold.',
      isUnderActiveWarranty: isWarrantyActive,
      warrantyExpiryDate: isWarrantyActive
        ? new Date(Date.now() + (200 + i * 2) * 86400000)
        : new Date(Date.now() - (40 + i * 2) * 86400000),
      sparePartCostInr: partsCost,
      laborChargeCostInr: laborCost,
      totalPayableAmountInr: totalCost,
      paymentStatus: isWarrantyActive ? 'NOT_REQUIRED' : (i % 4 === 0 ? 'PAID' : 'PENDING'),
      paymentDetails: (!isWarrantyActive && i % 4 === 0) ? {
        paymentMode: 'UPI',
        transactionReference: `UPI-SRV-${500000 + i}`,
        paidAmountInr: totalCost,
        paidTimestamp: new Date()
      } : {},
      ticketWorkflowStatus: i % 3 === 0 ? 'Done' : (i % 3 === 1 ? 'Diagnosed' : 'Parts_Replaced'),
      resolutionConfirmationByCustomer: i % 3 === 0,
      assignedTechnicianUser: assignedTech._id,
      technicianResolutionNotes: isWarrantyActive
        ? 'Covered under manufacturer warranty at zero charge.'
        : 'Out-of-warranty inspection and part replacement billed to customer.',
      resolvedTimestamp: i % 3 === 0 ? new Date() : null,
      createdAt: ticketDate,
      updatedAt: ticketDate
    });
  }

  const insertedTickets = await TicketModel.insertMany(ticketsList);
  console.log(`[SEED] Created ${insertedTickets.length} service breakdown tickets (Active ₹0 vs Expired Billed)`);
  return insertedTickets;
};

export const seedDoubleEntryLedger = async (insertedOrders, adminUserId) => {
  const journalEntries = [];

  // Exactly 160 balanced journal entries
  const categories = [
    'ADVANCE_PAYMENT',
    'CUSTOMER_PAYMENT',
    'EQUIPMENT_COGS',
    'SERVICE_REVENUE',
    'TECHNICIAN_PAYROLL',
    'WARRANTY_EXPENSE',
    'SUBSIDY_RECEIVABLE'
  ];

  for (let idx = 0; idx < 160; idx++) {
    const journalRef = `JRN/2026/${String(idx + 1).padStart(4, '0')}`;
    const category = categories[idx % categories.length];
    const order = insertedOrders[idx % insertedOrders.length];
    const amount = Math.round((25000 + (idx * 1750) % 95000) * 100) / 100;

    let lines = [];
    let narrative = '';

    switch (category) {
      case 'ADVANCE_PAYMENT':
        narrative = `Advance collection received for solar installation ${order.customerFullName}`;
        lines = [
          { accountCode: '1010', accountName: 'Cash & Bank Balance', debitAmountInr: amount, creditAmountInr: 0 },
          { accountCode: '1200', accountName: 'Accounts Receivable - Solar Projects', debitAmountInr: 0, creditAmountInr: amount }
        ];
        break;
      case 'EQUIPMENT_COGS':
        narrative = `Warehouse stock release for project ${order.orderReference || 'ORD/2026/0001'}`;
        lines = [
          { accountCode: '5010', accountName: 'Cost of Goods Sold - Solar Materials', debitAmountInr: amount, creditAmountInr: 0 },
          { accountCode: '1300', accountName: 'Warehouse Hardware Inventory Asset', debitAmountInr: 0, creditAmountInr: amount }
        ];
        break;
      case 'TECHNICIAN_PAYROLL':
        narrative = `Rooftop technician installation labor settlement for crew`;
        lines = [
          { accountCode: '5020', accountName: 'Direct Field Labor & Technician Payroll', debitAmountInr: amount, creditAmountInr: 0 },
          { accountCode: '1010', accountName: 'Cash & Bank Balance', debitAmountInr: 0, creditAmountInr: amount }
        ];
        break;
      case 'WARRANTY_EXPENSE':
        narrative = `Monsoon warranty repair replacement parts absorbed at ₹0 customer billing`;
        lines = [
          { accountCode: '5030', accountName: 'Warranty & Maintenance Repair Expense', debitAmountInr: amount, creditAmountInr: 0 },
          { accountCode: '1300', accountName: 'Warehouse Hardware Inventory Asset', debitAmountInr: 0, creditAmountInr: amount }
        ];
        break;
      case 'SUBSIDY_RECEIVABLE':
        narrative = `PM Surya Ghar central government rooftop subsidy receivable recognized`;
        lines = [
          { accountCode: '1210', accountName: 'Government Subsidy Receivable', debitAmountInr: amount, creditAmountInr: 0 },
          { accountCode: '4010', accountName: 'Commercial Solar EPC Revenue', debitAmountInr: 0, creditAmountInr: amount }
        ];
        break;
      default:
        narrative = `Balance milestone payment received from homeowner ${order.customerFullName}`;
        lines = [
          { accountCode: '1010', accountName: 'Cash & Bank Balance', debitAmountInr: amount, creditAmountInr: 0 },
          { accountCode: '1200', accountName: 'Accounts Receivable - Solar Projects', debitAmountInr: 0, creditAmountInr: amount }
        ];
    }

    const journalDate = distributePast30DaysDate(idx, 160);

    journalEntries.push({
      entryReference: journalRef,
      entryDate: journalDate,
      orderReference: order.orderReference || null,
      entryCategory: category,
      narrativeDescription: narrative,
      journalLines: lines,
      totalDebitAmountInr: amount,
      totalCreditAmountInr: amount,
      isBalanced: true,
      createdAt: journalDate,
      updatedAt: journalDate,
      updatedBy: adminUserId
    });
  }

  const insertedJournals = await JournalEntryModel.insertMany(journalEntries);
  console.log(`[SEED] Created ${insertedJournals.length} strictly balanced double-entry general ledger entries`);
  return insertedJournals;
};

export const seedDatabase = async ({ keepConnectionOpen = false } = {}) => {
  console.log('[SEED] Commencing SolIMS historical database seeding (520+ records target)...');
  if (mongoose.connection.readyState !== 1) {
    await connectDatabase();
  }

  await Promise.all([
    UserModel.deleteMany({}),
    LeadModel.deleteMany({}),
    OrderModel.deleteMany({}),
    SerialAssetModel.deleteMany({}),
    StockMoveModel.deleteMany({}),
    StockItemModel.deleteMany({}),
    SiteLogModel.deleteMany({}),
    TicketModel.deleteMany({}),
    JournalEntryModel.deleteMany({})
  ]);

  const seededUsers = await seedEnterpriseUsers();
  const adminUser = seededUsers[0];

  await seedHistoricalHardwareInventory(adminUser._id);
  await seedWarehouseStockCatalog(adminUser._id);
  const seededLeads = await seedHistoricalLeadsAndSurveys(seededUsers);
  const seededOrders = await seedOrdersAndInstallations(seededLeads, seededUsers);
  await seedServiceTicketsAndSiteLogs(seededOrders, seededUsers);
  await seedDoubleEntryLedger(seededOrders, adminUser._id);
  await generateSampleDemoSimulatedEmails();

  // Self-Healing atomic ir.sequence counter synchronization to prevent E11000 duplicate keys
  console.log('[SEED] Synchronizing atomic ir.sequence registries to highest seeded numbers...');
  await synchronizeSequenceCounter(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.INQUIRY, 170);
  await synchronizeSequenceCounter(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.QUOTE, 140);
  await synchronizeSequenceCounter(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.ORDER, 140);
  await synchronizeSequenceCounter(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.DISPATCH, 60);
  await synchronizeSequenceCounter(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.TICKET, 50);
  await synchronizeSequenceCounter(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.JOURNAL, 160);
  await synchronizeSequenceCounter(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.INVOICE, 280);
  await synchronizeSequenceCounter(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.EMAIL, 200);

  const [userCount, assetCount, leadCount, orderCount, siteLogCount, ticketCount, journalCount, stockCount] = await Promise.all([
    UserModel.countDocuments(), SerialAssetModel.countDocuments(), LeadModel.countDocuments(), OrderModel.countDocuments(),
    SiteLogModel.countDocuments(), TicketModel.countDocuments(), JournalEntryModel.countDocuments(), StockItemModel.countDocuments()
  ]);
  const totalRecords = userCount + assetCount + leadCount + orderCount + siteLogCount + ticketCount + journalCount + stockCount;
  console.log(`[SEED] Record totals: users=${userCount} assets=${assetCount} leads=${leadCount} orders=${orderCount} siteLogs=${siteLogCount} tickets=${ticketCount} journals=${journalCount} stockItems=${stockCount} => TOTAL ${totalRecords} records!`);

  console.log('[SEED] ✨ Seeding completed successfully with 520+ realistic records & synchronized sequences!');
  if (!keepConnectionOpen) {
    await disconnectDatabase();
  }
};

export const executeDatabaseSeedRoutine = seedDatabase;

if (process.argv[1]?.endsWith('seedDatabase.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED] Execution failed:', err);
      process.exit(1);
    });
}
