type PolytagAdminRoles =
  | 'admin-brands'
  | 'admin-printer'
  | 'admin-printer-users'
  | 'admin-printer-brand-associations'
  | 'admin-brand-users'
  | 'admin-mrf-users';

type PolytagAdmin = Record<PolytagAdminRoles, string[]>;

export const polytag_admin: PolytagAdmin = {
  'admin-brands': ['POST'],
  'admin-brand-users': ['GET', 'DELETE', 'PATCH'],
  'admin-printer': ['POST', 'GET'],
  'admin-printer-brand-associations': ['PUT', 'GET', 'DELETE'],
  'admin-printer-users': ['POST', 'GET'],
  'admin-mrf-users': ['DELETE'],
};
