/* ---------- External ---------- */
import { GlueClient } from '@aws-sdk/client-glue';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { S3Client } from '@aws-sdk/client-s3';
import { TimestreamWriteClient } from '@aws-sdk/client-timestream-write';
import {
  CognitoIdentityServiceProvider,
  SharedIniFileCredentials,
} from 'aws-sdk';

/* ---------- Types ---------- */
import { Clients } from '__scripts/@types';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from './dynamodb';
import { cognito_client } from './cognito';
import { timestream_client_query, timestream_client_write } from './timestream';
import { s3_client as s3 } from './s3';

export const generate_custom_clients = (
  credentials: SharedIniFileCredentials,
  region: string,
): Clients => {
  /* ----------
   * Loading credentials from profile
   * ---------- */
  const configs = { ...credentials, region };
  const cognito_configs = { region, credentials };

  /* ----------
   * Initialising clients
   * ---------- */
  const s3_client = new S3Client(configs);
  const glue_client = new GlueClient(configs);
  const lambda_client = new LambdaClient(configs);
  const cognito_client_2 = new CognitoIdentityServiceProvider(cognito_configs);
  const timestream_write_client = new TimestreamWriteClient(configs);

  const clients = {
    s3_client,
    cognito_client: cognito_client_2,
    lambda_client,
    timestream_write_client,
    glue_client,
  };

  return clients;
};

export const clients = {
  dynamodb: dynamodb_documentclient,
  timestream_query: timestream_client_query,
  timestream_write: timestream_client_write,
  cognito: cognito_client,
  s3,
};
