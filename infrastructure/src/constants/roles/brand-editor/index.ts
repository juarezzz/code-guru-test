type BrandEditorRoles =
  | 'analytics-sustainability'
  | 'analytics-reach'
  | 'analytics-product-stats'
  | 'analytics-disposal'
  | 'analytics-landing-pages'
  | 'brand-brands'
  | 'brand-campaigns'
  | 'brand-domains'
  | 'brand-gcps'
  | 'brand-landing-pages'
  | 'brand-product-groups'
  | 'brand-product-attributes'
  | 'brand-product-components'
  | 'brand-products'
  | 'brand-users'
  | 'users'
  | 'brand-campaign-events';

type BrandEditor = Record<BrandEditorRoles, string[]>;

export const brand_editor: BrandEditor = {
  'analytics-sustainability': ['GET'],
  'analytics-reach': ['GET'],
  'analytics-product-stats': ['GET'],
  'analytics-disposal': ['GET'],
  'analytics-landing-pages': ['GET'],
  'brand-brands': ['POST', 'GET', 'PUT'],
  'brand-campaigns': ['GET', 'POST', 'DELETE', 'PUT'],
  'brand-domains': ['GET'],
  'brand-gcps': ['PUT', 'DELETE'],
  'brand-landing-pages': ['GET', 'DELETE', 'POST', 'PUT'],
  'brand-product-groups': ['GET', 'DELETE', 'POST', 'PUT'],
  'brand-product-attributes': ['GET', 'POST', 'PATCH'],
  'brand-product-components': ['GET', 'POST', 'PATCH'],
  'brand-products': ['GET', 'DELETE', 'POST', 'PUT'],
  'brand-users': ['GET'],
  'brand-campaign-events': ['GET'],
  users: ['GET'],
};
