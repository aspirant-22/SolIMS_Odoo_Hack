/**
 * @AUTHOR: Garima Mittal
 * @FILE: order.controller.js
 * @RESPONSIBILITY: Express controllers handling HTTP requests for quotation creation, advance/leftover collection, crew scheduling and customer-scoped portal data.
 * @DEPENDENCIES: order.service.js, customerScope.js
 */

import {
  generateQuoteForLeadInquiry,
  processAdvancePaymentForOrder,
  processPaymentForOrder,
  assignCrewToProjectOrder,
  fetchAllProjectOrders,
  fetchProjectOrderById,
  activateCustomerForProjectOrder,
  resendStage2ActivationEmail,
  fetchMyCustomerProjectOrder,
  fetchAllTechnicians,
  fetchQuoteForLead,
  fetchCustomerPortalBundle,
  updateOrderSubsidyComplianceAndStatus,
  fetchOrderCertificateData
} from './order.service.js';
import {
  isCustomerUser,
  buildOrderScopeFilter,
  orderBelongsToCustomer,
  buildHttpError
} from '../../core/customerScope.js';

export const handleGenerateQuote = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { leadInquiryId, customDiscountInr } = httpRequest.validatedBody;
    const { quote, alreadyGenerated } = await generateQuoteForLeadInquiry(
      leadInquiryId,
      customDiscountInr,
      httpRequest.authenticatedUser._id
    );
    return httpResponse.status(alreadyGenerated ? 200 : 201).json({ success: true, quote, alreadyGenerated });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleGetQuoteByLead = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const quote = await fetchQuoteForLead(httpRequest.params.leadId);
    return httpResponse.status(200).json({ success: true, quote });
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
    const { inverterTechnician, rooftopTechnician, wiringTechnician, scheduledInstallationDate } = httpRequest.validatedBody;
    const updatedOrder = await assignCrewToProjectOrder(
      id,
      { inverterTechnician, rooftopTechnician, wiringTechnician },
      scheduledInstallationDate,
      httpRequest.authenticatedUser._id
    );
    return httpResponse.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleGetAllOrders = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const scopeFilter = isCustomerUser(httpRequest.authenticatedUser)
      ? buildOrderScopeFilter(httpRequest.authenticatedUser)
      : {};
    const ordersList = await fetchAllProjectOrders(scopeFilter);
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
    if (isCustomerUser(httpRequest.authenticatedUser) && !orderBelongsToCustomer(foundOrder, httpRequest.authenticatedUser)) {
      return httpResponse.status(403).json({ success: false, message: 'You can only view your own project order.' });
    }
    return httpResponse.status(200).json({ success: true, order: foundOrder });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleActivateCustomerAccount = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { id } = httpRequest.params;
    const result = await activateCustomerForProjectOrder(id, httpRequest.authenticatedUser._id);
    return httpResponse.status(200).json({
      success: true,
      message: 'Customer portal account activated and welcome email sent.',
      ...result
    });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleResendStage2Email = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { id } = httpRequest.params;
    const result = await resendStage2ActivationEmail(id);
    return httpResponse.status(200).json({
      success: true,
      message: 'Welcome and credentials email sent again.',
      ...result
    });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleGetMyProjectOrder = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const projectOrder = await fetchMyCustomerProjectOrder(httpRequest.authenticatedUser);
    return httpResponse.status(200).json({
      success: true,
      order: projectOrder
    });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleGetMyPortalBundle = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const bundle = await fetchCustomerPortalBundle(httpRequest.authenticatedUser);
    return httpResponse.status(200).json({ success: true, ...bundle });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleRecordOrderPayment = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { id } = httpRequest.params;
    const { paymentAmountInr, paymentMode, transactionReference } = httpRequest.validatedBody;

    if (isCustomerUser(httpRequest.authenticatedUser)) {
      const ownedOrder = await fetchProjectOrderById(id);
      if (!ownedOrder || !orderBelongsToCustomer(ownedOrder, httpRequest.authenticatedUser)) {
        throw buildHttpError(403, 'You can only pay for your own project order.');
      }
    }

    const updatedOrder = await processPaymentForOrder(
      id,
      paymentAmountInr,
      paymentMode,
      transactionReference,
      httpRequest.authenticatedUser?._id
    );
    return httpResponse.status(200).json({
      success: true,
      message: 'Payment received successfully.',
      order: updatedOrder
    });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleGetAllTechnicians = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const technicians = await fetchAllTechnicians();
    return httpResponse.status(200).json({
      success: true,
      count: technicians.length,
      technicians
    });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleUpdateOrderSubsidy = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { id } = httpRequest.params;
    const { newStatus, complianceChecks } = httpRequest.body;
    const updatedOrder = await updateOrderSubsidyComplianceAndStatus(
      id,
      { newStatus, complianceChecks },
      httpRequest.authenticatedUser?._id
    );
    return httpResponse.status(200).json({
      success: true,
      message: `Subsidy status updated to "${updatedOrder.subsidyApplicationStatus}" successfully.`,
      order: updatedOrder
    });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleGetOrderCertificate = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { id } = httpRequest.params;
    const certData = await fetchOrderCertificateData(id);
    return httpResponse.status(200).json({
      success: true,
      ...certData
    });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};
