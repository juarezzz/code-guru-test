import { admin_authentication } from '__server/routes/api/routes/admin/admin-authentication.routes';
import { admin_clients } from '__server/routes/api/routes/admin/admin-clients.routes';
import { admin_clients_status } from '__server/routes/api/routes/admin/admin-clients-status.routes';
import { admin_image_library } from '__server/routes/api/routes/admin/admin-image-library.routes';
import { admin_landing_page_templates } from '__server/routes/api/routes/admin/admin-landing-page-templates.routes';
import { admin_mrf } from '__server/routes/api/routes/admin/admin-mrf.routes';
import { admin_third_party } from '__server/routes/api/routes/admin/admin-third-party.routes';
import { admin_users } from '__server/routes/api/routes/admin/admin-users.routes';
import { admin_forgot_password } from '__server/routes/api/routes/admin/admin-forgot-password.routes';
import { admin_printer } from './admin-printer.routes';
import { admin_mrfs } from './admin-mrfs.routes';
import { admin_mrf_users } from './admin-mrf-users.routes';
import { admin_brand_users } from './admin-brand-users.routes';
import { admin_brands } from './admin-brands.routes';
import { admin_invite } from './admin-invite.routes';
import { admin_printer_brand } from './admin-printer-brand-associations.routes';

export const admin_routes = [
  ...admin_authentication,
  ...admin_clients,
  ...admin_image_library,
  ...admin_landing_page_templates,
  ...admin_mrf,
  ...admin_third_party,
  ...admin_users,
  ...admin_forgot_password,
  ...admin_printer,
  ...admin_mrfs,
  ...admin_mrf_users,
  ...admin_brand_users,
  ...admin_brands,
  ...admin_invite,
  ...admin_printer_brand,
  ...admin_clients_status,
];
