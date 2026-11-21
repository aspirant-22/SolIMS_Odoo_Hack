/**
 * @AUTHOR: Garima Mittal
 * @FILE: lead.controller.js
 * @RESPONSIBILITY: Express controllers handling HTTP requests for lead creation, survey bookings, and approvals.
 * @DEPENDENCIES: lead.service.js
 */

import {
  createLeadInquiryRecord,
  scheduleSiteSurveyVisit,
  recordSurveyMeasurements,
  executeSurveyApprovalDecision,
  fetchAllLeadInquiries,
  fetchLeadInquiryById,
  fetchLeadQuoteSummary,
  resendStage1InquiryEmail
} from './lead.service.js';
import { isCustomerUser, buildLeadScopeFilter, leadBelongsToCustomer } from '../../core/customerScope.js';

export const handleCreateInquiry = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const creatorUserId = httpRequest.authenticatedUser?._id || null;
    const result = await createLeadInquiryRecord(httpRequest.validatedBody, creatorUserId);
    const lead = result.lead || result;
    const simulatedEmail = result.simulatedEmail || null;
    return httpResponse.status(201).json({ success: true, lead, simulatedEmail });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleResendStage1Email = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { id } = httpRequest.params;
    const result = await resendStage1InquiryEmail(id);
    return httpResponse.status(200).json({ success: true, lead: result.lead, simulatedEmail: result.simulatedEmail });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleScheduleSurvey = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { id } = httpRequest.params;
    const { technicianUserId } = httpRequest.validatedBody;
    const updatedLead = await scheduleSiteSurveyVisit(id, technicianUserId, httpRequest.authenticatedUser._id);
    return httpResponse.status(200).json({ success: true, lead: updatedLead });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleRecordSurveyResults = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { id } = httpRequest.params;
    const updatedLead = await recordSurveyMeasurements(id, httpRequest.validatedBody, httpRequest.authenticatedUser._id);
    return httpResponse.status(200).json({ success: true, lead: updatedLead });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleApproveSurvey = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { id } = httpRequest.params;
    const { isApproved, rejectionReason } = httpRequest.validatedBody;
    const updatedLead = await executeSurveyApprovalDecision(id, isApproved, rejectionReason, httpRequest.authenticatedUser._id);
    return httpResponse.status(200).json({ success: true, lead: updatedLead });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleGetAllInquiries = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    // A logged-in CUSTOMER only ever sees their own inquiries (matched by email / phone)
    const scopeFilter = isCustomerUser(httpRequest.authenticatedUser)
      ? buildLeadScopeFilter(httpRequest.authenticatedUser)
      : {};
    const leadsList = await fetchAllLeadInquiries(scopeFilter);
    return httpResponse.status(200).json({ success: true, count: leadsList.length, leads: leadsList });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleGetInquiryById = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { id } = httpRequest.params;
    const foundLead = await fetchLeadInquiryById(id);
    if (!foundLead) return httpResponse.status(404).json({ success: false, message: 'Inquiry not found' });
    if (isCustomerUser(httpRequest.authenticatedUser) && !leadBelongsToCustomer(foundLead, httpRequest.authenticatedUser)) {
      return httpResponse.status(403).json({ success: false, message: 'You can only view your own inquiry.' });
    }
    return httpResponse.status(200).json({ success: true, lead: foundLead });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleGetInquiryQuoteSummary = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const summary = await fetchLeadQuoteSummary(httpRequest.params.id);
    if (!summary) return httpResponse.status(404).json({ success: false, message: 'Inquiry not found' });
    return httpResponse.status(200).json({ success: true, ...summary });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleTrackOrderOrInquiry = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { query } = httpRequest.params;
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) {
      return httpResponse.status(400).json({ success: false, message: 'Tracking reference or phone number is required.' });
    }

    const { LeadModel } = await import('./lead.model.js');
    const { OrderModel } = await import('../orders/order.model.js');

    const leadMatch = await LeadModel.findOne({
      $or: [
        { inquiryReference: cleanQuery },
        { customerPhoneNumber: cleanQuery }
      ]
    }).lean();

    const orderMatch = await OrderModel.findOne({
      $or: [
        { orderReference: cleanQuery },
        { quotationReference: cleanQuery },
        { customerPhoneNumber: cleanQuery }
      ]
    }).lean();

    if (!leadMatch && !orderMatch) {
      return httpResponse.status(404).json({ success: false, message: 'No project order or inquiry found matching this code or phone number.' });
    }

    return httpResponse.status(200).json({
      success: true,
      result: {
        lead: leadMatch ? {
          _id: leadMatch._id,
          inquiryReference: leadMatch.inquiryReference,
          customerFullName: leadMatch.customerFullName,
          customerPhoneNumber: leadMatch.customerPhoneNumber,
          customerEmailAddress: leadMatch.customerEmailAddress,
          installationSiteAddress: leadMatch.installationSiteAddress,
          requestedCapacityKw: leadMatch.requestedCapacityKw,
          requestedVariant: leadMatch.requestedVariant,
          inquiryWorkflowStatus: leadMatch.inquiryWorkflowStatus,
          surveyDetails: leadMatch.surveyDetails,
          onboardingStage: leadMatch.onboardingStage,
          onboardingAccessToken: leadMatch.onboardingAccessToken,
          createdAt: leadMatch.createdAt,
          approximateRoofAreaSqFt: leadMatch.approximateRoofAreaSqFt
        } : null,
        order: orderMatch ? {
          _id: orderMatch._id,
          orderReference: orderMatch.orderReference,
          quotationReference: orderMatch.quotationReference,
          customerFullName: orderMatch.customerFullName,
          customerPhoneNumber: orderMatch.customerPhoneNumber,
          customerEmailAddress: orderMatch.customerEmailAddress,
          installationSiteAddress: orderMatch.installationSiteAddress,
          systemCapacityKw: orderMatch.systemCapacityKw,
          systemVariant: orderMatch.systemVariant,
          orderWorkflowStatus: orderMatch.orderWorkflowStatus,
          netPayableAmountInr: orderMatch.netPayableAmountInr,
          advancePaymentAmountInr: orderMatch.advancePaymentAmountInr,
          balancePaymentDueInr: orderMatch.balancePaymentDueInr,
          assignedTechnicians: orderMatch.assignedTechnicians,
          scheduledInstallationDate: orderMatch.scheduledInstallationDate,
          subsidyApplicationStatus: orderMatch.subsidyApplicationStatus,
          onboardingStage: orderMatch.onboardingStage,
          createdAt: orderMatch.createdAt
        } : null
      }
    });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};
