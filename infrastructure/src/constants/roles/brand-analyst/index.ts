type BrandAnalystRoles =
  | 'analytics-sustainability'
  | 'analytics-reach'
  | 'analytics-product-stats'
  | 'analytics-disposal'
  | 'analytics-landing-pages'
  | 'brand-brands'
  | 'brand-campaigns'
  | 'brand-domains'
  | 'brand-landing-pages'
  | 'brand-product-groups'
  | 'brand-products'
  | 'brand-product-attributes'
  | 'brand-product-components'
  | 'brand-users'
  | 'users';

type BrandAnalyst = Record<BrandAnalystRoles, string[]>;

export const brand_analyst: BrandAnalyst = {
  'analytics-sustainability': ['GET'],
  'analytics-reach': ['GET'],
  'analytics-product-stats': ['GET'],
  'analytics-disposal': ['GET'],
  'analytics-landing-pages': ['GET'],
  'brand-brands': ['GET'],
  'brand-campaigns': ['GET'],
  'brand-domains': ['GET'],
  'brand-landing-pages': ['GET'],
  'brand-product-groups': ['GET'],
  'brand-products': ['GET'],
  'brand-product-attributes': ['GET'],
  'brand-product-components': ['GET'],
  users: ['GET'],
  'brand-users': ['GET'],
};
