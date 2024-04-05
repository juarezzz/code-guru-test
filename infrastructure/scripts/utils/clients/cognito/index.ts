/* ---------- External ---------- */
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Config ---------- */
import { accessKeyId, region, secretAccessKey } from '__server/config.json';

/* ---------- Client ---------- */
export const cognito_client = new CognitoIdentityProviderClient({
  region,
  credentials: { accessKeyId, secretAccessKey },
});
