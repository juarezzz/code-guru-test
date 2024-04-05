/* ---------- External ---------- */
import {
  DeleteCommand,
  DeleteCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Modules ---------- */
import { get_campaign_by_sort_key } from '_modules/campaigns/functions/get/get-campaign-by-sort-key';

/* ---------- Interfaces ---------- */
interface DissociateProductGroupFromCampaignInput {
  brand_id: string;
  campaign_sort_key: string;
  product_group_sort_key: string;
}

/* ---------- Function ---------- */
const dissociate_product_group_from_campaign = async ({
  brand_id,
  campaign_sort_key,
  product_group_sort_key,
}: DissociateProductGroupFromCampaignInput) => {
  const promises: Promise<unknown>[] = [];

  /* ----------
   * Fetch the product group index
   * in the campaign's database entry
   * ---------- */
  const product_group_campaign = await get_campaign_by_sort_key({
    brand_id,
    campaign_sort_key,
  });

  /* ----------
   * Remove the group from the list, if found
   * ---------- */
  if (product_group_campaign?.campaign_product_groups) {
    const group_index =
      product_group_campaign.campaign_product_groups.findIndex(
        ({ product_group_sort_key: current_pg_sk }) =>
          current_pg_sk === product_group_sort_key,
      );

    if (group_index !== -1) {
      const update_campaign_pgs_params: UpdateCommandInput = {
        TableName: process.env.TABLE_NAME,
        ConditionExpression:
          'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
        Key: {
          partition_key: `brand#${brand_id}`,
          sort_key: campaign_sort_key,
        },
        UpdateExpression: `REMOVE campaign_product_groups[${group_index}]`,
        ExpressionAttributeNames: {
          '#sort_key': 'sort_key',
          '#partition_key': 'partition_key',
        },
      };

      const update_campaign_pgs_command = new UpdateCommand(
        update_campaign_pgs_params,
      );

      promises.push(dynamodb_documentclient.send(update_campaign_pgs_command));
    }
  }

  /* ----------
   * Delete product associations to the group
   * ---------- */
  const association_sort_key = `${campaign_sort_key}${product_group_sort_key}`;

  const delete_association_params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      sort_key: association_sort_key,
      partition_key: `brand#${brand_id}`,
    },
  };

  const delete_association_command = new DeleteCommand(
    delete_association_params,
  );

  promises.push(dynamodb_documentclient.send(delete_association_command));

  await Promise.all(promises);
};

/* ---------- Export ---------- */
export { dissociate_product_group_from_campaign };
