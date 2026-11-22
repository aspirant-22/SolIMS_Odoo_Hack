/**
 * @AUTHOR: Garima Mittal
 * @FILE: PublicInverterQrLookupView.jsx
 * @RESPONSIBILITY: Re-export alias forwarding to PublicQrWarrantyView for mobile QR lookup and ticket filing.
 * @DEPENDENCIES: PublicQrWarrantyView.jsx
 */

import { PublicQrWarrantyView } from './PublicQrWarrantyView';

export { PublicQrWarrantyView, PublicQrWarrantyView as PublicInverterQrLookupView };
export default PublicQrWarrantyView;
