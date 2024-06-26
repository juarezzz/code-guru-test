/* ---------- External ---------- */
import chalk from 'chalk';
import cors from 'cors';
import express from 'express';
import swagger from 'swagger-ui-express';
import { config } from 'dotenv';

/* ---------- Helpers ---------- */
import { convertExpressToLambda } from './helpers/convertExpressToLambda';

/* ---------- Routes ---------- */
import { routes } from './routes';

/* ---------- JSON ---------- */
import swaggerFile from './docs/swagger.json';

config({ path: process.env.CONFIG_PATH || 'env/.env' });

/* ---------- Helpers constansts ---------- */
const success = chalk.bold.greenBright;
const blue = chalk.bold.cyan;
const blueBg = chalk.bold.redBright.bgCyanBright;
const port = 3333;

/* ----------
  Declare express application and add middlewares
---------- */
const app = express();

app.use(express.json());
app.use(cors());

app.use('/docs', swagger.serve, swagger.setup(swaggerFile));

app.all('*', async (request, response) => {
  const { path, method } = request;

  const route = routes.find(r => r.path === path && r.method === method);

  if (!route)
    return response
      .status(404)
      .json({ message: `${method} ${path} not found.` });

  try {
    const { handler } = await import(
      `_${route.module}/lambdas/api/${route.directory}/handler`
    );

    const { statusCode, body } = await handler(
      convertExpressToLambda({ request }),
    );

    return response.status(statusCode).json(JSON.parse(body));
  } catch (error) {
    if (error instanceof Error) return response.status(500).send(error.message);

    return response.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(blue('Server successfully started.\n'));
  console.log(blue('Currently listening on port:'), success(port), '\n');

  console.log(
    blue('Check out docs at: '),
    success(`http://localhost:${port}/docs`),
    '\n',
  );

  console.log(blue('Available routes:'));
  routes.map(route =>
    console.log(success(' ', route.path, ' '), blueBg(route.method)),
  );
});

console.log({ environment: process.env.ENVIRONMENT });
