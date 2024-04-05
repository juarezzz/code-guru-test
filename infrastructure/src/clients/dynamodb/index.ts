/* ---------- External ---------- */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/* ---------- Client ---------- */
const dynamodb_client = new DynamoDBClient({
  maxAttempts: 20,
});

const dynamodb_client_lower_attempts = new DynamoDBClient({
  maxAttempts: 3,
});

/* ---------- Options ---------- */
export const marshall_options = {
  convertEmptyValues: false,
  removeUndefinedValues: true,
};

export const dynamodb_documentclient = DynamoDBDocumentClient.from(
  dynamodb_client,
  {
    marshallOptions: marshall_options,
  },
);

export const dynamodb_documentclient_lower_attempts =
  DynamoDBDocumentClient.from(dynamodb_client_lower_attempts, {
    marshallOptions: marshall_options,
  });
