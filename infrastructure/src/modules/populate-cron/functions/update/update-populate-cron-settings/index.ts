/* ---------- External ---------- */
import { PutCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { PopulateCronSettings } from '_modules/populate-cron/models';

/* ---------- Interfaces ---------- */
interface UpdatePopulateCronInput {
  settings: {
    mrf_id: string;
    enabled: boolean;
    monthly_values: PopulateCronSettings['monthly_values'];
  };
}

/* ---------- Function ---------- */
const update_cron_settings = async ({ settings }: UpdatePopulateCronInput) => {
  const settings_item: PopulateCronSettings = {
    partition_key: 'admin',
    sort_key: 'populate-cron-settings',
    datatype: 'populate-cron-settings',
    enabled: settings.enabled,
    monthly_values: settings.monthly_values,
    mrf_id: settings.mrf_id,
  };

  const params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: settings_item,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return settings_item;
};

/* ---------- Export ---------- */
export { update_cron_settings };
