/* ---------- External ---------- */
import { CreateDeploymentCommand } from '@aws-sdk/client-api-gateway';

/* ---------- Clients ---------- */
import { api_gateway_client } from '_clients/api-gateway';

export const handler = async () => {
  try {
    const command = new CreateDeploymentCommand({
      restApiId: process.env.REST_API_ID,
      stageName: 'prod',
    });

    await api_gateway_client.send(command);
  } catch (error) {
    console.log(error);
  }
};
