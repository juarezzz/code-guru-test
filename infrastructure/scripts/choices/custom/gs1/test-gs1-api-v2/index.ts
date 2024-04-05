/* ---------- @Types ---------- */
import { Environment } from '__scripts/@types';

/* ---------- Logs ---------- */
import {
  background_blue,
  background_grey,
  info_log,
} from '__scripts/utils/logs';

/* ---------- Utils ---------- */
import { timer } from '_helpers/utils/timer';

/* ---------- Functions ---------- */
import { test_batches } from '__scripts/choices/custom/gs1/test-gs1-api-v2/test-batches';

/* ---------- Main Function ---------- */
export const test_gs1_api_v2_script = async ({ environment }: Environment) => {
  console.group();
  console.log(
    background_grey(
      '                          \n  Test GS1 API v2 Script  \n                          \n',
    ),
  );

  let total_time = 1000 * 60 * 60 * 24;
  let count = 0;

  console.time(background_blue('Total time '));

  do {
    count += 1;
    total_time -= 10000;

    console.log(background_blue(`\n  Test: ${count} `));
    console.log(info_log(`Remaining: ${total_time / 10000} iterations.\n`));

    console.timeLog(background_blue('Total time '));

    await test_batches();

    await timer({ seconds: 10 });
  } while (total_time >= 0);

  console.timeEnd(background_blue('Total time '));

  await test_batches();

  console.groupEnd();
};
