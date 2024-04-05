import { analytics_routes } from '__server/routes/analytics/index.routes';
import { api_routes } from '__server/routes/api/index.routes';

const routes = [...analytics_routes, ...api_routes];

export { routes };
