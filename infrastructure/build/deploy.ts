/* ---------- External ---------- */
import chalk from 'chalk';
import { prompt } from 'enquirer';

/* ---------- Helpers ---------- */
import { handleCMDInteraction } from '_helpers/cmd/handle-cmd-interaction';

/* ---------- Logs helpers ---------- */
const info_log = chalk.bold.blueBright;

/* ---------- Interfaces ---------- */
interface Action {
  action: string;
  stack: string;
}

interface Environment {
  environment: string;
  aws_account: string;
}

/* ---------- Functions ---------- */
const deploy = async () => {
  /* ----------
   * Get the environment input from
   * the user
   * ---------- */

  let stack = '';

  const { stack: cdk_stack, action }: Action = await prompt([
    {
      choices: ['deploy', 'diff', 'destroy', 'synth'],
      message: 'What do you want to do?',
      name: 'action',
      type: 'select',
    },
    {
      choices: [
        { name: 'backend', value: 'backend', message: 'Backend stack' },
        {
          name: 'diagnostics',
          value: 'diagnostics',
          message: 'Diagnostics stack',
        },
        { name: 'pipeline', value: 'pipeline', message: 'Pipeline stack' },
        {
          name: 'web policies',
          value: 'web policies',
          message: 'Web policies stack',
        },
        { name: 'web', value: 'web', message: 'Web stack' },
        { name: 'web-admin', value: 'web-admin', message: 'Web admin stack' },
        {
          name: 'web-rc-portal',
          value: 'web-rc-portal',
          message: 'Web RC Portal stack',
        },
        {
          name: 'web-printer',
          value: 'web-printer',
          message: 'Web Printer Portal stack',
        },
      ],
      message: 'What stacks do you want to deploy?',
      name: 'stack',
      type: 'select',
    },
  ]);

  const { environment, aws_account }: Environment = await prompt([
    {
      choices:
        cdk_stack === 'pipeline'
          ? ['development', 'main']
          : ['development', 'staging', 'production', 'testing', 'pre-prod'],
      message: 'What environment do you want to deploy?',
      name: 'environment',
      type: 'select',
    },
    {
      message: 'What is your AWS account name?',
      name: 'aws_account',
      type: 'text',
    },
  ]);

  /* ----------
   * Check if the user wants to deploy
   * all stacks or just one
   * ---------- */
  switch (cdk_stack) {
    case 'web':
      stack += 'WEB';
      break;
    case 'web-admin':
      stack += 'ADMINWEB';
      break;
    case 'backend':
      stack += 'BACK';
      break;
    case 'diagnostics':
      stack += 'DIAGNOSTICS';
      break;
    case 'pipeline':
      stack += 'PIPE';
      break;
    case 'web policies':
      stack += 'POLICIES';
      break;
    case 'web-rc-portal':
      stack += 'RCPORTALWEB';
      break;
    case 'web-printer':
      stack += 'PRINTERWEB';
      break;

    default:
      break;
  }

  /* ----------
   * Check which environment the user
   * wants to deploy
   * ---------- */
  switch (environment) {
    case 'development':
      stack += '-DEV';
      break;
    case 'staging':
      stack += '-STG';
      break;
    case 'production':
      stack += '-PROD';
      break;
    case 'testing':
      stack += '-TEST';
      break;
    case 'pre-prod':
      stack += '-PREPROD';
      break;
    case 'main':
      stack += '-MAIN';
      break;

    default:
      break;
  }

  /* ----------
   * If no stack is selected, exit the function
   * ---------- */
  if (!stack) throw new Error('Please select a stack to deploy');

  if (
    cdk_stack === 'pipeline' &&
    !['main', 'development'].includes(environment)
  ) {
    throw new Error(
      'Pipeline Stack is only allowed to have MAIN or DEV environment.',
    );
  }

  let command = '';

  if (action === 'diff')
    command = `cdk diff --all -c choice=${stack} -c profile=${aws_account} --profile ${aws_account}`;
  else if (action === 'destroy') {
    command = `cdk destroy --all -c choice=${stack} -c profile=${aws_account} --profile ${aws_account} --require-approval never`;

    console.log(
      info_log(
        `\n\nDestroying ${cdk_stack} stack in ${environment} environment...`,
      ),
    );
  } else if (action === 'synth') {
    command = `cdk synth --all -c choice=${stack} -c profile=${aws_account} --profile ${aws_account} --require-approval never `;

    console.log(
      info_log(
        `\n\nSynthesizing ${cdk_stack} stack in ${environment} environment...`,
      ),
    );
  } else {
    command = `cdk deploy --all -c choice=${stack} -c profile=${aws_account} --profile ${aws_account} --require-approval never`;

    console.log(
      info_log(
        `\n\nDeploying ${cdk_stack} stack in ${environment} environment...`,
      ),
    );
  }

  handleCMDInteraction(
    command,
    'Stack deployed successfully!',
    'Failed to deploy stack, please check your credentials.',
  );
};

deploy();
