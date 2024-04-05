/* eslint-disable no-await-in-loop */
/* ---------- External ---------- */
import { prompt } from 'enquirer';
import _ from 'lodash';
import {
  WriteRecordsCommand,
  WriteRecordsCommandInput,
} from '@aws-sdk/client-timestream-write';
import { Record } from 'aws-sdk/clients/timestreamwrite';

/* ---------- Types ---------- */
import {
  NumberPrompt,
  StringPrompt,
  User,
  Report,
  GTIN,
} from '__scripts/choices/write-timestream-data/@types';

/* ---------- Clients ---------- */
import { clients } from '__scripts/utils/clients';

/* ---------- Utils ---------- */
import {
  error_log,
  info_log,
  success_log,
  warning_log,
} from '__scripts/utils/logs';

/* ---------- Functions ---------- */
import { generate_gtin_data } from '__scripts/choices/write-timestream-data/generate-gtin-data';
import { get_dates } from '__scripts/choices/write-timestream-data/get-dates';
import { generate_label } from '__scripts/choices/write-timestream-data/generate-label';
import { generate_random_int } from '__scripts/utils/generate-random-int';
import { get_date } from '__scripts/choices/write-timestream-data/get-date';
import { generate_user } from '__scripts/choices/write-timestream-data/generate-user';
import { get_gtin_data } from '__scripts/choices/write-timestream-data/get-gtin-data';
import { generate_qr_scan } from '__scripts/choices/write-timestream-data/generate-qr-scan';

/* ---------- Interfaces ---------- */
interface WriteTimestreamData {
  environment: string;
}

const write_timestream_data = async ({ environment }: WriteTimestreamData) => {
  const gtin_data: GTIN[] = [];
  const gtins: string[] = [];
  const labels: Record[] = [];
  const users: User[] = [];
  const commands: WriteRecordsCommand[] = [];

  const report: Report = {
    users: 0,
    labels: {
      total: 0,
      scanned: 0,
      not_scanned: 0,
    },
    start_date: '',
    end_date: '',
  };

  const number_of_gtins: NumberPrompt = await prompt({
    message: 'How many GTINs do you want to generate?',
    name: 'value',
    type: 'numeral',
  });

  for (let i = 0; i < number_of_gtins.value; i += 1) {
    const gtin: StringPrompt = await prompt({
      message: 'Input the GTIN Number. (e.g. 1234567890123)',
      name: 'value',
      type: 'text',
    });

    gtins.push(gtin.value);
  }

  const start_date_prompt: StringPrompt = await prompt({
    message: 'What is the starting date of the generation? (YYYY-MM-DD)',
    name: 'value',
    type: 'text',
  });

  const end_date_prompt: StringPrompt = await prompt({
    message: 'What is the ending date of the generation? (YYYY-MM-DD)',
    name: 'value',
    type: 'text',
  });

  const number_of_labels: NumberPrompt = await prompt({
    message: 'How many labels do you want to generate in total?',
    name: 'value',
    type: 'numeral',
  });

  const number_of_users: NumberPrompt = await prompt({
    message: 'How many users do you want to generate?',
    name: 'value',
    type: 'numeral',
  });

  console.log(
    info_log('The generation process has started. This may take a while...'),
  );
  console.log(warning_log('Please do not close the terminal window.'));

  /* ----------
   * GTIN data generation
   * ---------- */
  console.log(info_log('GTIN data generation in process...'));
  for (let i = 0; i < gtins.length; i += 1) {
    const data = await generate_gtin_data(gtins[i]);

    if (data) gtin_data.push(data);
  }

  /* ----------
   * Dates generation
   * ---------- */
  console.log(info_log('Dates generation in process...'));
  const dates = get_dates(start_date_prompt.value, end_date_prompt.value);

  /* ----------
   * Labels generation
   * ---------- */
  console.log(info_log('Generating labels...'));
  for (let i = 0; i < number_of_labels.value; i += 1) {
    const label = await generate_label(
      get_date(dates),
      gtin_data[generate_random_int(0, gtin_data.length - 1)],
    );

    if (label) labels.push(label);

    if (i % 25 === 0) {
      console.log(success_log(`Generated ${i * gtin_data.length} labels.`));
    }
  }

  /* ----------
   * Users generation
   * ---------- */
  console.log(info_log('Generating users...'));
  for (let i = 0; i < number_of_users.value; i += 1) {
    const user = await generate_user(gtin_data);

    users.push(user);

    if (i % 25 === 0) {
      console.log(info_log(`Generated ${i} users.`));
    }
  }

  /* ----------
   * Scans generation
   * ---------- */
  console.log(info_log('Generating scans...'));

  let count = 0;

  for (let i = 0; i < labels.length; i += 1) {
    count += 1;

    const params: WriteRecordsCommandInput = {
      DatabaseName: `Polytag-${environment}`,
      TableName: `Polytag-${environment}`,
      Records: [labels[i]],
    };

    const command = new WriteRecordsCommand(params);

    commands.push(command);

    if (i % 25 === 0)
      console.log(success_log(`Generated ${count} label scans.`));
  }

  for (let i = 0; i < users.length; i += 1) {
    const scan = await generate_qr_scan(
      get_date(dates),
      get_gtin_data(gtin_data),
      users[i],
    );

    count += 1;

    const params: WriteRecordsCommandInput = {
      DatabaseName: `Polytag-${environment}`,
      TableName: `Polytag-${environment}`,
      Records: scan,
    };

    const command = new WriteRecordsCommand(params);

    commands.push(command);

    if (i % 25 === 0) console.log(info_log(`Generated ${count} qr scans.`));
  }

  /* ----------
   * Scans writting
   * ---------- */
  const chunks = _.chunk(commands, 125);

  console.log(info_log('Writing scans to timestream...'));
  for (let i = 0; i < chunks.length; i += 1) {
    try {
      await Promise.all(
        chunks[i].map(command => clients.timestream_write.send(command)),
      );

      console.log(
        success_log(`Successfully wrote ${chunks[i].length} records`),
      );
      console.log(
        info_log(`${commands.length - chunks[i].length * i} records remaining`),
      );
    } catch (error) {
      console.log(error_log(error));
    }
  }

  report.users = users.length;
  report.labels.total = labels.length;
  report.labels.scanned = users.length;
  report.labels.not_scanned = labels.length - users.length;
  report.start_date = start_date_prompt.value;
  report.end_date = end_date_prompt.value;

  console.log(success_log('Successfully wrote all records to timestream'));
  console.log(info_log('Generating report...'));
  console.log(success_log(JSON.stringify(report, null, 2)));
};

export { write_timestream_data };
