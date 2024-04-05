import { labels } from '__server/routes/api/routes/third-party/labels.routes';
import { authentication } from '__server/routes/api/routes/third-party/authentication.routes';
import { verification } from '__server/routes/api/routes/third-party/verification.routes';

export const third_party_routes = [
  ...labels,
  ...authentication,
  ...verification,
];
