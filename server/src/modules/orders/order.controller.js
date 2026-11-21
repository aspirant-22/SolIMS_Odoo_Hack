/**
 * @AUTHOR: Garima Mittal
 * @FILE: order.controller.js
 * @RESPONSIBILITY: Express controllers handling HTTP requests for quotation creation, advance collection, and crew scheduling.
 * @DEPENDENCIES: order.service.js
 */

import {
  generateQuoteForLeadInquiry,
  processAdvancePaymentForOrder,
  assignCrewToProjectOrder,
  fetchAllProjectOrders,
  fetchProjectOrderById
} from './order.service.js';

export const handleGenerateQuote = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { leadInquiryId, customDiscountInr } = httpRequest.validatedBody;
    const generatedQuote = await generateQuoteForLeadInquiry(leadInquiryId, customDiscountInr, httpRequest.authenticatedUser._id);
    return httpResponse.status(201).json({ success: true, quote: generatedQuote });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleCaptureAdvancePayment = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { id } = httpRequest.params;
    const { paymentAmountInr, paymentMode, transactionReference } = httpRequest.validatedBody;
    const updatedOrder = await processAdvancePaymentForOrder(
      id,
      paymentAmountInr,
      paymentMode,
      transactionReference,
      httpRequest.authenticatedUser._id
    );
    return httpResponse.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleAssignCrew = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { id } = httpRequest.params;
    const body = httpRequest.validatedBody;
    const technicianIds = body.technicianIdsArray || body.technicianUserIds || body.technicians || [httpRequest.authenticatedUser._id];
    const updatedOrder = await assignCrewToProjectOrder(
      id,
      technicianIds,
      body.scheduledInstallationDate,
      httpRequest.authenticatedUser._id
    );
    return httpResponse.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleGetAllOrders = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const ordersList = await fetchAllProjectOrders();
    return httpResponse.status(200).json({ success: true, count: ordersList.length, orders: ordersList });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleGetOrderById = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { id } = httpRequest.params;
    const foundOrder = await fetchProjectOrderById(id);
    if (!foundOrder) return httpResponse.status(404).json({ success: false, message: 'Order not found' });
    return httpResponse.status(200).json({ success: true, order: foundOrder });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};
