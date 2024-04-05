type MrfAdminRoles = 'mrf-scans' | 'mrf-users';

type MrfAdmin = Record<MrfAdminRoles, string[]>;

export const mrf_admin: MrfAdmin = {
  'mrf-scans': ['GET'],
  'mrf-users': ['GET', 'PUT', 'DELETE'],
};
