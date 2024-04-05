/* ---------- External ---------- */
import { PutCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { CampaignsSnapshot } from '../../models';

/* ---------- Interfaces ---------- */
interface CreateCampaignsSnapshotInput {
  campaigns_data: CampaignsSnapshot['campaigns_data'];
}

/* ---------- Function ---------- */
const create_campaigns_snapshot = async ({
  campaigns_data,
}: CreateCampaignsSnapshotInput) => {
  const params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: {
      partition_key: 'campaigns-snapshot',
      sort_key: 'campaigns-snapshot',
      created_at: new Date().getTime(),
      campaigns_data,
    },
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { create_campaigns_snapshot };
