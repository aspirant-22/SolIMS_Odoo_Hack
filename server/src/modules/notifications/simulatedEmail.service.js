/**
 * @AUTHOR: Garima Mittal
 * @FILE: simulatedEmail.service.js
 * @RESPONSIBILITY: Zero-config offline email dispatch engine generating branded HTML templates, progressive onboarding notifications, in-memory outbox logging, and Socket.IO real-time alerts.
 * @DEPENDENCIES: simulatedEmail.model.js, socketEmitter.js, erpConfig.js
 */

import { SimulatedEmailModel } from './simulatedEmail.model.js';
import { emitErpEvent } from '../../core/socketEmitter.js';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';
import { getNextSequenceNumber } from '../../core/sequenceRegistry.js';

export const generateEmailReference = async () => {
  try {
    return await getNextSequenceNumber(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.EMAIL);
  } catch {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `EML/2026/${randomSuffix}`;
  }
};

/**
 * Stage 1 Progressive Onboarding: Inquiry Intake & Live Project Tracking Access
 */
export const renderStage1InquiryEmailTemplate = ({ lead, trackingUrl }) => {
  const subsidyAmount = lead.isSubsidyEligible
    ? lead.requestedCapacityKw === 1
      ? 30000
      : lead.requestedCapacityKw === 2
      ? 60000
      : 78000
    : 0;

  const estimatedSavings = Math.round((lead.averageMonthlyElectricityBillInr || 4500) * 0.85);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SolIMS Rooftop Solar Assessment</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0F291E 0%, #135D3B 60%, #0E462C 100%); padding: 28px 32px; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">SolIMS</div>
                    <div style="font-size: 11px; color: #A7F3D0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">
                      Solar Installation Management System
                    </div>
                  </td>
                  <td align="right">
                    <span style="background-color: rgba(255, 255, 255, 0.15); color: #FDE047; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; border: 1px solid rgba(253, 224, 71, 0.3);">
                      Stage 1 • Assessment Initiated
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="font-size: 20px; font-weight: 800; color: #0F291E; margin: 0 0 12px 0;">
                Rooftop Solar Assessment Initiated! ☀️
              </h1>
              <p style="font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 20px 0;">
                Dear <strong>${lead.customerFullName}</strong>,<br>
                Thank you for choosing SolIMS. We have successfully registered your commercial solar feasibility assessment for <strong>${lead.installationSiteAddress}</strong>.
              </p>

              <!-- Progressive Onboarding Badge -->
              <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #166534; letter-spacing: 0.5px; margin-bottom: 6px;">
                  🚀 Progressive Onboarding: Stage 1 of 2
                </div>
                <div style="font-size: 12px; color: #15803D; line-height: 18px;">
                  <strong>Zero-Friction Access Granted:</strong> No password or account setup is required at this stage. You can track your site survey and engineering quote in real time using your secure tracking token.
                </div>
              </div>

              <!-- Technical Assessment Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #E2E8F0;" width="50%">
                    <div style="font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase;">Inquiry Reference</div>
                    <div style="font-size: 15px; font-weight: 800; color: #135D3B; font-family: monospace; margin-top: 2px;">
                      ${lead.inquiryReference}
                    </div>
                  </td>
                  <td style="padding: 16px; border-bottom: 1px solid #E2E8F0;" width="50%">
                    <div style="font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase;">Recommended System</div>
                    <div style="font-size: 15px; font-weight: 800; color: #0F172A; margin-top: 2px;">
                      ${lead.requestedCapacityKw} kW (${lead.requestedVariant})
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px;" width="50%">
                    <div style="font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase;">Est. Monthly Savings</div>
                    <div style="font-size: 15px; font-weight: 800; color: #059669; margin-top: 2px;">
                      ₹${estimatedSavings.toLocaleString('en-IN')} / mo
                    </div>
                  </td>
                  <td style="padding: 16px;" width="50%">
                    <div style="font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase;">PM Surya Ghar Subsidy</div>
                    <div style="font-size: 15px; font-weight: 800; color: #D97706; margin-top: 2px;">
                      ₹${subsidyAmount.toLocaleString('en-IN')} (Eligible)
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${trackingUrl}" style="display: inline-block; background-color: #135D3B; color: #FFFFFF; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 6px -1px rgba(19, 93, 59, 0.3);">
                      ⚡ Track Your Solar Survey Live ➔
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Next Steps Strip -->
              <div style="border-top: 1px solid #E2E8F0; padding-top: 20px;">
                <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #0F291E; margin-bottom: 10px;">
                  What Happens Next?
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 12px; color: #475569; line-height: 20px;">
                  <tr>
                    <td style="padding-bottom: 8px;"><strong>1. Roof Feasibility Survey:</strong> Our certified technician inspects roof azimuth, tilt angle, and cable run.</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 8px;"><strong>2. Auto-BOM Generation:</strong> Precise Bill of Materials and exact pricing are automatically calculated.</td>
                  </tr>
                  <tr>
                    <td><strong>3. Stage 2 Portal Activation:</strong> Upon advance confirmation, your full MySolar client portal credentials are auto-generated.</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F1F5F9; padding: 20px 32px; text-align: center; border-top: 1px solid #E2E8F0;">
              <div style="font-size: 11px; color: #64748B; font-weight: 500;">
                SolIMS Solutions • Powered by Odoo-Inspired ERP Engine by Garima Mittal
              </div>
              <div style="font-size: 10px; color: #94A3B8; margin-top: 4px;">
                [Simulated Email Dispatch: 100% Offline Hackathon Mode — No External Credentials Required]
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textContent = `
SolIMS Rooftop Solar Assessment Initiated [Ref: ${lead.inquiryReference}]
--------------------------------------------------------------------------------
Dear ${lead.customerFullName},

Thank you for choosing SolIMS. We have registered your rooftop solar assessment for:
${lead.installationSiteAddress}

System Capacity: ${lead.requestedCapacityKw} kW (${lead.requestedVariant})
Estimated Monthly Savings: ₹${estimatedSavings.toLocaleString('en-IN')} / month
Estimated PM Surya Ghar Subsidy: ₹${subsidyAmount.toLocaleString('en-IN')}

Progressive Onboarding: Stage 1 (Prospect)
Track your site survey in real time without creating a password:
${trackingUrl}

Our technical lead will visit for digital roof measurements within 24 hours.
SolIMS ERP • Authored by Garima Mittal
`;

  return { htmlContent, textContent };
};

/**
 * Stage 2 Progressive Onboarding: Customer Account Activated & MySolar Portal Credentials
 */
export const renderStage2ActivationEmailTemplate = ({
  order,
  lead,
  customerUser,
  temporaryPassword,
  portalUrl,
  magicLoginUrl
}) => {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to SolIMS Family — Portal Active</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0F291E 0%, #135D3B 60%, #064E3B 100%); padding: 28px 32px; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">SolIMS</div>
                    <div style="font-size: 11px; color: #A7F3D0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">
                      Solar Installation Management System
                    </div>
                  </td>
                  <td align="right">
                    <span style="background-color: #F59E0B; color: #FFFFFF; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px;">
                      Stage 2 • Portal Activated 🎉
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="font-size: 20px; font-weight: 800; color: #0F291E; margin: 0 0 12px 0;">
                Project Confirmed & MySolar Portal Ready! 🚀
              </h1>
              <p style="font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 20px 0;">
                Dear <strong>${customerUser.fullName || order.customerFullName}</strong>,<br>
                Congratulations! Your commercial advance payment for solar project <strong>${order.orderReference || order.quotationReference}</strong> has been verified. You have now completed <strong>Stage 2 Progressive Onboarding</strong> and your official Homeowner Portal is active.
              </p>

              <!-- Credentials Box -->
              <div style="background-color: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #1E293B; letter-spacing: 0.5px; margin-bottom: 12px;">
                  🔑 Your MySolar Portal Access Credentials
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
                  <tr>
                    <td style="padding-bottom: 8px; color: #64748B;" width="35%">Portal URL:</td>
                    <td style="padding-bottom: 8px; font-weight: 700; color: #135D3B;">
                      <a href="${portalUrl}" style="color: #135D3B; text-decoration: none;">${portalUrl}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 8px; color: #64748B;">Username / Email:</td>
                    <td style="padding-bottom: 8px; font-family: monospace; font-weight: 700; color: #0F172A;">
                      ${customerUser.email}
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #64748B;">Temporary Password:</td>
                    <td style="font-family: monospace; font-weight: 800; color: #B45309; background-color: #FEF3C7; padding: 2px 8px; border-radius: 4px; display: inline-block;">
                      ${temporaryPassword}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Action Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${magicLoginUrl}" style="display: inline-block; background-color: #135D3B; color: #FFFFFF; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 6px -1px rgba(19, 93, 59, 0.3);">
                      🚀 1-Click Instant Login to MySolar Portal ➔
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Order & Financial Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px; border-bottom: 1px solid #E2E8F0;" width="50%">
                    <div style="font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase;">Confirmed Order</div>
                    <div style="font-size: 14px; font-weight: 800; color: #135D3B; font-family: monospace; margin-top: 2px;">
                      ${order.orderReference || order.quotationReference}
                    </div>
                  </td>
                  <td style="padding: 14px; border-bottom: 1px solid #E2E8F0;" width="50%">
                    <div style="font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase;">System Specifications</div>
                    <div style="font-size: 14px; font-weight: 800; color: #0F172A; margin-top: 2px;">
                      ${order.systemCapacityKw} kW ${order.systemVariant}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px;" width="50%">
                    <div style="font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase;">Advance Received</div>
                    <div style="font-size: 14px; font-weight: 800; color: #059669; margin-top: 2px;">
                      ₹${(order.advancePaymentAmountInr || 0).toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td style="padding: 14px;" width="50%">
                    <div style="font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase;">Remaining Balance</div>
                    <div style="font-size: 14px; font-weight: 800; color: #D97706; margin-top: 2px;">
                      ₹${(order.balancePaymentDueInr || 0).toLocaleString('en-IN')}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Homeowner Portal Features Unlocked -->
              <div style="border-top: 1px solid #E2E8F0; padding-top: 20px;">
                <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #0F291E; margin-bottom: 12px;">
                  What You Can Access Inside MySolar Portal
                </div>
                <div style="display: grid; gap: 8px; font-size: 12px; color: #334155;">
                  <div style="padding-bottom: 6px;">✓ <strong>Live Project Milestones:</strong> Track dispatch, roof mounting, and net-metering commissioning.</div>
                  <div style="padding-bottom: 6px;">✓ <strong>20-Year Digital Warranty Certificate:</strong> Instant serial verification for solar panels & inverter.</div>
                  <div style="padding-bottom: 6px;">✓ <strong>Digital Installation Proof:</strong> View on-site photos and signed roof commissioning certificate.</div>
                  <div>✓ <strong>Monsoon Priority Protection:</strong> File rainy-season breakdown tickets with ₹0 warranty coverage.</div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F1F5F9; padding: 20px 32px; text-align: center; border-top: 1px solid #E2E8F0;">
              <div style="font-size: 11px; color: #64748B; font-weight: 500;">
                SolIMS Solutions • Powered by Odoo-Inspired ERP Engine by Garima Mittal
              </div>
              <div style="font-size: 10px; color: #94A3B8; margin-top: 4px;">
                [Simulated Email Dispatch: 100% Offline Hackathon Mode — No External Credentials Required]
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textContent = `
Welcome to SolIMS Family — Your MySolar Portal is Active! [Ref: ${order.orderReference || order.quotationReference}]
--------------------------------------------------------------------------------
Dear ${customerUser.fullName || order.customerFullName},

Congratulations! Your advance payment has been confirmed for:
${order.systemCapacityKw} kW ${order.systemVariant} at ${order.installationSiteAddress}

Stage 2 Progressive Onboarding Complete!
Your Homeowner MySolar Portal is now active.

Login Credentials:
Portal URL: ${portalUrl}
Username: ${customerUser.email}
Password: ${temporaryPassword}

1-Click Instant Login Link:
${magicLoginUrl}

Features Unlocked:
- Live installation milestone tracking
- 2-Year Inverter & 20-Year Solar Panel Warranty Certificates
- Digital roof sign-off proof
- Monsoon priority repair tickets (₹0 parts & labor)

SolIMS ERP • Authored by Garima Mittal
`;

  return { htmlContent, textContent };
};

/**
 * Core Zero-Config Simulated Email Dispatcher
 */
export const dispatchSimulatedEmail = async ({
  to,
  recipientName,
  subject,
  stage = 'STAGE_1_INQUIRY',
  stageTitle,
  previewText = '',
  htmlContent,
  textContent,
  magicLink = '',
  credentials = {},
  relatedEntity = { entityType: 'None', entityId: null, referenceCode: '' }
}) => {
  const emailRef = await generateEmailReference();

  const resolvedStageTitle =
    stageTitle ||
    (stage === 'STAGE_1_INQUIRY'
      ? 'Stage 1: Solar Assessment & Tracking Access'
      : stage === 'STAGE_2_ACTIVATION'
      ? 'Stage 2: Customer Portal Credentials & Welcome'
      : 'System Notification');

  const createdEmail = await SimulatedEmailModel.create({
    emailReference: emailRef,
    to: to.toLowerCase().trim(),
    recipientName: recipientName.trim(),
    subject,
    stage,
    stageTitle: resolvedStageTitle,
    previewText: previewText || subject,
    htmlContent,
    textContent,
    magicLink,
    credentials,
    relatedEntity,
    status: 'DELIVERED_SIMULATED'
  });

  // ASCII Console Banner for Hackathon Demo / Inspection
  console.log(`
╔════════════════════════════════════════════════════════════════════════════════╗
║ 📨 [ZERO-CONFIG SIMULATED EMAIL DISPATCH]                                      ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ Reference: ${emailRef.padEnd(67)} ║
║ Stage:     ${resolvedStageTitle.padEnd(67)} ║
║ Recipient: ${(recipientName + ' <' + to + '>').padEnd(67)} ║
║ Subject:   ${subject.padEnd(67)} ║
║ Magic URL: ${(magicLink || 'N/A').padEnd(67)} ║
╚════════════════════════════════════════════════════════════════════════════════╝
`);

  // Real-time broadcast to all connected web clients via Socket.IO
  emitErpEvent('SIMULATED_EMAIL_DISPATCHED', { email: createdEmail });

  return createdEmail;
};

/**
 * Fetch all simulated emails with sorting
 */
export const fetchAllSimulatedEmails = async ({ stage, limit = 50 } = {}) => {
  const query = {};
  if (stage) query.stage = stage;
  return SimulatedEmailModel.find(query).sort({ createdAt: -1 }).limit(limit);
};

/**
 * Fetch a single simulated email by ID
 */
export const fetchSimulatedEmailById = async (emailId) => {
  return SimulatedEmailModel.findById(emailId);
};

/**
 * Mark a simulated email as read
 */
export const markSimulatedEmailAsRead = async (emailId) => {
  return SimulatedEmailModel.findByIdAndUpdate(
    emailId,
    { status: 'READ', readAt: new Date() },
    { new: true }
  );
};

/**
 * Clear simulation inbox (for test resetting)
 */
export const clearAllSimulatedEmails = async () => {
  return SimulatedEmailModel.deleteMany({});
};

/**
 * Generate initial sample demo simulated emails for immediate hackathon judge preview
 */
export const generateSampleDemoSimulatedEmails = async () => {
  const count = await SimulatedEmailModel.countDocuments();
  if (count > 0) return;

  const clientOrigin = ERP_SYSTEM_CONFIG.CLIENT_ORIGIN || 'http://localhost:5173';

  // Sample Stage 1 Email
  const sampleLead = {
    customerFullName: 'Sunil Agrawal',
    customerEmailAddress: 'customer@solims.com',
    inquiryReference: 'INQ/2026/0001',
    installationSiteAddress: 'B-42, Sector 14, Noida, UP',
    requestedCapacityKw: 3,
    requestedVariant: 'ON_GRID',
    isSubsidyEligible: true,
    averageMonthlyElectricityBillInr: 4500,
    approximateRoofAreaSqFt: 350
  };

  const stage1Template = renderStage1InquiryEmailTemplate({
    lead: sampleLead,
    trackingUrl: `${clientOrigin}/?track=INQ/2026/0001#track`
  });

  await dispatchSimulatedEmail({
    to: sampleLead.customerEmailAddress,
    recipientName: sampleLead.customerFullName,
    subject: `☀️ SolIMS Rooftop Solar Assessment Initiated [Ref: ${sampleLead.inquiryReference}]`,
    stage: 'STAGE_1_INQUIRY',
    stageTitle: 'Stage 1: Solar Assessment & Tracking Access',
    previewText: 'Your 3 kW On-Grid solar inquiry has been received. Track site survey live.',
    htmlContent: stage1Template.htmlContent,
    textContent: stage1Template.textContent,
    magicLink: `${clientOrigin}/?track=INQ/2026/0001#track`,
    relatedEntity: { entityType: 'Lead', referenceCode: sampleLead.inquiryReference }
  });

  // Sample Stage 2 Email
  const sampleOrder = {
    orderReference: 'ORD/2026/0001',
    quotationReference: 'QT/2026/0001',
    customerFullName: 'Sunil Agrawal',
    customerEmailAddress: 'customer@solims.com',
    installationSiteAddress: 'B-42, Sector 14, Noida, UP',
    systemCapacityKw: 3,
    systemVariant: 'ON_GRID',
    advancePaymentAmountInr: 50000,
    balancePaymentDueInr: 106000
  };

  const sampleCustomerUser = {
    fullName: 'Sunil Agrawal',
    email: 'customer@solims.com'
  };

  const stage2Template = renderStage2ActivationEmailTemplate({
    order: sampleOrder,
    lead: sampleLead,
    customerUser: sampleCustomerUser,
    temporaryPassword: 'customer123',
    portalUrl: `${clientOrigin}/login`,
    magicLoginUrl: `${clientOrigin}/login?email=customer@solims.com`
  });

  await dispatchSimulatedEmail({
    to: sampleOrder.customerEmailAddress,
    recipientName: sampleOrder.customerFullName,
    subject: `🎉 Project Confirmed: Welcome to SolIMS Family [Ref: ${sampleOrder.orderReference}]`,
    stage: 'STAGE_2_ACTIVATION',
    stageTitle: 'Stage 2: Customer Portal Credentials & Welcome',
    previewText: 'Advance payment confirmed! Your MySolar portal credentials are ready.',
    htmlContent: stage2Template.htmlContent,
    textContent: stage2Template.textContent,
    magicLink: `${clientOrigin}/login?email=customer@solims.com`,
    credentials: {
      email: 'customer@solims.com',
      temporaryPassword: 'customer123',
      portalUrl: `${clientOrigin}/login`
    },
    relatedEntity: { entityType: 'Order', referenceCode: sampleOrder.orderReference }
  });

  console.log('[SEED] Populated initial demo simulated emails for immediate hackathon inspection');
};
