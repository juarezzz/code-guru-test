/* ---------- External ---------- */
import { prompt } from 'enquirer';

/* ---------- Choices ---------- */
import { clean_timestream_data } from '__scripts/choices/clean-timestream-data';
import { write_timestream_data } from '__scripts/choices/write-timestream-data';
import { generate_labels_pdf } from '__scripts/choices/generate-labels-pdf';
import { custom_scripts } from '__scripts/choices/custom';
import { clean_dynamodb_data } from '__scripts/choices/clean-dynamodb-data';
import { test_scripts } from '__scripts/utils/test-script';

/* ---------- Logs ---------- */
import { info_log } from '__scripts/utils/logs';
import { print_labels } from './choices/print-labels';

/* ---------- Interfaces ---------- */
interface Environment {
  target_environment: string;
}

interface Action {
  action: string;
}

const main = async () => {
  /* ----------
   * Get the environment input from
   * the user
   * ---------- */
  const local_choices = [
    {
      name: 'custom-scripts',
      message: 'Run custom scripts.',
    },
    {
      name: 'test-scripts',
      message: 'Run test scripts.',
    },
  ];

  const choices = [
    { name: 'generate-labels-pdf', message: 'Generate PDF with labels' },
    { name: 'clean-timestream', message: 'Clean Timestream data' },
    {
      name: 'clean-dynamodb',
      message: 'Clean DynamoDB data',
    },
    {
      name: 'write-timestream',
      message: 'Write Timestream data',
    },
    {
      name: 'print-labels',
      message: 'Print labels and confirm them.',
    },
  ];

  const environment: Environment = await prompt([
    {
      choices: [
        { name: 'DEV', message: 'Development' },
        { name: 'LOCAL', message: 'Local' },
        { name: 'PREPROD', message: 'Pre-production' },
        { name: 'PROD', message: 'Production' },
        { name: 'STG', message: 'Staging' },
      ],
      message: 'What environment do you want to target?',
      name: 'target_environment',
      type: 'select',
    },
  ]);

  const action: Action = await prompt([
    {
      choices:
        environment.target_environment === 'LOCAL' ? local_choices : choices,
      message: 'Which script do you want to run?',
      name: 'action',
      type: 'select',
    },
  ]);

  switch (action.action) {
    case 'generate-labels-pdf':
      await generate_labels_pdf({
        environment: environment.target_environment,
      });
      break;

    case 'write-timestream':
      await write_timestream_data({
        environment: environment.target_environment,
      });
      break;

    case 'clean-timestream':
      await clean_timestream_data({
        environment: environment.target_environment,
      });
      break;

    case 'clean-dynamodb':
      await clean_dynamodb_data({
        environment: environment.target_environment,
      });
      break;

    case 'custom-scripts':
      await custom_scripts({ environment: environment.target_environment });
      break;

    case 'test-scripts':
      await test_scripts();
      break;

    case 'print-labels':
      await print_labels({ environment: environment.target_environment });
      break;

    default:
      break;
  }

  console.log(info_log('All scripts completed!'));
};

main();
