/**
 * @AUTHOR: Garima Mittal
 * @FILE: lead.service.js
 * @RESPONSIBILITY: Manages rooftop solar inquiry intake, survey scheduling, technical measurements, and approval workflow.
 * @DEPENDENCIES: lead.model.js, sequenceRegistry.js, socketEmitter.js, erpConfig.js
 */

import { LeadModel } from './lead.model.js';
import { getNextSequenceNumber } from '../../core/sequenceRegistry.js';
import { emitErpEvent } from '../../core/socketEmitter.js';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';

export const createLeadInquiryRecord = async (inquiryInputDetails, creatorUserId) => {
  const generatedInquiryReference = await getNextSequenceNumber(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.INQUIRY);

  const newLeadRecord = await LeadModel.create({
    ...inquiryInputDetails,
    inquiryReference: generatedInquiryReference,
    inquiryWorkflowStatus: 'Draft',
    updatedBy: creatorUserId
  });

  emitErpEvent('LEAD_INQUIRY_CREATED', { lead: newLeadRecord });
  return newLeadRecord;
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

  if (targetLeadRecord.inquiryWorkflowStatus !== 'Survey_Completed') {
    throw new Error('Approval denied: Roof survey measurements must be completed first');
  }

  targetLeadRecord.inquiryWorkflowStatus = isApproved ? 'Approved' : 'Rejected';
  targetLeadRecord.rejectionReason = isApproved ? '' : (rejectionReason || 'Site conditions unsuitable');
  targetLeadRecord.updatedBy = approvingUserId;
  await targetLeadRecord.save();

  emitErpEvent('SURVEY_APPROVAL_DECIDED', { lead: targetLeadRecord });
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
