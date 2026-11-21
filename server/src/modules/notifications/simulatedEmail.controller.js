/**
 * @AUTHOR: Garima Mittal
 * @FILE: simulatedEmail.controller.js
 * @RESPONSIBILITY: Express controllers handling HTTP requests for simulated email outbox inspection, single email view, and demo triggers.
 * @DEPENDENCIES: simulatedEmail.service.js
 */

import {
  fetchAllSimulatedEmails,
  fetchSimulatedEmailById,
  markSimulatedEmailAsRead,
  clearAllSimulatedEmails,
  dispatchSimulatedEmail,
  generateSampleDemoSimulatedEmails,
  renderStage1InquiryEmailTemplate,
  renderStage2ActivationEmailTemplate
} from './simulatedEmail.service.js';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';

export const handleGetAllSimulatedEmails = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { stage, limit } = httpRequest.query;
    const emails = await fetchAllSimulatedEmails({
      stage,
      limit: limit ? Number(limit) : 50
    });
    return httpResponse.status(200).json({
      success: true,
      count: emails.length,
      emails
    });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleGetSimulatedEmailById = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { id } = httpRequest.params;
    const email = await fetchSimulatedEmailById(id);
    if (!email) {
      return httpResponse.status(404).json({ success: false, message: 'Simulated email record not found' });
    }
    return httpResponse.status(200).json({ success: true, email });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleMarkSimulatedEmailRead = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { id } = httpRequest.params;
    const updated = await markSimulatedEmailAsRead(id);
    return httpResponse.status(200).json({ success: true, email: updated });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleClearAllSimulatedEmails = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    await clearAllSimulatedEmails();
    return httpResponse.status(200).json({
      success: true,
      message: 'Simulated email outbox cleared successfully'
    });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleTriggerTestEmail = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { stage = 'STAGE_1_INQUIRY', recipientEmail = 'homeowner@example.com', recipientName = 'Priya Sharma' } = httpRequest.body || {};
    const clientOrigin = ERP_SYSTEM_CONFIG.CLIENT_ORIGIN || 'http://localhost:5173';

    let dispatched;
    if (stage === 'STAGE_2_ACTIVATION') {
      const dummyOrder = {
        orderReference: 'ORD/2026/0099',
        quotationReference: 'QT/2026/0099',
        customerFullName: recipientName,
        customerEmailAddress: recipientEmail,
        installationSiteAddress: 'Plot 12, Green Enclave, Gurgaon, HR',
        systemCapacityKw: 5,
        systemVariant: 'OFF_GRID',
        advancePaymentAmountInr: 75000,
        balancePaymentDueInr: 210000
      };
      const template = renderStage2ActivationEmailTemplate({
        order: dummyOrder,
        lead: {},
        customerUser: { fullName: recipientName, email: recipientEmail },
        temporaryPassword: 'SolarClient#2026',
        portalUrl: `${clientOrigin}/login`,
        magicLoginUrl: `${clientOrigin}/login?email=${encodeURIComponent(recipientEmail)}`
      });
      dispatched = await dispatchSimulatedEmail({
        to: recipientEmail,
        recipientName,
        subject: `🎉 Project Confirmed: Welcome to SolIMS Family [Ref: ${dummyOrder.orderReference}]`,
        stage: 'STAGE_2_ACTIVATION',
        stageTitle: 'Stage 2: Customer Portal Credentials & Welcome',
        previewText: 'Advance payment confirmed! Your MySolar portal credentials are ready.',
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        magicLink: `${clientOrigin}/login?email=${encodeURIComponent(recipientEmail)}`,
        credentials: {
          email: recipientEmail,
          temporaryPassword: 'SolarClient#2026',
          portalUrl: `${clientOrigin}/login`
        },
        relatedEntity: { entityType: 'Order', referenceCode: dummyOrder.orderReference }
      });
    } else {
      const dummyLead = {
        inquiryReference: 'INQ/2026/0099',
        customerFullName: recipientName,
        customerEmailAddress: recipientEmail,
        installationSiteAddress: 'Plot 12, Green Enclave, Gurgaon, HR',
        requestedCapacityKw: 5,
        requestedVariant: 'OFF_GRID',
        isSubsidyEligible: true,
        averageMonthlyElectricityBillInr: 7500,
        approximateRoofAreaSqFt: 600
      };
      const template = renderStage1InquiryEmailTemplate({
        lead: dummyLead,
        trackingUrl: `${clientOrigin}/?track=${dummyLead.inquiryReference}#track`
      });
      dispatched = await dispatchSimulatedEmail({
        to: recipientEmail,
        recipientName,
        subject: `☀️ SolIMS Rooftop Solar Assessment Initiated [Ref: ${dummyLead.inquiryReference}]`,
        stage: 'STAGE_1_INQUIRY',
        stageTitle: 'Stage 1: Solar Assessment & Tracking Access',
        previewText: 'Your 5 kW Off-Grid solar inquiry has been received. Track site survey live.',
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        magicLink: `${clientOrigin}/?track=${dummyLead.inquiryReference}#track`,
        relatedEntity: { entityType: 'Lead', referenceCode: dummyLead.inquiryReference }
      });
    }

    return httpResponse.status(201).json({ success: true, email: dispatched });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};
