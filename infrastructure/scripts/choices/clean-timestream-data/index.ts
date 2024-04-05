/* ---------- External ---------- */
import {
  CreateTableCommand,
  CreateTableCommandInput,
  DeleteTableCommand,
  DeleteTableCommandInput,
} from '@aws-sdk/client-timestream-write';

/* ---------- Clients ---------- */
import { clients } from '__scripts/utils/clients';

/* ---------- Interfaces ---------- */
interface CleanTimestreamData {
  environment: string;
}

export const clean_timestream_data = async ({
  environment,
}: CleanTimestreamData) => {
  const delete_table_params: DeleteTableCommandInput = {
    DatabaseName: `Polytag-${environment}`,
    TableName: `Polytag-${environment}`,
  };

  const create_table_params: CreateTableCommandInput = {
    DatabaseName: `Polytag-${environment}`,
    TableName: `Polytag-${environment}`,
    MagneticStoreWriteProperties: {
      EnableMagneticStoreWrites: true,
    },
    RetentionProperties: {
      MagneticStoreRetentionPeriodInDays: 10 * 365,
      MemoryStoreRetentionPeriodInHours: 24,
    },
  };

  const delete_table_command = new DeleteTableCommand(delete_table_params);
  const create_table_command = new CreateTableCommand(create_table_params);

  try {
    await clients.timestream_write.send(delete_table_command);
  } catch (err) {
    console.log('Table does not exist');
  }

  try {
    await clients.timestream_write.send(create_table_command);
  } catch (err) {
    console.log(err);
  }
};
