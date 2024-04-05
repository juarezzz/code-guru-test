/* ---------- External ---------- */
import { prompt } from 'enquirer';

/* ---------- @Types ---------- */
import { Environment } from '__scripts/@types';

/* ---------- Logs ---------- */
import { background_grey } from '__scripts/utils/logs';

/* ---------- Scripts ---------- */
import { test_gs1_api_v2_script } from '__scripts/choices/custom/gs1/test-gs1-api-v2';

/* ---------- Interfaces ---------- */
interface Action {
  action: string;
}

/* ---------- Main Function ---------- */
export const gs1_scripts = async ({ environment }: Environment) => {
  console.group();
  console.log(background_grey('*   ---------- GS1 Scripts ----------   *\n\n'));

  const action: Action = await prompt([
    {
      choices: [{ name: 'test-gs1-api-v2', message: 'Do a simple test to GS1 API v2.' }],
      message: 'Which gs1 script do you want to run?',
      name: 'action',
      type: 'select',
    },
  ]);

  switch (action.action) {
    case 'test-gs1-api-v2':
      await test_gs1_api_v2_script({ environment });
      break;

    default:
      break;
  }

  console.groupEnd();
};
