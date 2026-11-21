/**
 * @AUTHOR: Garima Mittal
 * @FILE: service.controller.js
 * @RESPONSIBILITY: Express controllers handling HTTP requests for roof signoff, live warranty queries, and tickets.
 * @DEPENDENCIES: service.service.js
 */

import {
  submitTechnicianRoofSignoff,
  lookupAssetWarrantyStatus,
  createBreakdownServiceTicket,
  recordServiceTicketPayment,
  resolveServiceTicketWithConfirmation,
  fetchAllServiceTickets
} from './service.service.js';

export const handleSubmitRoofSignoff = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const siteLog = await submitTechnicianRoofSignoff(httpRequest.validatedBody, httpRequest.authenticatedUser._id);
    return httpResponse.status(201).json({ success: true, siteLog });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleWarrantyLookup = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { query } = httpRequest.query;
    if (!query) return httpResponse.status(400).json({ success: false, message: 'Search query parameter required' });
    const lookupResults = await lookupAssetWarrantyStatus(query);
    return httpResponse.status(200).json({ success: true, results: lookupResults });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleCreateTicket = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const ticket = await createBreakdownServiceTicket(httpRequest.validatedBody, httpRequest.authenticatedUser._id);
    return httpResponse.status(201).json({ success: true, ticket });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleRecordTicketPayment = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { id } = httpRequest.params;
    const paymentResult = await recordServiceTicketPayment(
      id,
      httpRequest.validatedBody || httpRequest.body,
      httpRequest.authenticatedUser._id
    );
    return httpResponse.status(200).json({ success: true, ticket: paymentResult });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleResolveTicket = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { id } = httpRequest.params;
    const { resolutionNotes, customerConfirmedWorking } = httpRequest.validatedBody;
    const resolvedTicket = await resolveServiceTicketWithConfirmation(
      id,
      resolutionNotes,
      customerConfirmedWorking,
      httpRequest.authenticatedUser._id
    );
    return httpResponse.status(200).json({ success: true, ticket: resolvedTicket });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleGetAllTickets = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const tickets = await fetchAllServiceTickets();
    return httpResponse.status(200).json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};
