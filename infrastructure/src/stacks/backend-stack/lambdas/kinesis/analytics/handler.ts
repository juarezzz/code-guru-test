/* ---------- External ---------- */
import { KinesisStreamEvent } from 'aws-lambda';
import {
  _Record,
  WriteRecordsCommand,
  WriteRecordsCommandInput,
  RejectedRecordsException,
} from '@aws-sdk/client-timestream-write';

/* ---------- Clients ---------- */
import { timestream_client_write } from '_clients/timestream';

/* ---------- Interfaces ---------- */
interface RecordPayloadQRScan {
  time?: number;
  version: number;
  time_spent: number;
  request_id: string;
}

interface RecordPayloadUVScan {
  gtin: string;
  count: number;
  mrf_id: string;
}

interface MapQRScanEntry {
  record: _Record;
  version: number;
}

/* ---------- Constants ---------- */
const QR_SCAN_FORBIDDEN_DIMENSIONS = ['time', 'time_spent', 'version'];

export const handler = async (event: KinesisStreamEvent) => {
  try {
    const ts_records: _Record[] = [];
    const scan_events_map: Map<string, MapQRScanEntry> = new Map();

    console.info('Received records:', JSON.stringify(event.Records, null, 2));

    event.Records.forEach(record => {
      const payload = Buffer.from(record.kinesis.data, 'base64').toString(
        'utf8',
      );

      const data: Record<string, unknown> = JSON.parse(payload);

      const partition_key = record.kinesis.partitionKey;

      if (partition_key.startsWith('qr-scan#')) {
        const typed_data = data as unknown as RecordPayloadQRScan;

        if (!typed_data.time_spent || !typed_data.version) return;

        const most_recent_version =
          scan_events_map.get(typed_data.request_id)?.version || 0;

        if (typed_data.version <= most_recent_version) return;

        const filtered_raw_object = Object.entries(typed_data).filter(
          ([key, value]) =>
            key?.length &&
            value !== null &&
            value !== undefined &&
            !QR_SCAN_FORBIDDEN_DIMENSIONS.includes(key),
        );

        const dimensions = filtered_raw_object.map(([key, value]) => {
          let parsed_value = String(value);

          if (typeof value === 'object') {
            parsed_value = JSON.stringify(value);
          }

          return {
            Name: key,
            Value: parsed_value,
          };
        });

        const filtered_dimensions = dimensions.filter(
          ({ Value }) => Value.length,
        );

        const scan_time = Number.isNaN(typed_data.time)
          ? String(new Date().getTime())
          : String(typed_data.time);

        const ts_record: _Record = {
          Time: scan_time,
          Dimensions: filtered_dimensions,
          MeasureName: 'landing-page-scan',
          Version: Number(typed_data.version),
          MeasureValue: String(typed_data.time_spent),
        };

        scan_events_map.set(typed_data.request_id, {
          record: ts_record,
          version: typed_data.version,
        });
      } else if (partition_key === 'uv-scans') {
        const typed_data = data as unknown as RecordPayloadUVScan;

        if (!typed_data.count || !typed_data.gtin || !typed_data.mrf_id) return;

        const ts_record: _Record = {
          Dimensions: [
            { Name: 'gtin', Value: typed_data.gtin },
            { Name: 'mrf_id', Value: typed_data.mrf_id },
          ],
          Time: String(new Date().getTime()),
          MeasureValue: String(typed_data.count),
          MeasureName: 'uv-scans',
        };

        ts_records.push(ts_record);
      }
    });

    scan_events_map.forEach(({ record }) => {
      ts_records.push(record);
    });

    const params: WriteRecordsCommandInput = {
      DatabaseName: process.env.TIMESTREAM_NAME,
      TableName: process.env.TIMESTREAM_NAME,
      Records: ts_records,
      CommonAttributes: {
        MeasureValueType: 'BIGINT',
        TimeUnit: 'MILLISECONDS',
      },
    };

    const write_command = new WriteRecordsCommand(params);

    if (write_command.input.Records?.length) {
      await timestream_client_write.send(write_command);
    }
  } catch (error) {
    console.error('Error at kinesis_analytics_handler:');

    // Handling records rejected because of lower version
    if (error instanceof RejectedRecordsException) {
      const all_version_exceptions = error.RejectedRecords?.every(
        ({ Reason }) =>
          Reason?.toLowerCase().includes('a higher version is required'),
      );

      if (all_version_exceptions) {
        const records_indexes = error.RejectedRecords?.map(
          ({ RecordIndex }) => RecordIndex,
        );

        console.error(
          `Records ${
            records_indexes?.join(', ') || '(not available)'
          } are outdated.`,
        );

        return;
      }
    }

    console.error(error);

    throw error;
  }
};
