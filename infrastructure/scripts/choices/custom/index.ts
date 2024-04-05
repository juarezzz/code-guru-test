/* ---------- External ---------- */
import { prompt } from 'enquirer';

/* ---------- @Types ---------- */
import { Environment } from '__scripts/@types';

/* ---------- Logs ---------- */
import { background_grey } from '__scripts/utils/logs';

/* ---------- Scripts ---------- */
import { gs1_scripts } from '__scripts/choices/custom/gs1';

/* ---------- Interfaces ---------- */
interface Action {
  action: string;
}

/* ---------- Main Function ---------- */
export const custom_scripts = async ({ environment }: Environment) => {
  console.group();
  console.log(background_grey('*   ---------- Custom Scripts ----------   *\n\n'));

  const action: Action = await prompt([
    {
      choices: [{ name: 'gs1-scripts', message: 'GS1 Scripts' }],
      message: 'Which custom script do you want to run?',
      name: 'action',
      type: 'select',
    },
  ]);

  switch (action.action) {
    case 'gs1-scripts':
      await gs1_scripts({ environment });
      break;

    default:
      break;
  }

  console.groupEnd();
};
