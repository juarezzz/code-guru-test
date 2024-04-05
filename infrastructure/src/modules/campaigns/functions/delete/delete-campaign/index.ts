/* ---------- External ---------- */
import { DeleteCommandInput, DeleteCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Modules ---------- */
import { Campaign } from '_modules/campaigns/models';

/* ---------- Interface ---------- */
interface DeleteCampaign {
  brand_id: string;
  campaign_sort_key: string;
}

/* ---------- Function ---------- */
const delete_campaign = async ({
  brand_id,
  campaign_sort_key,
}: DeleteCampaign) => {
  const params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: campaign_sort_key,
    },
    ReturnValues: 'ALL_OLD',
  };

  const command = new DeleteCommand(params);

  const { Attributes } = await dynamodb_documentclient.send(command);

  return { campaign: Attributes as Campaign };
};

/* ---------- Export ---------- */
export { delete_campaign };
