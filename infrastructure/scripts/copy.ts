/* ---------- External ---------- */
import chalk from 'chalk';
import { prompt } from 'enquirer';
import { SharedIniFileCredentials } from 'aws-sdk';

/* ---------- JSONs ---------- */
import { context } from '__cdk.json';

/* ---------- Handlers ---------- */
import { handleCopyS3 } from './copy-scripts/copy-s3';
import { handleCopyCognito } from './copy-scripts/copy-cognito';
import { handleCopyDynamoDB } from './copy-scripts/copy-dynamodb';
import { handleCopyTimestream } from './copy-scripts/copy-timestream';

/* ---------- Clients ---------- */
import { generate_custom_clients } from './utils/clients';

/* ---------- Types ---------- */
import { EnvironmentEnum } from './copy-scripts/@types';

/* ---------- Logs helpers ---------- */
const info_log = chalk.bold.blueBright;

/* ---------- Interfaces ---------- */
interface OperationsPrompt {
  environment_from: string;
  environment_to: string;
  resource: string;
  aws_account: string;
}

/* ---------- Constants ---------- */
const ENVIRONMENT: { [key: string]: EnvironmentEnum } = {
  Development: 'DEV',
  Staging: 'STG',
  Production: 'PROD',
  'Pre-Prod': 'PREPROD',
  Test: 'TEST',
};

/* ---------- Functions ---------- */
const copy = async () => {
  /* ----------
   * Get the operations input from
   * the user
   * ---------- */
  const operation: OperationsPrompt = await prompt([
    {
      choices: ['Production', 'Development', 'Staging', 'Test', 'Pre-Prod'],
      message: 'FROM what environment do you want to clone data?',
      name: 'environment_from',
      type: 'select',
    },
    {
      choices: ['Pre-Prod', 'Development', 'Staging', 'Test'],
      message: 'What environment do you want to clone data TO?',
      name: 'environment_to',
      type: 'select',
    },
    {
      choices: ['DynamoDB', 'Cognito', 'Timestream', 'S3', 'All'],
      message: 'What resources do you want to copy',
      name: 'resource',
      type: 'select',
    },
    {
      message: 'What is your AWS account name?',
      name: 'aws_account',
      type: 'text',
    },
  ]);

  /* ----------
   * Throw an error if same env
   * ---------- */
  if (operation.environment_from === operation.environment_to) {
    throw new Error("You can't copy data to the same environment.");
  }

  const env_from = ENVIRONMENT[operation.environment_from];
  const env_to = ENVIRONMENT[operation.environment_to];
  const config_region = context[env_from].region;
  const credentials = new SharedIniFileCredentials({
    profile: operation.aws_account,
  });

  const clients = generate_custom_clients(credentials, config_region);

  switch (operation.resource) {
    case 'S3':
      await handleCopyS3(env_from, env_to, operation.aws_account);
      break;
    case 'Timestream':
      await handleCopyTimestream(env_from, env_to, clients);
      break;
    case 'Cognito':
      await handleCopyCognito(env_from, env_to, clients);
      break;
    case 'DynamoDB':
      await handleCopyDynamoDB(env_from, env_to, clients);
      break;
    case 'All':
      await handleCopyCognito(env_from, env_to, clients);
      await handleCopyS3(env_from, env_to, operation.aws_account);
      await handleCopyDynamoDB(env_from, env_to, clients);
      await handleCopyTimestream(env_from, env_to, clients);
      break;
    default:
      console.log(info_log('No such resource, aborting'));
  }
};

copy();
