/* ---------- External ---------- */
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { S3Client } from '@aws-sdk/client-s3';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { TimestreamWriteClient } from '@aws-sdk/client-timestream-write';
import { GlueClient } from '@aws-sdk/client-glue';

export interface Clients {
  s3_client: S3Client;
  glue_client: GlueClient;
  lambda_client: LambdaClient;
  cognito_client: CognitoIdentityServiceProvider;
  timestream_write_client: TimestreamWriteClient;
}

export interface Environment {
  environment: string;
  all?: boolean;
  format?: string;
  choice?: string;
}
