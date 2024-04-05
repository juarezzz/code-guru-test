/* ---------- Clients ---------- */
import { cognito_client } from './cognito';
import { dynamodb_documentclient } from './dynamodb';
import { glue_client } from './glue';
import { gs1_client } from './gs1';
import { lambda_client } from './lambda';
import { s3_client } from './s3';
import { ses_client } from './ses';
import { step_functions_client } from './step_functions';
import { timestream_client_query, timestream_client_write } from './timestream';

export const clients = {
  cognito: cognito_client,
  dynamodb: dynamodb_documentclient,
  gs1: gs1_client,
  s3: s3_client,
  ses: ses_client,
  step_functions: step_functions_client,
  timestream_query: timestream_client_query,
  timestream_write: timestream_client_write,
  lambda: lambda_client,
  glue: glue_client,
};
