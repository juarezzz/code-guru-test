import { brand_authentication } from '__server/routes/api/routes/brand-authentication.routes';
import { brands } from '__server/routes/api/routes/brands.routes';
import { brand_campaigns } from '__server/routes/api/routes/brand-campaigns.routes';
import { display_page } from '__server/routes/api/routes/display-page.routes';
import { brand_domains } from '__server/routes/api/routes/brand-domains.routes';
import { gs1_checker } from '__server/routes/api/routes/gs1-checker.routes';
import { image_library } from '__server/routes/api/routes/image-library.routes';
import { invite } from '__server/routes/api/routes/invite.routes';
import { landing_pages } from '__server/routes/api/routes/landing-pages.routes';
import { landing_pages_preview } from '__server/routes/api/routes/landing-pages-preview.routes';
import { mrfs } from '__server/routes/api/routes/mrfs.routes';
import { mrfs_authentication } from '__server/routes/api/routes/mrfs-authentication.routes';
import { printer } from '__server/routes/api/routes/printer.routes';
import { product_groups } from '__server/routes/api/routes/product-groups.routes';
import { products } from '__server/routes/api/routes/products.routes';
import { users } from '__server/routes/api/routes/users.routes';
import { sign_up_whitelist } from '__server/routes/api/routes/sign-up-whitelist.routes';
import { batch_upload } from '__server/routes/api/routes/batch-upload.routes';
import { forgot_password } from '__server/routes/api/routes/forgot-password.routes';
import { sign_up } from '__server/routes/api/routes/sign-up.routes';
import { sign_in } from '__server/routes/api/routes/sign-in.routes';
import { verification } from '__server/routes/api/routes/verification.routes';
import { populate_cron_settings } from '__server/routes/api/routes/populate-cron-settings.routes';
import { user_attributes } from '__server/routes/api/routes/user-attributes.routes';
import { test_data } from '__server/routes/api/routes/test-data.routes';
import { landing_page_templates } from '__server/routes/api/routes/landing-pages-templates.routes';
import { brand_landing_pages } from '__server/routes/api/routes/brand-landing-pages.routes';
import { brand_product_attributes } from '__server/routes/api/routes/brand-product-attributes.routes';
import { brand_product_components } from '__server/routes/api/routes/brand-product-components.routes';
import { cms } from '__server/routes/api/routes/cms.routes';
import { brand_gcps } from '__server/routes/api/routes/brand-gcps.routes';
import { admin_routes } from '__server/routes/api/routes/admin/index.routes';
import { third_party_routes } from '__server/routes/api/routes/third-party/index.routes';
import { mrf_routes } from '__server/routes/api/routes/mrf/index.routes';
import { brand_users } from '__server/routes/api/routes/brand_users.routes';
import { campaign_events } from '__server/routes/api/routes/campaign-events.routes';

export const api_routes = [
  ...brand_authentication,
  ...brand_campaigns,
  ...batch_upload,
  ...brands,
  ...brand_users,
  ...display_page,
  ...brand_domains,
  ...gs1_checker,
  ...image_library,
  ...invite,
  ...landing_pages,
  ...landing_pages_preview,
  ...mrfs_authentication,
  ...mrfs,
  ...printer,
  ...product_groups,
  ...products,
  ...users,
  ...sign_up_whitelist,
  ...forgot_password,
  ...sign_in,
  ...sign_up,
  ...verification,
  ...populate_cron_settings,
  ...user_attributes,
  ...test_data,
  ...landing_page_templates,
  ...admin_routes.flat(),
  ...third_party_routes.flat(),
  ...mrf_routes.flat(),
  ...brand_landing_pages,
  ...brand_product_attributes,
  ...brand_product_components,
  ...cms,
  ...brand_gcps,
  ...campaign_events,
];
