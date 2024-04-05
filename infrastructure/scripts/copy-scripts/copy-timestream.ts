/* ---------- External ---------- */
import {
  paginateListObjectsV2,
  ListObjectsCommandInput,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import chalk from 'chalk';
import { Readable } from 'stream';
import {
  WriteRecordsCommand,
  _Record,
  MeasureValueType,
  TimeUnit,
} from '@aws-sdk/client-timestream-write';

/* ---------- Helpers ---------- */
import { stream_to_string } from '_helpers/general/stream-to-string';

/* ---------- Types ---------- */
import { Clients } from '__scripts/@types';
import { EnvironmentEnum } from './@types';

/* ---------- Logs helpers ---------- */
const info_log = chalk.bold.blueBright;
const note_log = chalk.bold.yellowBright;
const warning_log = chalk.bold.redBright;

/* ---------- Types ---------- */
type RowObject = Record<string, string>;

/* ---------- Constants ---------- */
const BATCH_SIZE = 5;
const ROWS_PER_INSERT = 100;

/* ---------- Functions ---------- */
const batchInsertRows = async (
  dumps_keys: string[],
  source_bucket: string,
  target_database: string,
  target_table: string,
  clients: Clients,
) => {
  const rows_promises = dumps_keys.map(key => {
    const get_command = new GetObjectCommand({ Bucket: source_bucket, Key: key });

    return clients.s3_client.send(get_command);
  });

  const rows_contents = await Promise.all(rows_promises);

  const parsed_rows_contents: RowObject[][] = (
    await Promise.all(
      rows_contents.map(({ Body }) => {
        if (!Body) return '[]';

        return stream_to_string(Body as Readable);
      }),
    )
  ).map(unparsed_string => JSON.parse(unparsed_string));

  for (const row_object_list of parsed_rows_contents) {
    const parsed_records: _Record[] = row_object_list.map(row_object => {
      const filtered_dimensions_list = Object.entries(row_object).filter(
        ([key]) => !['measure_name', 'measure_value::varchar', 'time'].includes(key),
      );

      return {
        Dimensions: filtered_dimensions_list.map(([key, value]) => ({
          Name: key,
          Value: value,
        })),
        MeasureName: row_object.measure_name,
        MeasureValue: row_object['measure_value::varchar'],
        MeasureValueType: MeasureValueType.VARCHAR,
        Time: String(new Date(row_object.time).getTime()),
        TimeUnit: TimeUnit.MILLISECONDS,
      };
    });

    const grouped_rows: _Record[][] = [];
    for (let index = 0; index < parsed_records.length; index += ROWS_PER_INSERT) {
      const rows_batch = parsed_records.slice(index, index + ROWS_PER_INSERT);

      grouped_rows.push(rows_batch);
    }

    const write_promises = grouped_rows.map(group => {
      const write_command = new WriteRecordsCommand({
        DatabaseName: target_database,
        TableName: target_table,
        Records: group,
      });

      return clients.timestream_write_client.send(write_command);
    });

    await Promise.all(write_promises);
  }
};

export const handleCopyTimestream = async (
  from: EnvironmentEnum,
  to: EnvironmentEnum,
  clients: Clients,
) => {
  try {
    const source_bucket = `polytag-${from.toLowerCase()}-backup-bucket`;
    const target_database = `Polytag-${to}`;
    const target_table = `Polytag-${to}`;

    const list_objects_input: ListObjectsCommandInput = {
      Bucket: source_bucket,
      Prefix: 'timestream/',
    };

    console.log(info_log(`Copying backuped data to the Timestream table ${target_table}`));
    console.log(note_log('Reminder: only data present in the backup bucket will be copied'));

    console.log(info_log('\nListing available backup files...\n'));

    const list_objects_result = paginateListObjectsV2(
      { client: clients.s3_client },
      list_objects_input,
    );

    const dumps_keys_list: string[] = [];
    for await (const page of list_objects_result) {
      const current_keys_list = page.Contents?.map(
        current_object => current_object.Key,
      ) as string[];

      const filtered_keys_list = current_keys_list.filter(key => key.endsWith('.json'));

      dumps_keys_list.push(...(filtered_keys_list || []));
    }

    for (let index = 0; index < dumps_keys_list.length; index += BATCH_SIZE) {
      const keys_batch = dumps_keys_list.slice(index, index + BATCH_SIZE);

      await batchInsertRows(keys_batch, source_bucket, target_database, target_table, clients);
    }

    console.log(note_log('\nSuccessfully copied the data!'));
  } catch (error) {
    console.log(warning_log('An error happened while cloning the table.'));
    console.log(warning_log(error));
  }
};
