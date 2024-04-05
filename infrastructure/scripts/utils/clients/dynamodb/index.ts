/* ---------- External ---------- */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/* ---------- Config ---------- */
import { accessKeyId, region, secretAccessKey } from '__server/config.json';

/* ---------- Client ---------- */
const dynamodb_client = new DynamoDBClient({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

/* ---------- Options ---------- */
export const marshall_options = {
  convertEmptyValues: false,
  removeUndefinedValues: true,
};

export const dynamodb_documentclient = DynamoDBDocumentClient.from(dynamodb_client, {
  marshallOptions: marshall_options,
});
