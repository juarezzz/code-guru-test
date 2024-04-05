type PolytagSuperAdminRoles =
  | 'admin-brands'
  | 'admin-brand-users'
  | 'admin-printer'
  | 'admin-printer-brand-associations'
  | 'admin-printer-users'
  | 'admin-mrf-users'
  | 'admin-third-party-users'
  | 'admin-third-party-user-groups';

type PolytagSuperAdmin = Record<PolytagSuperAdminRoles, string[]>;

export const polytag_super_admin: PolytagSuperAdmin = {
  'admin-brands': ['POST', 'DELETE'],
  'admin-brand-users': ['GET', 'DELETE', 'PATCH'],
  'admin-printer': ['POST', 'GET'],
  'admin-printer-brand-associations': ['PUT', 'GET', 'DELETE'],
  'admin-printer-users': ['POST', 'GET'],
  'admin-mrf-users': ['DELETE'],
  'admin-third-party-users': ['GET', 'PATCH', 'POST', 'DELETE'],
  'admin-third-party-user-groups': ['GET'],
};
