/**
 * @AUTHOR: Garima Mittal
 * @FILE: order.service.js
 * @RESPONSIBILITY: Auto-generates exact Bill of Materials, manages commercial quotes, captures advance payments, and schedules crews.
 * @DEPENDENCIES: order.model.js, lead.model.js, sequenceRegistry.js, socketEmitter.js, journalEntry.model.js, erpConfig.js
 */

import { OrderModel } from './order.model.js';
import { LeadModel } from '../leads/lead.model.js';
import { JournalEntryModel } from '../accounting/journalEntry.model.js';
import { getNextSequenceNumber } from '../../core/sequenceRegistry.js';
import { emitErpEvent } from '../../core/socketEmitter.js';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';
import { provisionCustomerUserAccount } from '../auth/auth.service.js';
import { UserModel } from '../auth/user.model.js';
import { SiteLogModel } from '../service/siteLog.model.js';
import { TicketModel } from '../service/ticket.model.js';
import { SerialAssetModel } from '../inventory/serialAsset.model.js';
import {
  buildOrderScopeFilter,
  buildLeadScopeFilter,
  buildCustomerPhoneRegex,
  buildHttpError
} from '../../core/customerScope.js';
import {
  dispatchSimulatedEmail,
  renderStage2ActivationEmailTemplate
} from '../notifications/simulatedEmail.service.js';

export const computeAutomatedBillOfMaterials = (capacityKw, systemVariant) => {
  const panelQuantity = capacityKw * ERP_SYSTEM_CONFIG.BOM_TEMPLATES.PANEL_COUNT_PER_KW;
  const panelUnitPrice = 11000;
  const inverterUnitPrice = capacityKw * 12000 + 10000;
  const standsUnitPrice = 4500;
  const wiringUnitPrice = 3500;
  const earthingUnitPrice = 4000;
  const installationFee = capacityKw * 3500;

  const generatedBomList = [
    {
      componentName: `Mono PERC 550W Half-Cut Solar Panels (Batch of ${panelQuantity})`,
      itemCategory: 'SOLAR_PANELS',
      quantityRequired: panelQuantity,
      unitOfMeasure: 'Panels',
      unitPriceInr: panelUnitPrice,
      totalPriceInr: panelQuantity * panelUnitPrice,
      requiresSerialTracking: true,
      allocatedSerialNumbers: []
    },
    {
      componentName: `${capacityKw} kW Smart Solar Inverter (${systemVariant === 'OFF_GRID' ? 'Hybrid' : 'Grid-Tied'})`,
      itemCategory: 'INVERTER',
      quantityRequired: 1,
      unitOfMeasure: 'Unit',
      unitPriceInr: inverterUnitPrice,
      totalPriceInr: inverterUnitPrice,
      requiresSerialTracking: true,
      allocatedSerialNumbers: []
    },
    {
      componentName: `Galvanized High-Wind Elevated Roof Mounting Stands (${capacityKw} kW)`,
      itemCategory: 'STANDS',
      quantityRequired: capacityKw,
      unitOfMeasure: 'Sets',
      unitPriceInr: standsUnitPrice,
      totalPriceInr: capacityKw * standsUnitPrice,
      requiresSerialTracking: false,
      allocatedSerialNumbers: []
    },
    {
      componentName: 'Dual ACDB & DCDB Surge Protection Distribution Enclosures',
      itemCategory: 'WIRING_BOX',
      quantityRequired: 1,
      unitOfMeasure: 'Set',
      unitPriceInr: wiringUnitPrice,
      totalPriceInr: wiringUnitPrice,
      requiresSerialTracking: false,
      allocatedSerialNumbers: []
    },
    {
      componentName: 'Pure Copper Chemical Earthing Kit with Lightning Arrestor',
      itemCategory: 'SAFETY_EARTHING',
      quantityRequired: 1,
      unitOfMeasure: 'Kit',
      unitPriceInr: earthingUnitPrice,
      totalPriceInr: earthingUnitPrice,
      requiresSerialTracking: false,
      allocatedSerialNumbers: []
    },
    {
      componentName: 'Site Engineering, Roof Mounting & Net-Metering Testing Service',
      itemCategory: 'SERVICE',
      quantityRequired: 1,
      unitOfMeasure: 'Project',
      unitPriceInr: installationFee,
      totalPriceInr: installationFee,
      requiresSerialTracking: false,
      allocatedSerialNumbers: []
    }
  ];

  if (systemVariant === 'OFF_GRID') {
    const batteryCount = capacityKw >= 3 ? 2 : 1;
    const batteryUnitPrice = 32000;
    const controllerUnitPrice = 8500;

    generatedBomList.push({
      componentName: `Deep Cycle LiFePO4 48V 150Ah Solar Battery Bank`,
      itemCategory: 'BATTERY',
      quantityRequired: batteryCount,
      unitOfMeasure: 'Units',
      unitPriceInr: batteryUnitPrice,
      totalPriceInr: batteryCount * batteryUnitPrice,
      requiresSerialTracking: true,
      allocatedSerialNumbers: []
    });

    generatedBomList.push({
      componentName: `Smart MPPT 60A Solar Charge Controller`,
      itemCategory: 'CHARGE_CONTROLLER',
      quantityRequired: 1,
      unitOfMeasure: 'Unit',
      unitPriceInr: controllerUnitPrice,
      totalPriceInr: controllerUnitPrice,
      requiresSerialTracking: true,
      allocatedSerialNumbers: []
    });
  }

  return generatedBomList;
};

export const calculateEstimatedSubsidyAmount = (capacityKw, isSubsidyEligible) => {
  if (!isSubsidyEligible) return 0;
  if (capacityKw === 1) return ERP_SYSTEM_CONFIG.SUBSIDY_BENCHMARKS.UP_TO_1KW_INR;
  if (capacityKw === 2) return ERP_SYSTEM_CONFIG.SUBSIDY_BENCHMARKS.UP_TO_2KW_INR;
  return ERP_SYSTEM_CONFIG.SUBSIDY_BENCHMARKS.THREE_KW_AND_ABOVE_INR;
};

const formatInr = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

export const ORDER_POPULATE_PATHS = [
  { path: 'assignedTechnicians', select: 'fullName email phoneNumber assignedSpecialization role' },
  { path: 'inverterTechnician', select: 'fullName email phoneNumber assignedSpecialization role' },
  { path: 'rooftopTechnician', select: 'fullName email phoneNumber assignedSpecialization role' },
  { path: 'wiringTechnician', select: 'fullName email phoneNumber assignedSpecialization role' }
];

const ORDER_PROGRESS_RANK = {
  Cancelled: -1,
  Draft: 0,
  Advance_Paid: 1,
  BALANCE_DUE: 1,
  Packed: 2,
  Dispatched: 3,
  Installed: 4,
  Done: 5
};

const PAID_ADVANCE_STATUSES = ['Advance_Paid', 'BALANCE_DUE', 'Packed', 'Dispatched', 'Installed', 'Done'];

const resolveActorName = async (userId) => {
  if (!userId) return 'System';
  const actor = await UserModel.findById(userId).select('fullName');
  return actor?.fullName || 'System';
};

export const generateQuoteForLeadInquiry = async (leadInquiryId, customDiscountInr = 0, creatorUserId) => {
  const leadRecord = await LeadModel.findById(leadInquiryId);
  if (!leadRecord) throw buildHttpError(404, 'Lead inquiry not found');

  // Re-clickable BOM: if a quote already exists for this lead, simply re-open it instead of re-running the creation guard.
  const existingQuote = await OrderModel.findOne({
    $or: [
      { leadInquiryId: leadRecord._id },
      ...(leadRecord.quoteGeneratedReference ? [{ quotationReference: leadRecord.quoteGeneratedReference }] : [])
    ]
  })
    .sort({ createdAt: -1 })
    .populate(ORDER_POPULATE_PATHS);
  if (existingQuote) {
    return { quote: existingQuote, alreadyGenerated: true };
  }

  const statusNormalized = String(leadRecord.inquiryWorkflowStatus || leadRecord.status || '').toUpperCase();
  const isEligibleForFirstQuote = ['APPROVED', 'QUOTED'].includes(statusNormalized) || Boolean(leadRecord.quoteGeneratedReference);
  if (!isEligibleForFirstQuote) {
    throw buildHttpError(400, 'Guardrail violation: Quotation can only be generated after technical survey approval');
  }

  const discount = Number(customDiscountInr) || 0;
  const generatedQuoteRef = await getNextSequenceNumber(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.QUOTE);
  const calculatedBom = computeAutomatedBillOfMaterials(leadRecord.requestedCapacityKw, leadRecord.requestedVariant);
  const grossTotal = calculatedBom.reduce((sum, item) => sum + item.totalPriceInr, 0) - discount;
  const subsidyAmount = calculateEstimatedSubsidyAmount(leadRecord.requestedCapacityKw, leadRecord.isSubsidyEligible);
  const netPayable = Math.max(0, grossTotal - subsidyAmount);

  const createdOrderQuote = await OrderModel.create({
    quotationReference: generatedQuoteRef,
    leadInquiryId: leadRecord._id,
    customerFullName: leadRecord.customerFullName,
    customerPhoneNumber: leadRecord.customerPhoneNumber,
    customerEmailAddress: leadRecord.customerEmailAddress,
    installationSiteAddress: leadRecord.installationSiteAddress,
    systemCapacityKw: leadRecord.requestedCapacityKw,
    systemVariant: leadRecord.requestedVariant,
    billOfMaterials: calculatedBom,
    grossTotalAmountInr: grossTotal,
    estimatedSubsidyAmountInr: subsidyAmount,
    netPayableAmountInr: netPayable,
    balancePaymentDueInr: netPayable,
    orderWorkflowStatus: 'Draft',
    updatedBy: creatorUserId
  });

  leadRecord.inquiryWorkflowStatus = 'Quoted';
  leadRecord.quoteGeneratedReference = generatedQuoteRef;
  await leadRecord.save();

  emitErpEvent('QUOTATION_GENERATED', { quote: createdOrderQuote });
  return { quote: createdOrderQuote, alreadyGenerated: false };
};

export const fetchQuoteForLead = async (leadInquiryId) => {
  return OrderModel.findOne({ leadInquiryId }).sort({ createdAt: -1 }).populate(ORDER_POPULATE_PATHS);
};

const appendPaymentRecord = async (orderRecord, { paymentKind, amount, paymentMode, transactionReference, recordingUserId }) => {
  const invoiceReference = await getNextSequenceNumber(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.INVOICE);
  orderRecord.paymentHistory.push({
    paymentKind,
    amountInr: amount,
    paymentMode,
    transactionReference,
    invoiceReference,
    recordedAt: new Date(),
    recordedBy: recordingUserId || null,
    recordedByName: await resolveActorName(recordingUserId)
  });
};

const postPaymentJournalEntry = async ({ orderRecord, amount, entryCategory, narrative, recordingUserId }) => {
  // Immutable double-entry posting: Debit 1010 Bank / Credit 1200 Accounts Receivable
  const journalRef = await getNextSequenceNumber(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.JOURNAL);
  return JournalEntryModel.create({
    entryReference: journalRef,
    orderReference: orderRecord.orderReference || orderRecord.quotationReference,
    entryCategory,
    narrativeDescription: narrative,
    journalLines: [
      { accountCode: '1010', accountName: 'Cash / Bank Current Account', debitAmountInr: amount, creditAmountInr: 0 },
      { accountCode: '1200', accountName: 'Accounts Receivable - Solar Projects', debitAmountInr: 0, creditAmountInr: amount }
    ],
    updatedBy: recordingUserId || null
  });
};

const normalizePaymentAmount = (rawAmount) => {
  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw buildHttpError(400, 'Invalid input: Please enter a valid positive number.');
  }
  return Math.round(amount * 100) / 100;
};

export const processAdvancePaymentForOrder = async (orderId, paymentAmountInr, paymentMode = 'UPI', transactionReference, recordingUserId) => {
  const orderRecord = await OrderModel.findById(orderId);
  if (!orderRecord) throw buildHttpError(404, 'Order not found');

  const amount = normalizePaymentAmount(paymentAmountInr);

  if (orderRecord.orderWorkflowStatus !== 'Draft' || orderRecord.advancePaymentAmountInr > 0) {
    throw buildHttpError(
      409,
      'An advance payment has already been recorded for this order. Use "Record Leftover Payment" to collect the remaining balance.'
    );
  }

  const minimumRequiredAdvance = Math.ceil(orderRecord.netPayableAmountInr * ERP_SYSTEM_CONFIG.MINIMUM_ADVANCE_PERCENTAGE);
  if (amount < minimumRequiredAdvance) {
    throw buildHttpError(
      400,
      `Advance payment must be at least 20% of the total quote amount (Minimum: ${formatInr(minimumRequiredAdvance)}).`
    );
  }
  if (amount > orderRecord.netPayableAmountInr) {
    throw buildHttpError(400, `Advance payment cannot be more than the total quote amount (${formatInr(orderRecord.netPayableAmountInr)}).`);
  }

  const resolvedMode = paymentMode || 'UPI';
  const resolvedReference = transactionReference || `${resolvedMode}-ADV-${Date.now().toString().slice(-6)}`;

  if (!orderRecord.orderReference) {
    orderRecord.orderReference = await getNextSequenceNumber(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.ORDER);
  }

  orderRecord.advancePaymentAmountInr = amount;
  orderRecord.balancePaymentDueInr = Math.max(0, Math.round((orderRecord.netPayableAmountInr - amount) * 100) / 100);
  // Leftover Pay stage: remaining balance is tracked explicitly until fully settled
  orderRecord.orderWorkflowStatus = orderRecord.balancePaymentDueInr > 0 ? 'BALANCE_DUE' : 'Advance_Paid';
  orderRecord.updatedBy = recordingUserId;
  await appendPaymentRecord(orderRecord, {
    paymentKind: 'ADVANCE',
    amount,
    paymentMode: resolvedMode,
    transactionReference: resolvedReference,
    recordingUserId
  });
  await orderRecord.save();

  await postPaymentJournalEntry({
    orderRecord,
    amount,
    entryCategory: 'ADVANCE_PAYMENT',
    narrative: `Advance payment of ${formatInr(amount)} collected via ${resolvedMode} (Ref: ${resolvedReference}) for ${orderRecord.customerFullName}`,
    recordingUserId
  });

  // Stage 2 Progressive Onboarding: Automatically Provision Customer Portal Account & Dispatch Simulated Email
  let customerActivationResult = null;
  try {
    customerActivationResult = await activateCustomerForProjectOrder(orderRecord._id, recordingUserId);
  } catch (onboardingErr) {
    console.warn('[ONBOARDING] Stage 2 auto-activation warning:', onboardingErr.message);
  }

  const refreshedOrder = await OrderModel.findById(orderRecord._id).populate(ORDER_POPULATE_PATHS);
  emitErpEvent('ORDER_CONFIRMED', {
    order: refreshedOrder,
    customerActivation: customerActivationResult
  });
  return refreshedOrder;
};


/**
 * Stage 2 Progressive Customer Account Activation & Simulated Email Dispatch
 */
export const activateCustomerForProjectOrder = async (orderId, activatingUserId) => {
  const orderRecord = await OrderModel.findById(orderId);
  if (!orderRecord) throw new Error('Order not found');

  const { customerUser, temporaryPassword, magicLoginToken, isNewUser } =
    await provisionCustomerUserAccount({
      fullName: orderRecord.customerFullName,
      email: orderRecord.customerEmailAddress,
      phoneNumber: orderRecord.customerPhoneNumber
    });

  orderRecord.customerUserId = customerUser._id;
  orderRecord.onboardingStage = 'STAGE_2_ACTIVATED';
  orderRecord.stage2EmailDispatchedAt = new Date();
  if (activatingUserId) orderRecord.updatedBy = activatingUserId;
  await orderRecord.save();

  // Also advance corresponding lead if applicable
  if (orderRecord.leadInquiryId) {
    await LeadModel.findByIdAndUpdate(orderRecord.leadInquiryId, {
      onboardingStage: 'STAGE_2_ACTIVATED',
      stage2EmailDispatchedAt: new Date()
    });
  }

  const clientOrigin = ERP_SYSTEM_CONFIG.CLIENT_ORIGIN || 'http://localhost:5173';
  const portalUrl = `${clientOrigin}/login`;
  const magicLoginUrl = `${clientOrigin}/login?magicToken=${magicLoginToken}`;

  const template = renderStage2ActivationEmailTemplate({
    order: orderRecord,
    lead: null,
    customerUser,
    temporaryPassword,
    portalUrl,
    magicLoginUrl
  });

  const simulatedEmail = await dispatchSimulatedEmail({
    to: orderRecord.customerEmailAddress,
    recipientName: orderRecord.customerFullName,
    subject: `🎉 Project Confirmed: Welcome to SolIMS Family [Ref: ${orderRecord.orderReference || orderRecord.quotationReference}]`,
    stage: 'STAGE_2_ACTIVATION',
    stageTitle: 'Stage 2: Customer Portal Credentials & Welcome',
    previewText: `Commercial advance confirmed! Your MySolar portal credentials are ready.`,
    htmlContent: template.htmlContent,
    textContent: template.textContent,
    magicLink: magicLoginUrl,
    credentials: {
      email: orderRecord.customerEmailAddress,
      temporaryPassword,
      portalUrl
    },
    relatedEntity: {
      entityType: 'Order',
      entityId: orderRecord._id,
      referenceCode: orderRecord.orderReference || orderRecord.quotationReference
    }
  });

  emitErpEvent('CUSTOMER_ACCOUNT_ACTIVATED', {
    orderId: orderRecord._id,
    customerUser,
    simulatedEmail
  });

  return {
    order: orderRecord,
    customerUser,
    temporaryPassword,
    magicLoginToken,
    simulatedEmail,
    isNewUser
  };
};

export const resendStage2ActivationEmail = async (orderId) => {
  return activateCustomerForProjectOrder(orderId, null);
};

export const fetchMyCustomerProjectOrder = async (user) => {
  const orders = await OrderModel.find(buildOrderScopeFilter(user))
    .populate(ORDER_POPULATE_PATHS)
    .populate('customerUserId', 'fullName email phoneNumber')
    .sort({ createdAt: -1 });
  return pickPrimaryOrder(orders);
};

export const pickPrimaryOrder = (orders = []) => {
  if (orders.length === 0) return null;
  return [...orders].sort((a, b) => {
    const rankDiff = (ORDER_PROGRESS_RANK[b.orderWorkflowStatus] ?? 0) - (ORDER_PROGRESS_RANK[a.orderWorkflowStatus] ?? 0);
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  })[0];
};

/**
 * Customer Portal bundle: everything returned here is scoped to the authenticated CUSTOMER only
 * (matched by user id, email or phone) - never to a seeded demo customer.
 */
export const fetchCustomerPortalBundle = async (user) => {
  const orders = await OrderModel.find(buildOrderScopeFilter(user))
    .populate(ORDER_POPULATE_PATHS)
    .sort({ createdAt: -1 })
    .lean();

  const primaryOrder = pickPrimaryOrder(orders);
  const orderReferences = orders.map((o) => o.orderReference).filter(Boolean);

  const leads = await LeadModel.find(buildLeadScopeFilter(user))
    .select('-onboardingAccessToken')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const siteLog = primaryOrder
    ? await SiteLogModel.findOne({ orderId: primaryOrder._id })
        .sort({ createdAt: -1 })
        .populate('leadTechnicianUser', 'fullName assignedSpecialization')
        .lean()
    : null;

  const phoneRegex = buildCustomerPhoneRegex(user);
  const assetClauses = [{ assignedCustomerId: user._id }];
  if (orderReferences.length > 0) assetClauses.push({ orderReference: { $in: orderReferences } });
  if (phoneRegex) assetClauses.push({ customerPhoneNumber: phoneRegex });

  const rawAssets = await SerialAssetModel.find({
    $or: assetClauses,
    warrantyExpiresTimestamp: { $ne: null }
  })
    .sort({ dispatchConfirmedTimestamp: -1 })
    .lean();

  const now = Date.now();
  const assets = rawAssets.map((asset) => {
    const startedAt = asset.dispatchConfirmedTimestamp ? new Date(asset.dispatchConfirmedTimestamp).getTime() : now;
    const expiresAt = new Date(asset.warrantyExpiresTimestamp).getTime();
    return {
      ...asset,
      elapsedDays: Math.max(0, Math.floor((now - startedAt) / 86400000)),
      remainingWarrantyDays: Math.max(0, Math.ceil((expiresAt - now) / 86400000)),
      isUnderActiveWarranty: expiresAt > now
    };
  });

  const serials = assets.map((a) => a.serialNumber);
  const ticketClauses = [];
  if (phoneRegex) ticketClauses.push({ customerPhoneNumber: phoneRegex });
  if (serials.length > 0) ticketClauses.push({ targetSerialNumber: { $in: serials } });
  const tickets = ticketClauses.length > 0
    ? await TicketModel.find({ $or: ticketClauses }).sort({ createdAt: -1 }).lean()
    : [];

  const invoices = [];
  for (const order of orders) {
    const history = order.paymentHistory || [];
    if (history.length === 0 && order.advancePaymentAmountInr > 0) {
      invoices.push({
        invoiceReference: `INV/${(order.orderReference || order.quotationReference || '').replace(/\//g, '-')}`,
        orderReference: order.orderReference || order.quotationReference,
        paymentKind: 'ADVANCE',
        amountInr: order.advancePaymentAmountInr,
        paymentMode: 'UPI',
        recordedAt: order.updatedAt
      });
    }
    history.forEach((entry) => {
      invoices.push({ ...entry, orderReference: order.orderReference || order.quotationReference });
    });
  }
  invoices.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));

  return {
    profile: { fullName: user.fullName, email: user.email, phoneNumber: user.phoneNumber },
    leads,
    orders,
    order: primaryOrder,
    siteLog,
    assets,
    tickets,
    invoices
  };
};

const CREW_ROLE_FIELDS = [
  { field: 'inverterTechnician', label: 'Inverter Specialist' },
  { field: 'rooftopTechnician', label: 'Rooftop Mounting Technician' },
  { field: 'wiringTechnician', label: 'High-Voltage Wiring Technician' }
];

const toCalendarDayKey = (dateValue) => (dateValue ? new Date(dateValue).toISOString().slice(0, 10) : '');
const formatCalendarDay = (dateValue) =>
  dateValue
    ? new Date(dateValue).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : 'Not scheduled';

export const assignCrewToProjectOrder = async (orderId, crewSelection, scheduledInstallationDate, assigningUserId) => {
  const orderRecord = await OrderModel.findById(orderId);
  if (!orderRecord) throw buildHttpError(404, 'Order not found');

  if (orderRecord.orderWorkflowStatus === 'Draft') {
    throw buildHttpError(409, 'Please record the advance payment before assigning the installation crew.');
  }
  if (orderRecord.orderWorkflowStatus === 'Cancelled') {
    throw buildHttpError(409, 'This order has been cancelled, so the crew cannot be changed.');
  }

  // Validate the scheduled date (date-only strings are anchored at noon UTC so they never shift a calendar day)
  const rawDate = String(scheduledInstallationDate || '').trim();
  const newScheduledDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? new Date(`${rawDate}T12:00:00.000Z`) : new Date(rawDate);
  if (Number.isNaN(newScheduledDate.getTime())) {
    throw buildHttpError(400, 'Please enter a valid installation date.');
  }
  const dateChanged = toCalendarDayKey(newScheduledDate) !== toCalendarDayKey(orderRecord.scheduledInstallationDate);
  if (dateChanged && toCalendarDayKey(newScheduledDate) < new Date().toISOString().slice(0, 10)) {
    throw buildHttpError(400, 'Installation date cannot be in the past. Please choose today or a future date.');
  }

  // Validate every selected technician is an active STAFF member
  const selectedIds = CREW_ROLE_FIELDS.map(({ field }) => String(crewSelection[field]));
  const previousIds = CREW_ROLE_FIELDS.map(({ field }) => (orderRecord[field] ? String(orderRecord[field]) : null)).filter(Boolean);
  const involvedUsers = await UserModel.find({ _id: { $in: [...new Set([...selectedIds, ...previousIds])] } }).select('fullName role isActive');
  const userLookup = new Map(involvedUsers.map((u) => [String(u._id), u]));

  for (const { field, label } of CREW_ROLE_FIELDS) {
    const picked = userLookup.get(String(crewSelection[field]));
    if (!picked || picked.role !== ERP_SYSTEM_CONFIG.RBAC_ROLES.STAFF || !picked.isActive) {
      throw buildHttpError(400, `The selected ${label} is not an available technician. Please choose someone from the list.`);
    }
  }

  const changes = [];
  for (const { field, label } of CREW_ROLE_FIELDS) {
    const oldId = orderRecord[field] ? String(orderRecord[field]) : '';
    const newId = String(crewSelection[field]);
    if (oldId !== newId) {
      changes.push({
        field,
        label,
        oldValue: oldId ? (userLookup.get(oldId)?.fullName || 'Unknown technician') : 'Not assigned',
        newValue: userLookup.get(newId).fullName
      });
    }
  }
  if (dateChanged) {
    changes.push({
      field: 'scheduledInstallationDate',
      label: 'Scheduled Installation Date',
      oldValue: formatCalendarDay(orderRecord.scheduledInstallationDate),
      newValue: formatCalendarDay(newScheduledDate)
    });
  }

  if (changes.length === 0) {
    throw buildHttpError(409, 'No changes detected: the crew and installation date are already set exactly like this.');
  }

  const isFirstAssignment = (orderRecord.crewModificationLog || []).length === 0;
  orderRecord.crewModificationLog.push({
    action: isFirstAssignment ? 'ASSIGNED' : 'MODIFIED',
    changedAt: new Date(),
    changedBy: assigningUserId || null,
    changedByName: await resolveActorName(assigningUserId),
    changes
  });

  CREW_ROLE_FIELDS.forEach(({ field }) => {
    orderRecord[field] = crewSelection[field];
  });
  orderRecord.assignedTechnicians = [...new Set(selectedIds)];
  orderRecord.scheduledInstallationDate = newScheduledDate;
  orderRecord.updatedBy = assigningUserId;
  await orderRecord.save();

  await orderRecord.populate(ORDER_POPULATE_PATHS);
  emitErpEvent('CREW_ASSIGNED', { order: orderRecord });
  return orderRecord;
};

export const processPaymentForOrder = async (
  orderId,
  paymentAmountInr,
  paymentMode = 'UPI',
  transactionReference = '',
  recordingUserId = null
) => {
  const orderRecord = await OrderModel.findById(orderId);
  if (!orderRecord) throw buildHttpError(404, 'Order not found');

  const amount = normalizePaymentAmount(paymentAmountInr);

  // An unpaid quote can only be activated through the advance path, which enforces the 20% minimum
  if (orderRecord.orderWorkflowStatus === 'Draft') {
    return processAdvancePaymentForOrder(orderId, amount, paymentMode, transactionReference, recordingUserId);
  }

  if (orderRecord.balancePaymentDueInr <= 0) {
    throw buildHttpError(409, 'This order is already fully paid. There is no balance left to collect.');
  }
  if (amount > orderRecord.balancePaymentDueInr) {
    throw buildHttpError(400, `The payment is more than the balance due. The remaining balance is ${formatInr(orderRecord.balancePaymentDueInr)}.`);
  }

  const resolvedMode = paymentMode || 'UPI';
  const resolvedReference = transactionReference || `${resolvedMode}-BAL-${Date.now().toString().slice(-6)}`;

  orderRecord.advancePaymentAmountInr = Math.round((orderRecord.advancePaymentAmountInr + amount) * 100) / 100;
  orderRecord.balancePaymentDueInr = Math.max(0, Math.round((orderRecord.netPayableAmountInr - orderRecord.advancePaymentAmountInr) * 100) / 100);
  if (orderRecord.balancePaymentDueInr === 0 && orderRecord.orderWorkflowStatus === 'BALANCE_DUE') {
    orderRecord.orderWorkflowStatus = 'Advance_Paid';
  }
  if (recordingUserId) orderRecord.updatedBy = recordingUserId;

  await appendPaymentRecord(orderRecord, {
    paymentKind: 'BALANCE',
    amount,
    paymentMode: resolvedMode,
    transactionReference: resolvedReference,
    recordingUserId
  });
  await orderRecord.save();

  await postPaymentJournalEntry({
    orderRecord,
    amount,
    entryCategory: 'CUSTOMER_PAYMENT',
    narrative: `Leftover payment of ${formatInr(amount)} via ${resolvedMode} (Ref: ${resolvedReference}) for ${orderRecord.customerFullName}`,
    recordingUserId
  });

  await orderRecord.populate(ORDER_POPULATE_PATHS);
  emitErpEvent('PAYMENT_RECEIVED', {
    order: orderRecord,
    paymentAmountInr: amount,
    paymentMode: resolvedMode,
    transactionReference: resolvedReference
  });

  return orderRecord;
};

export const fetchAllTechnicians = async () => {
  return UserModel.find({ role: ERP_SYSTEM_CONFIG.RBAC_ROLES.STAFF, isActive: true })
    .select('_id fullName email phoneNumber assignedSpecialization role')
    .sort({ fullName: 1 });
};

export const fetchAllProjectOrders = async (filterQuery = {}) => {
  return OrderModel.find(filterQuery)
    .populate(ORDER_POPULATE_PATHS)
    .sort({ createdAt: -1 });
};

export const fetchProjectOrderById = async (orderId) => {
  return OrderModel.findById(orderId).populate(ORDER_POPULATE_PATHS);
};
