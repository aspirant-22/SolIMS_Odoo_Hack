/**
 * @AUTHOR: Garima Mittal
 * @FILE: lead.service.js
 * @RESPONSIBILITY: Manages rooftop solar inquiry intake, survey scheduling, technical measurements, and approval workflow.
 * @DEPENDENCIES: lead.model.js, sequenceRegistry.js, socketEmitter.js, erpConfig.js
 */

import crypto from 'crypto';
import { LeadModel } from './lead.model.js';
import { OrderModel } from '../orders/order.model.js';
import { getNextSequenceNumber } from '../../core/sequenceRegistry.js';
import { emitErpEvent } from '../../core/socketEmitter.js';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';
import {
  dispatchSimulatedEmail,
  renderStage1InquiryEmailTemplate
} from '../notifications/simulatedEmail.service.js';

export const createLeadInquiryRecord = async (inquiryInputDetails, creatorUserId) => {
  const generatedInquiryReference = await getNextSequenceNumber(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.INQUIRY);
  const onboardingAccessToken = crypto.randomBytes(16).toString('hex');

  const newLeadRecord = await LeadModel.create({
    ...inquiryInputDetails,
    inquiryReference: generatedInquiryReference,
    inquiryWorkflowStatus: 'Draft',
    onboardingStage: 'STAGE_1_INQUIRY',
    onboardingAccessToken,
    updatedBy: creatorUserId
  });

  // Stage 1 Progressive Onboarding: Zero-Config Simulated Email Dispatch
  let simulatedEmail = null;
  const targetEmail = (newLeadRecord.customerEmailAddress || '').trim();
  if (targetEmail) {
    try {
      const clientOrigin = ERP_SYSTEM_CONFIG.CLIENT_ORIGIN || 'http://localhost:5173';
      const trackingUrl = `${clientOrigin}/?track=${newLeadRecord.inquiryReference}#track`;
      const template = renderStage1InquiryEmailTemplate({
        lead: newLeadRecord,
        trackingUrl
      });

      simulatedEmail = await dispatchSimulatedEmail({
        to: targetEmail,
        recipientName: newLeadRecord.customerFullName,
        subject: `☀️ SolIMS Rooftop Solar Assessment Initiated [Ref: ${newLeadRecord.inquiryReference}]`,
        stage: 'STAGE_1_INQUIRY',
        stageTitle: 'Stage 1: Solar Assessment & Tracking Access',
        previewText: `Solar inquiry ${newLeadRecord.inquiryReference} registered. Track your site survey in real time.`,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        magicLink: trackingUrl,
        relatedEntity: {
          entityType: 'Lead',
          entityId: newLeadRecord._id,
          referenceCode: newLeadRecord.inquiryReference
        }
      });

      newLeadRecord.stage1EmailDispatchedAt = new Date();
      await newLeadRecord.save();
    } catch (emailErr) {
      console.warn('[EMAIL] Simulated email dispatch warning:', emailErr.message);
    }
  }

  emitErpEvent('LEAD_INQUIRY_CREATED', { lead: newLeadRecord, simulatedEmail });
  return { lead: newLeadRecord, simulatedEmail };
};

export const resendStage1InquiryEmail = async (leadInquiryId) => {
  const leadRecord = await LeadModel.findById(leadInquiryId);
  if (!leadRecord) throw new Error('Inquiry not found');

  const targetEmail = (leadRecord.customerEmailAddress || '').trim();
  if (!targetEmail) throw new Error('Customer email address not provided for this inquiry');

  const clientOrigin = ERP_SYSTEM_CONFIG.CLIENT_ORIGIN || 'http://localhost:5173';
  const trackingUrl = `${clientOrigin}/?track=${leadRecord.inquiryReference}#track`;
  const template = renderStage1InquiryEmailTemplate({
    lead: leadRecord,
    trackingUrl
  });

  const simulatedEmail = await dispatchSimulatedEmail({
    to: targetEmail,
    recipientName: leadRecord.customerFullName,
    subject: `☀️ [Resent] SolIMS Rooftop Solar Assessment Initiated [Ref: ${leadRecord.inquiryReference}]`,
    stage: 'STAGE_1_INQUIRY',
    stageTitle: 'Stage 1: Solar Assessment & Tracking Access',
    previewText: `Solar inquiry ${leadRecord.inquiryReference} registered. Track your site survey in real time.`,
    htmlContent: template.htmlContent,
    textContent: template.textContent,
    magicLink: trackingUrl,
    relatedEntity: {
      entityType: 'Lead',
      entityId: leadRecord._id,
      referenceCode: leadRecord.inquiryReference
    }
  });

  leadRecord.stage1EmailDispatchedAt = new Date();
  await leadRecord.save();

  return { lead: leadRecord, simulatedEmail };
};

export const scheduleSiteSurveyVisit = async (leadInquiryId, technicianUserId, schedulingUserId) => {
  const targetLeadRecord = await LeadModel.findById(leadInquiryId);
  if (!targetLeadRecord) {
    throw new Error('Inquiry not found');
  }

  targetLeadRecord.surveyDetails.assignedTechnician = technicianUserId;
  targetLeadRecord.inquiryWorkflowStatus = 'Survey_Scheduled';
  targetLeadRecord.updatedBy = schedulingUserId;
  await targetLeadRecord.save();

  emitErpEvent('SURVEY_SCHEDULED', { lead: targetLeadRecord });
  return targetLeadRecord;
};

export const recordSurveyMeasurements = async (leadInquiryId, measurementDetails, recordingTechnicianId) => {
  const targetLeadRecord = await LeadModel.findById(leadInquiryId);
  if (!targetLeadRecord) {
    throw new Error('Inquiry not found');
  }

  targetLeadRecord.surveyDetails = {
    ...targetLeadRecord.surveyDetails.toObject(),
    ...measurementDetails,
    surveyCompletedAt: new Date()
  };
  targetLeadRecord.inquiryWorkflowStatus = 'Survey_Completed';
  targetLeadRecord.updatedBy = recordingTechnicianId;
  await targetLeadRecord.save();

  emitErpEvent('SURVEY_COMPLETED', { lead: targetLeadRecord });
  return targetLeadRecord;
};

export const executeSurveyApprovalDecision = async (leadInquiryId, isApproved, rejectionReason, approvingUserId) => {
  const targetLeadRecord = await LeadModel.findById(leadInquiryId);
  if (!targetLeadRecord) {
    throw new Error('Inquiry not found');
  }

  if (targetLeadRecord.inquiryWorkflowStatus !== 'Survey_Completed' || !targetLeadRecord.surveyDetails?.surveyCompletedAt) {
    throw new Error('Approval denied: Roof survey measurements must be recorded by a certified technician first');
  }

  targetLeadRecord.inquiryWorkflowStatus = isApproved ? 'Approved' : 'Rejected';
  targetLeadRecord.rejectionReason = isApproved ? '' : (rejectionReason || 'Site conditions unsuitable');
  targetLeadRecord.updatedBy = approvingUserId;
  await targetLeadRecord.save();

  // If approved and customer email exists, dispatch post-survey portal activation email
  let simulatedEmail = null;
  const targetEmail = (targetLeadRecord.customerEmailAddress || '').trim();
  if (isApproved && targetEmail) {
    try {
      const clientOrigin = ERP_SYSTEM_CONFIG.CLIENT_ORIGIN || 'http://localhost:5173';
      const token = targetLeadRecord.onboardingAccessToken || targetLeadRecord._id.toString();
      const activationUrl = `${clientOrigin}/activate-account?token=${token}&ref=${targetLeadRecord.inquiryReference}`;

      const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Roof Survey Approved — SolIMS</title></head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
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
                    <span style="background-color: #10B981; color: #FFFFFF; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px;">
                      Survey Approved ✅
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h1 style="font-size: 20px; font-weight: 800; color: #0F291E; margin: 0 0 12px 0;">
                Roof Feasibility Survey Approved! ☀️
              </h1>
              <p style="font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 20px 0;">
                Dear <strong>${targetLeadRecord.customerFullName}</strong>,<br>
                Great news! Our engineering team has reviewed and officially approved the rooftop technical survey for <strong>${targetLeadRecord.installationSiteAddress}</strong>. Your customized Bill of Materials and commercial quote are now ready.
              </p>
              <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #166534; margin-bottom: 6px;">
                  🚀 Activate Your MySolar Portal
                </div>
                <div style="font-size: 13px; color: #15803D; line-height: 20px;">
                  Click the button below to activate your account and instantly view your official Quotation, system engineering layout, and subsidy breakdown.
                </div>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${activationUrl}" style="display: inline-block; background-color: #135D3B; color: #FFFFFF; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 6px -1px rgba(19, 93, 59, 0.3);">
                      Activate Account & Open My-Solar Portal ➔
                    </a>
                  </td>
                </tr>
              </table>
              <div style="font-size: 12px; color: #64748B; text-align: center;">
                Or copy your direct portal link: <br>
                <a href="${activationUrl}" style="color: #135D3B; word-break: break-all; font-weight: 600;">${activationUrl}</a>
              </div>
            </td>
          </tr>
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
Roof Feasibility Survey Approved! [Ref: ${targetLeadRecord.inquiryReference}]
--------------------------------------------------------------------------------
Dear ${targetLeadRecord.customerFullName},

Our engineering team has reviewed and approved your rooftop survey for:
${targetLeadRecord.installationSiteAddress}

Activate your account and open your My-Solar portal:
${activationUrl}

SolIMS Solutions
`;

      simulatedEmail = await dispatchSimulatedEmail({
        to: targetEmail,
        recipientName: targetLeadRecord.customerFullName,
        subject: `☀️ Roof Survey Approved! Activate Your SolIMS Portal [Ref: ${targetLeadRecord.inquiryReference}]`,
        stage: 'STAGE_2_ACTIVATION',
        stageTitle: 'Stage 2: Post-Survey Customer Portal Activation',
        previewText: `Roof survey approved for ${targetLeadRecord.inquiryReference}. Click to activate your My-Solar portal.`,
        htmlContent,
        textContent,
        magicLink: activationUrl,
        relatedEntity: {
          entityType: 'Lead',
          entityId: targetLeadRecord._id,
          referenceCode: targetLeadRecord.inquiryReference
        }
      });
      targetLeadRecord.stage2EmailDispatchedAt = new Date();
      await targetLeadRecord.save();
    } catch (e) {
      console.warn('[EMAIL] Post-survey activation email warning:', e.message);
    }
  }

  emitErpEvent('SURVEY_APPROVAL_DECIDED', { lead: targetLeadRecord, simulatedEmail });
  return targetLeadRecord;
};

export const fetchAllLeadInquiries = async (filterQuery = {}) => {
  return LeadModel.find(filterQuery)
    .populate('surveyDetails.assignedTechnician', 'fullName email phoneNumber')
    .sort({ createdAt: -1 });
};

export const fetchLeadInquiryById = async (leadInquiryId) => {
  return LeadModel.findById(leadInquiryId)
    .populate('surveyDetails.assignedTechnician', 'fullName email phoneNumber');
};

/**
 * Returns the inquiry together with any BOM / quote that was already generated for it, so that
 * "View / Generate BOM" can re-open the existing summary without re-running the first-time creation guard.
 */
export const fetchLeadQuoteSummary = async (leadInquiryId) => {
  const leadRecord = await LeadModel.findById(leadInquiryId);
  if (!leadRecord) return null;

  const existingQuote = await OrderModel.findOne({ leadInquiryId: leadRecord._id }).sort({ createdAt: -1 });
  return {
    lead: leadRecord,
    quote: existingQuote,
    isQuoteGenerated: Boolean(existingQuote) || leadRecord.inquiryWorkflowStatus === 'Quoted'
  };
};
