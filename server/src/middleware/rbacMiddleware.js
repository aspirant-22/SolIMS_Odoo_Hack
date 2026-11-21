/**
 * @AUTHOR: Garima Mittal
 * @FILE: rbacMiddleware.js
 * @RESPONSIBILITY: Enforces role-based access control policies across protected ERP service routes.
 * @DEPENDENCIES: None
 */

export const authorizeRoles = (...authorizedRolesArray) => {
  return (httpRequest, httpResponse, nextMiddlewareFunction) => {
    const currentAuthenticatedUser = httpRequest.authenticatedUser;

    if (!currentAuthenticatedUser) {
      return httpResponse.status(401).json({
        success: false,
        message: 'Security authorization check requires an authenticated user'
      });
    }

    const hasAuthorizedPrivilege = authorizedRolesArray.includes(currentAuthenticatedUser.role);
    if (!hasAuthorizedPrivilege) {
      return httpResponse.status(403).json({
        success: false,
        message: `Forbidden: User role [${currentAuthenticatedUser.role}] lacks required tier authorization`
      });
    }

    return nextMiddlewareFunction();
  };
};
