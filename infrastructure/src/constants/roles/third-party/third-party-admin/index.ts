type ThirdPartyAdminRoles = 'third-party-labels';

type ThirdPartyAdmin = Record<ThirdPartyAdminRoles, string[]>;

export const third_party_admin: ThirdPartyAdmin = {
  'third-party-labels': ['GET', 'PUT'],
};
