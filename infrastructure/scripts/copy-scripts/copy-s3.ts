/* ---------- External ---------- */
import chalk from 'chalk';

/* ---------- Helpers ---------- */
import { handleCMDInteraction } from '_helpers/cmd/handle-cmd-interaction';

/* ---------- Types ---------- */
import { EnvironmentEnum } from './@types';

/* ---------- Logs helpers ---------- */
const info_log = chalk.bold.blueBright;
const warning_log = chalk.bold.redBright;

/* ---------- Functions ---------- */
export const handleCopyS3 = async (
  from: EnvironmentEnum,
  to: EnvironmentEnum,
  profile: string,
) => {
  const source_bucket_uri = `s3://polytag-${from.toLowerCase()}-main-bucket`;
  const target_bucket_uri = `s3://polytag-${to.toLowerCase()}-main-bucket`;
  const sync_command = `aws s3 sync ${source_bucket_uri} ${target_bucket_uri} --delete --profile ${profile}`;

  console.log(
    info_log(
      `\nCopying data from ${source_bucket_uri} to ${target_bucket_uri}...`,
    ),
  );

  await handleCMDInteraction(
    sync_command,
    info_log('\nS3 Bucket copied succesfully!'),
    warning_log('\nAn error happened while copying the data.'),
    true,
  );
};
