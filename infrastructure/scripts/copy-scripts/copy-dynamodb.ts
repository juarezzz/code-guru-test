/* ---------- External ---------- */
import {
  UpdateEventSourceMappingCommand,
  ListEventSourceMappingsCommand,
} from '@aws-sdk/client-lambda';
import {
  StartJobRunCommand,
  StartCrawlerCommand,
  GetCrawlerCommand,
  GetJobRunCommand,
} from '@aws-sdk/client-glue';
import chalk from 'chalk';

/* ---------- Helpers ---------- */
import { timer } from '_helpers/utils/timer';

/* ---------- Types ---------- */
import { Clients } from '__scripts/@types';
import { EnvironmentEnum, StartCrawlerInput, StartJobRunInput } from './@types';

/* ---------- Logs helpers ---------- */
const info_log = chalk.bold.blueBright;
const note_log = chalk.bold.yellowBright;
const warning_log = chalk.bold.redBright;

/* ---------- Constants ---------- */
const CRAWLER_RUN_STATUSES = ['READY', 'STOPPING'];
const JOB_RUN_STATUSES = ['FAILED', 'ERROR', 'TIMEOUT', 'SUCCEEDED'];

/* ---------- Functions ---------- */
const runAndWaitForCrawler = async (input: StartCrawlerInput) => {
  /* ----------
   * Running crawler
   * ---------- */
  const start_crawler_command = new StartCrawlerCommand({ Name: input.crawler_name });

  await input.clients.glue_client.send(start_crawler_command);

  /* ----------
   * Checking every 5 seconds to
   * see if its finished running
   * ---------- */
  let crawler_state: string;
  const get_crawler_command = new GetCrawlerCommand({ Name: input.crawler_name });

  do {
    await timer({ seconds: 5 });

    const result = await input.clients.glue_client.send(get_crawler_command);

    crawler_state = result.Crawler?.State || '';
  } while (!CRAWLER_RUN_STATUSES.includes(crawler_state));
};

const runAndWaitForJob = async (input: StartJobRunInput): Promise<string> => {
  /* ----------
   * Running job
   * ---------- */
  const start_job_command = new StartJobRunCommand({
    JobName: input.job_name,
    Arguments: {
      '--GLUE_DATABASE_NAME': input.glue_database_name,
      '--GLUE_TABLE_NAME': input.glue_table_name,
      '--TARGET_DB_NAME': input.target_db_name,
    },
  });

  const { JobRunId } = await input.clients.glue_client.send(start_job_command);

  /* ----------
   * Checking every 5 seconds to
   * see if its finished running
   * ---------- */
  let job_run_state: string;
  const get_job_run_command = new GetJobRunCommand({ JobName: input.job_name, RunId: JobRunId });

  do {
    await timer({ seconds: 5 });

    const result = await input.clients.glue_client.send(get_job_run_command);

    job_run_state = result.JobRun?.JobRunState || '';
  } while (!JOB_RUN_STATUSES.includes(job_run_state));

  return job_run_state;
};

export const handleCopyDynamoDB = async (
  from: EnvironmentEnum,
  to: EnvironmentEnum,
  clients: Clients,
) => {
  try {
    const glue_table_name = `maintable_${from.toLowerCase()}`;
    const glue_database_name = `maintable-gluedb-${from.toLowerCase()}`;
    const target_db_name = `MainTable-${to}`;
    const table_crawler_name = `maintable-crawler-${from.toLowerCase()}`;
    const copy_job_name = `copy-dynamodb-glue-job-${from.toLowerCase()}`;

    console.log(info_log('\nRunning database crawler...'));

    await runAndWaitForCrawler({ crawler_name: table_crawler_name, clients });

    console.log(info_log('\nTemporarily disabling table streams...'));

    const get_table_stream = new ListEventSourceMappingsCommand({
      FunctionName: `dynamo-stream-${to.toLowerCase()}`,
    });

    const { EventSourceMappings: stream_handlers_list } = await clients.lambda_client.send(
      get_table_stream,
    );

    const enabled_stream_handlers_list = stream_handlers_list?.filter(
      stream_handler => stream_handler.State === 'Enabled',
    );

    if (enabled_stream_handlers_list?.[0]) {
      const stream_uuid = enabled_stream_handlers_list[0].UUID;

      const disable_stream_command = new UpdateEventSourceMappingCommand({
        UUID: stream_uuid,
        Enabled: false,
      });

      await clients.lambda_client.send(disable_stream_command);
    }

    console.log(info_log('\nCopying table...'));

    const job_run_result = await runAndWaitForJob({
      job_name: copy_job_name,
      target_db_name,
      glue_database_name,
      glue_table_name,
      clients,
    });

    if (job_run_result !== 'SUCCEEDED') {
      console.log(warning_log('The job execution did not succeed.'));
      return;
    }

    console.log(info_log('\nJob complete, enabling streams again...'));

    if (enabled_stream_handlers_list?.[0]) {
      const stream_uuid = enabled_stream_handlers_list[0].UUID;

      const enable_stream_command = new UpdateEventSourceMappingCommand({
        UUID: stream_uuid,
        Enabled: true,
      });

      await clients.lambda_client.send(enable_stream_command);
    }

    console.log(note_log('\nSuccessfully copied the table!'));
  } catch (error) {
    console.log(warning_log('\nAn error happened while cloning the table.'));
    console.log(warning_log(error));
  }
};
