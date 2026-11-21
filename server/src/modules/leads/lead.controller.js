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
  fetchLeadInquiryById
} from './lead.service.js';

export const handleCreateInquiry = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const creatorUserId = httpRequest.authenticatedUser?._id || null;
    const createdLead = await createLeadInquiryRecord(httpRequest.validatedBody, creatorUserId);
    return httpResponse.status(201).json({ success: true, lead: createdLead });
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
    const leadsList = await fetchAllLeadInquiries();
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
    return httpResponse.status(200).json({ success: true, lead: foundLead });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};
