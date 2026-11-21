/**
 * @AUTHOR: Garima Mittal
 * @FILE: seedDatabase.js
 * @RESPONSIBILITY: Populates 150+ enterprise records, 15 technicians, realistic solar EPC scenarios, and syncs ir.sequence counters.
 * @DEPENDENCIES: mongoose, bcryptjs, db.js, sequenceRegistry.js, all domain models
 */

import bcrypt from 'bcryptjs';
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
  console.log(`[SEED] Created ${insertedUsers.length} user accounts (4 demo personas + 14 technicians)`);
  return insertedUsers;
};

export const seedHistoricalHardwareInventory = async (adminUserId) => {
  const hardwareStockPool = [];
  const componentCategories = ['INVERTER', 'BATTERY', 'CHARGE_CONTROLLER', 'SOLAR_PANELS'];

  for (let index = 1; index <= 300; index++) {
    const assignedCategory = componentCategories[index % componentCategories.length];
    const serialCode = `${assignedCategory.substring(0, 3)}-2026-${String(index).padStart(4, '0')}`;
    let duration = ERP_SYSTEM_CONFIG.WARRANTY_DAYS.INVERTER;
    if (assignedCategory === 'SOLAR_PANELS') duration = ERP_SYSTEM_CONFIG.WARRANTY_DAYS.SOLAR_PANELS;

    hardwareStockPool.push({
      serialNumber: serialCode,
      assetCategory: assignedCategory,
      modelDesignation: `SolIMS Enterprise Pro ${assignedCategory} Gen-4`,
      assetStatus: index <= 150 ? 'ACTIVE_IN_FIELD' : 'WAREHOUSE_STOCK',
      warrantyDurationDays: duration,
      warrantyExpiresTimestamp: index <= 150 ? new Date(Date.now() + duration * 86400000) : null,
      updatedBy: adminUserId
    });
  }

  // Edge cases for Scene 5: Rainy Season Breakdown
  // 18-month old inverter (under warranty: 730 days total - 547 days elapsed = 183 days left)
  hardwareStockPool.push({
    serialNumber: 'INV-2024-RAINY-ACTIVE',
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

  // 26-month old inverter (expired warranty: 730 days total - 790 days elapsed = expired by 60 days)
  hardwareStockPool.push({
    serialNumber: 'INV-2024-RAINY-EXPIRED',
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

  const insertedAssets = await SerialAssetModel.insertMany(hardwareStockPool);
  console.log(`[SEED] Created ${insertedAssets.length} hardware serial assets`);
  return insertedAssets;
};

export const seedHistoricalLeadsAndSurveys = async (allUsersList) => {
  const techUsers = allUsersList.filter((u) => u.role === ERP_SYSTEM_CONFIG.RBAC_ROLES.STAFF);
  const sampleLeads = [];

  const customerProfiles = [
    { name: 'Sunil Agrawal', phone: '+91 98333 44556', city: 'Noida', kw: 3, variant: 'ON_GRID' },
    { name: 'Dr. Meenakshi Sundaram', phone: '+91 98450 77112', city: 'Bengaluru', kw: 5, variant: 'OFF_GRID' },
    { name: 'Harpreet Singh', phone: '+91 98114 99001', city: 'Chandigarh', kw: 4, variant: 'ON_GRID' },
    { name: 'Ananya Deshmukh', phone: '+91 98230 44551', city: 'Pune', kw: 2, variant: 'ON_GRID' },
    { name: 'Kishore Khandelwal', phone: '+91 94140 33221', city: 'Jaipur', kw: 5, variant: 'OFF_GRID' },
    { name: 'Venkatesh Iyer', phone: '+91 98401 22334', city: 'Chennai', kw: 3, variant: 'ON_GRID' },
    { name: 'Alok Mukherjee', phone: '+91 98300 88990', city: 'Kolkata', kw: 1, variant: 'ON_GRID' },
    { name: 'Bhupendra Patel', phone: '+91 98250 11992', city: 'Ahmedabad', kw: 4, variant: 'OFF_GRID' }
  ];

  for (let idx = 0; idx < 120; idx++) {
    const profile = customerProfiles[idx % customerProfiles.length];
    const inquiryCode = `INQ/2026/${String(idx + 1).padStart(4, '0')}`;
    const assignedTech = techUsers[idx % techUsers.length];

    let status = 'Approved';
    if (idx === 0) status = 'Draft';
    else if (idx === 1) status = 'Survey_Scheduled';
    else if (idx === 2) status = 'Survey_Completed';
    else if (idx % 5 === 0) status = 'Quoted';

    sampleLeads.push({
      inquiryReference: inquiryCode,
      customerFullName: `${profile.name} ${idx > 7 ? `(#${idx + 1})` : ''}`,
      customerPhoneNumber: profile.phone,
      customerEmailAddress: `client${idx + 1}@example.com`,
      installationSiteAddress: `${10 + idx}, Rooftop Heights, ${profile.city}`,
      approximateRoofAreaSqFt: profile.kw * 120 + 50,
      averageMonthlyElectricityBillInr: profile.kw * 2200,
      requestedCapacityKw: profile.kw,
      requestedVariant: profile.variant,
      isSubsidyEligible: true,
      inquiryWorkflowStatus: status,
      surveyDetails: {
        azimuthDirection: 'South',
        tiltAngleDegrees: 22,
        cableDistanceMeters: 25,
        shadowFreeAreaSqFt: profile.kw * 110,
        roofStructureType: 'RCC Flat',
        gridConnectionVoltage: profile.kw >= 4 ? 'Three-Phase 415V' : 'Single-Phase 230V',
        surveyRemarks: 'Clear southern exposure with minimal parapet shading. Grid voltage verified.',
        assignedTechnician: assignedTech._id,
        surveyCompletedAt: status !== 'Draft' && status !== 'Survey_Scheduled' ? new Date() : null
      }
    });
  }

  const insertedLeads = await LeadModel.insertMany(sampleLeads);
  console.log(`[SEED] Created ${insertedLeads.length} rooftop inquiry and survey leads`);
  return insertedLeads;
};

export const seedOrdersAndInstallations = async (insertedLeads, allUsersList) => {
  const adminUser = allUsersList.find((u) => u.role === ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN);
  const techUsers = allUsersList.filter((u) => u.role === ERP_SYSTEM_CONFIG.RBAC_ROLES.STAFF);
  const sampleOrders = [];
  const pad = (n) => String(n).padStart(4, '0');

  for (let idx = 0; idx < 60; idx++) {
    const lead = insertedLeads[idx];
    const quoteRef = `QT/2026/${pad(idx + 1)}`;
    const orderRef = `ORD/2026/${pad(idx + 1)}`;

    // Lifecycle spread: Draft -> Advance_Paid -> BALANCE_DUE (leftover pay) -> Packed -> Dispatched -> Installed
    let orderStatus = 'Installed';
    if (idx === 0) orderStatus = 'Draft';
    else if (idx === 1) orderStatus = 'BALANCE_DUE';
    else if (idx === 2) orderStatus = 'Packed';
    else if (idx === 3) orderStatus = 'Dispatched';
    else if (idx >= 40) orderStatus = ['Draft', 'BALANCE_DUE', 'Advance_Paid', 'Packed', 'Dispatched'][idx % 5];

    const grossAmount = lead.requestedCapacityKw * 60000 + (lead.requestedVariant === 'OFF_GRID' ? 50000 : 0);
    const subsidy = lead.requestedCapacityKw >= 3 ? 78000 : lead.requestedCapacityKw * 30000;
    const netAmount = grossAmount - subsidy;

    const isDraft = orderStatus === 'Draft';
    const isFullyPaid = ['Advance_Paid', 'Installed'].includes(orderStatus) && !(orderStatus === 'Installed' && idx % 6 === 0);
    const initialAdvance = isDraft ? 0 : Math.round(netAmount * 0.4);
    const totalPaid = isDraft ? 0 : (isFullyPaid ? netAmount : initialAdvance);
    const hasCrew = !isDraft;

    const paymentHistory = [];
    if (!isDraft) {
      paymentHistory.push({
        paymentKind: 'ADVANCE',
        amountInr: initialAdvance,
        paymentMode: 'UPI',
        transactionReference: `UPI-ADV-${100000 + idx}`,
        invoiceReference: `INV/2026/${pad(idx * 2 + 1)}`,
        recordedAt: new Date(Date.now() - (60 - idx) * 86400000),
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
          recordedAt: new Date(Date.now() - (30 - (idx % 25)) * 86400000),
          recordedBy: adminUser._id,
          recordedByName: adminUser.fullName
        });
      }
    }

    // Specialised 3-technician crew: Inverter Specialist, Rooftop Mounting Technician, High-Voltage Wiring Technician
    const inverterTech = techUsers[2 + 2 * (idx % 7)];
    const rooftopTech = techUsers[1 + 2 * (idx % 7)];
    const wiringTech = techUsers[0];
    const scheduledDate = new Date(Date.now() + ((idx % 10) - 3) * 86400000);

    const crewModificationLog = [];
    if (hasCrew) {
      const originalDate = new Date(scheduledDate.getTime() - 2 * 86400000);
      crewModificationLog.push({
        action: 'ASSIGNED',
        changedAt: new Date(Date.now() - 20 * 86400000),
        changedBy: adminUser._id,
        changedByName: adminUser.fullName,
        changes: [
          { field: 'inverterTechnician', label: 'Inverter Specialist', oldValue: 'Not assigned', newValue: inverterTech.fullName },
          { field: 'rooftopTechnician', label: 'Rooftop Mounting Technician', oldValue: 'Not assigned', newValue: rooftopTech.fullName },
          { field: 'wiringTechnician', label: 'High-Voltage Wiring Technician', oldValue: 'Not assigned', newValue: wiringTech.fullName },
          { field: 'scheduledInstallationDate', label: 'Scheduled Installation Date', oldValue: 'Not scheduled', newValue: originalDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
        ]
      });
      if (idx % 4 === 0) {
        crewModificationLog.push({
          action: 'MODIFIED',
          changedAt: new Date(Date.now() - 5 * 86400000),
          changedBy: adminUser._id,
          changedByName: adminUser.fullName,
          changes: [
            { field: 'scheduledInstallationDate', label: 'Scheduled Installation Date', oldValue: originalDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), newValue: scheduledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
          ]
        });
      }
    }

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
      billOfMaterials: [
        {
          componentName: `Mono PERC Solar Panels (${lead.requestedCapacityKw * 2} pcs)`,
          itemCategory: 'SOLAR_PANELS',
          quantityRequired: lead.requestedCapacityKw * 2,
          unitOfMeasure: 'Panels',
          unitPriceInr: 11000,
          totalPriceInr: lead.requestedCapacityKw * 2 * 11000,
          requiresSerialTracking: true,
          allocatedSerialNumbers: []
        },
        {
          componentName: `${lead.requestedCapacityKw}kW Smart Inverter`,
          itemCategory: 'INVERTER',
          quantityRequired: 1,
          unitOfMeasure: 'Unit',
          unitPriceInr: 25000,
          totalPriceInr: 25000,
          requiresSerialTracking: true,
          allocatedSerialNumbers: []
        }
      ],
      grossTotalAmountInr: grossAmount,
      estimatedSubsidyAmountInr: subsidy,
      netPayableAmountInr: netAmount,
      advancePaymentAmountInr: totalPaid,
      balancePaymentDueInr: netAmount - totalPaid,
      paymentHistory,
      orderWorkflowStatus: orderStatus,
      assignedTechnicians: hasCrew ? [inverterTech._id, rooftopTech._id, wiringTech._id] : [],
      inverterTechnician: hasCrew ? inverterTech._id : null,
      rooftopTechnician: hasCrew ? rooftopTech._id : null,
      wiringTechnician: hasCrew ? wiringTech._id : null,
      scheduledInstallationDate: hasCrew ? scheduledDate : null,
      crewModificationLog,
      subsidyApplicationStatus: idx < 10 ? 'INSPECTION_PENDING' : 'DOCUMENTS_VERIFIED',
      updatedBy: adminUser._id
    });
  }

  const insertedOrders = await OrderModel.insertMany(sampleOrders);
  console.log(`[SEED] Created ${insertedOrders.length} quotation and confirmed project orders (3-technician crews + crew modification logs + payment history)`);
  return insertedOrders;
};

export const seedWarehouseStockCatalog = async (adminUserId) => {
  const stockDocuments = DEFAULT_STOCK_CATALOG.map((item, index) => ({
    ...item,
    totalDispatchedUnits: 20 + index * 3,
    restockHistory: [{
      quantityAdded: item.availableUnits + item.reservedUnits,
      restockedAt: new Date(Date.now() - (index + 3) * 86400000),
      restockedBy: adminUserId,
      restockedByName: 'Opening stock',
      note: 'Opening warehouse balance'
    }],
    updatedBy: adminUserId
  }));
  const insertedStock = await StockItemModel.insertMany(stockDocuments);
  console.log(`[SEED] Created ${insertedStock.length} warehouse stock catalog items (available / reserved units)`);
  return insertedStock;
};

export const seedServiceTicketsAndSiteLogs = async (insertedOrders, allUsersList) => {
  const techUser = allUsersList.find((u) => u.role === ERP_SYSTEM_CONFIG.RBAC_ROLES.STAFF);
  const sampleSiteLogs = [];

  const installedOrders = insertedOrders.filter((o) => o.orderWorkflowStatus === 'Installed');
  for (const order of installedOrders) {
    sampleSiteLogs.push({
      orderId: order._id,
      orderReference: order.orderReference,
      customerFullName: order.customerFullName,
      installationStartTime: new Date(Date.now() - 36 * 3600000),
      installationFinishTime: new Date(Date.now() - 28 * 3600000),
      confirmedCapacityKw: order.systemCapacityKw,
      powerGenerationTestedWatts: order.systemCapacityKw * 920,
      finishedRoofPhotos: [
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231E293B"/><rect x="40" y="60" width="520" height="280" rx="8" fill="%230F172A" stroke="%2338BDF8" stroke-width="2"/><g fill="%230284C7" stroke="%2338BDF8" stroke-width="1.5"><rect x="60" y="80" width="110" height="110" rx="4"/><rect x="190" y="80" width="110" height="110" rx="4"/><rect x="320" y="80" width="110" height="110" rx="4"/><rect x="450" y="80" width="90" height="110" rx="4"/><rect x="60" y="210" width="110" height="110" rx="4"/><rect x="190" y="210" width="110" height="110" rx="4"/><rect x="320" y="210" width="110" height="110" rx="4"/><rect x="450" y="210" width="90" height="110" rx="4"/></g><rect x="0" y="350" width="600" height="50" fill="%230F172A" opacity="0.9"/><text x="20" y="380" fill="%23FBBF24" font-family="monospace" font-size="14" font-weight="bold">SolIMS Verified Roof Angle %231 • East Azimuth Array • 100%25 Shading Free</text></svg>',
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230F172A"/><rect x="40" y="60" width="520" height="280" rx="8" fill="%231E293B" stroke="%2322C55E" stroke-width="2"/><g fill="%23135D3B" stroke="%2386EFAC" stroke-width="1.5"><rect x="70" y="90" width="120" height="100" rx="4"/><rect x="210" y="90" width="120" height="100" rx="4"/><rect x="350" y="90" width="120" height="100" rx="4"/><rect x="70" y="210" width="120" height="100" rx="4"/><rect x="210" y="210" width="120" height="100" rx="4"/><rect x="350" y="210" width="120" height="100" rx="4"/></g><rect x="0" y="350" width="600" height="50" fill="%230F172A" opacity="0.9"/><text x="20" y="380" fill="%2334D399" font-family="monospace" font-size="14" font-weight="bold">SolIMS Verified Roof Angle %232 • DC String Inverter &amp; Double Anchor Grounding</text></svg>'
      ],
      homeownerSignatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M10 40 Q 50 10 90 40 T 170 30" stroke="%23714B67" stroke-width="3" fill="none"/></svg>',
      technicianNotes: 'Complete installation signed off by homeowner. Voltage levels verified.',
      leadTechnicianUser: techUser._id,
      completionStatus: 'CONFIRMED_AND_ACCEPTED'
    });
  }
  await SiteLogModel.insertMany(sampleSiteLogs);
  console.log(`[SEED] Created ${sampleSiteLogs.length} verified site execution logs with digital signatures`);

  // Tickets for Scene 5: Rainy Season Breakdown
  const ticketsList = [
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
      ticketWorkflowStatus: 'Done',
      resolutionConfirmationByCustomer: true,
      technicianResolutionNotes: 'Replaced DC surge module under manufacturer 2-year warranty at ₹0 charge. System functioning normally.',
      resolvedTimestamp: new Date()
    },
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
      ticketWorkflowStatus: 'Diagnosed',
      resolutionConfirmationByCustomer: false,
      technicianResolutionNotes: 'Warranty expired 60 days ago. Billed ₹8,500 for replacement inverter card + ₹1,200 visit fee.',
      resolvedTimestamp: null
    }
  ];

  for (let i = 3; i <= 40; i++) {
    ticketsList.push({
      ticketReference: `TKT/2026/${String(i).padStart(4, '0')}`,
      customerFullName: `Service Customer #${i}`,
      customerPhoneNumber: `+91 98999 ${20000 + i}`,
      installationSiteAddress: `Site ${i}, Industrial Area, Gurugram`,
      targetSerialNumber: `INV-2026-000${i % 9 + 1}`,
      assetCategory: 'INVERTER',
      reportedFaultCode: 'ERR_ZERO_POWER',
      issueDescription: 'Earthing fault reported following continuous rainy spell.',
      isUnderActiveWarranty: true,
      warrantyExpiryDate: new Date(Date.now() + 300 * 86400000),
      sparePartCostInr: 0,
      laborChargeCostInr: 0,
      totalPayableAmountInr: 0,
      ticketWorkflowStatus: i % 2 === 0 ? 'Done' : 'Draft',
      resolutionConfirmationByCustomer: i % 2 === 0
    });
  }

  const insertedTickets = await TicketModel.insertMany(ticketsList);
  console.log(`[SEED] Created ${insertedTickets.length} service breakdown tickets`);
};

export const seedDoubleEntryLedger = async (insertedOrders, adminUserId) => {
  const journalEntries = [];

  for (let idx = 0; idx < 60; idx++) {
    const order = insertedOrders[idx];
    const journalRef = `JRN/2026/${String(idx + 1).padStart(4, '0')}`;
    const advanceAmount = order.advancePaymentAmountInr || 50000;

    journalEntries.push({
      entryReference: journalRef,
      entryDate: new Date(Date.now() - idx * 86400000),
      orderReference: order.orderReference,
      entryCategory: 'ADVANCE_PAYMENT',
      narrativeDescription: `Advance received for solar project ${order.customerFullName}`,
      journalLines: [
        { accountCode: '1010', accountName: 'Cash & Bank Balance', debitAmountInr: advanceAmount, creditAmountInr: 0 },
        { accountCode: '1200', accountName: 'Accounts Receivable - Solar Projects', debitAmountInr: 0, creditAmountInr: advanceAmount }
      ],
      totalDebitAmountInr: advanceAmount,
      totalCreditAmountInr: advanceAmount,
      isBalanced: true,
      updatedBy: adminUserId
    });
  }

  await JournalEntryModel.insertMany(journalEntries);
  console.log(`[SEED] Created ${journalEntries.length} balanced double-entry general ledger records`);
};

export const executeDatabaseSeedRoutine = async () => {
  console.log('[SEED] Commencing SolIMS historical database seeding...');
  await connectDatabase();

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

  // Self-Healing ir.sequence counter synchronization
  console.log('[SEED] Synchronizing atomic ir.sequence registries...');
  await synchronizeSequenceCounter(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.INQUIRY, 120);
  await synchronizeSequenceCounter(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.QUOTE, 60);
  await synchronizeSequenceCounter(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.ORDER, 60);
  await synchronizeSequenceCounter(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.DISPATCH, 10);
  await synchronizeSequenceCounter(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.TICKET, 40);
  await synchronizeSequenceCounter(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.JOURNAL, 60);
  await synchronizeSequenceCounter(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.INVOICE, 120);

  const [userCount, assetCount, leadCount, orderCount, siteLogCount, ticketCount, journalCount, stockCount] = await Promise.all([
    UserModel.countDocuments(), SerialAssetModel.countDocuments(), LeadModel.countDocuments(), OrderModel.countDocuments(),
    SiteLogModel.countDocuments(), TicketModel.countDocuments(), JournalEntryModel.countDocuments(), StockItemModel.countDocuments()
  ]);
  const totalRecords = userCount + assetCount + leadCount + orderCount + siteLogCount + ticketCount + journalCount + stockCount;
  console.log(`[SEED] Record totals: users=${userCount} assets=${assetCount} leads=${leadCount} orders=${orderCount} siteLogs=${siteLogCount} tickets=${ticketCount} journals=${journalCount} stockItems=${stockCount} => ${totalRecords} records (+ simulated emails)`);

  console.log('[SEED] ✨ Seeding completed successfully with realistic records & synchronized sequences!');
  await disconnectDatabase();
};

if (process.argv[1]?.endsWith('seedDatabase.js')) {
  executeDatabaseSeedRoutine()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED] Execution failed:', err);
      process.exit(1);
    });
}
