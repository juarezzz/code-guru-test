/* ---------- External ---------- */
import { GetCommandInput, GetCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { CampaignsSnapshot } from '../../models';

/* ---------- Function ---------- */
const get_campaigns_snapshot = async () => {
  const params: GetCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: 'campaigns-snapshot',
      sort_key: 'campaigns-snapshot',
    },
  };

  const command = new GetCommand(params);

  const { Item } = await dynamodb_documentclient.send(command);

  return Item as CampaignsSnapshot | undefined;
};

/* ---------- Export ---------- */
export { get_campaigns_snapshot };
