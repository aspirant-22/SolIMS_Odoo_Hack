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
import { isCustomerUser } from '../../core/customerScope.js';

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
    const customerUser = isCustomerUser(httpRequest.authenticatedUser) ? httpRequest.authenticatedUser : null;
    if (!query && !customerUser) return httpResponse.status(400).json({ success: false, message: 'Please enter a serial number, name, phone number or order reference to search.' });
    const lookupResults = await lookupAssetWarrantyStatus(query || '', customerUser);
    return httpResponse.status(200).json({ success: true, results: lookupResults });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleCreateTicket = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const customerUser = isCustomerUser(httpRequest.authenticatedUser) ? httpRequest.authenticatedUser : null;
    const ticket = await createBreakdownServiceTicket(httpRequest.validatedBody, httpRequest.authenticatedUser._id, customerUser);
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
    const customerUser = isCustomerUser(httpRequest.authenticatedUser) ? httpRequest.authenticatedUser : null;
    const tickets = await fetchAllServiceTickets({}, customerUser);
    return httpResponse.status(200).json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};
