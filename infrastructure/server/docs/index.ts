import swagger from 'swagger-ui';

import 'swagger-ui/dist/swagger-ui.css';

import spec from './swagger.json';

swagger({
  spec,
  dom_id: '#swagger',
});
