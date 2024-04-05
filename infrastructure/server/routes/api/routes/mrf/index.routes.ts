import { mrf_authentication } from '__server/routes/api/routes/mrf/mrf-authentication.routes';
import { mrf_scans } from '__server/routes/api/routes/mrf/mrf-scans.routes';
import { mrf_verification } from '__server/routes/api/routes/mrf/mrf-verification.routes';
import { mrf_invitation } from '__server/routes/api/routes/mrf/mrf-invitation.routes';

export const mrf_routes = [
  ...mrf_authentication,
  ...mrf_scans,
  ...mrf_verification,
  ...mrf_invitation,
];
