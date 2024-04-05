/* ---------- External ---------- */
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from 'aws-sdk';

/* ---------- Types ---------- */
import { Handler } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/@types';

/* ---------- Modules ---------- */
import { get_campaign_by_sort_key } from '_modules/campaigns/functions/get/get-campaign-by-sort-key';
import { get_product_group_by_sort_key } from '_modules/product-groups/functions/get/get-product-group-by-sort-key';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Types ---------- */
import { ProductGroupToCampaignAssociation } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/product-group-to-campaign/@types';

export const handle_product_group_to_campaign_association: Handler = async ({
  item,
}) => {
  try {
    const { NewImage } = item;

    if (!NewImage) return;

    const record = DynamoDB.Converter.unmarshall(
      NewImage,
    ) as ProductGroupToCampaignAssociation;

    const { partition_key, sort_key } = record;

    const brand_id = partition_key.replace('brand#', '');
    const campaign_sort_key = sort_key.split('brand-product-group#')[0];
    const product_group_sort_key = `brand-product-group#${
      sort_key.split('brand-product-group#')[1]
    }`;

    const product_group = await get_product_group_by_sort_key({
      brand_id,
      product_group_sort_key,
    });

    const campaign = await get_campaign_by_sort_key({
      brand_id,
      campaign_sort_key,
    });

    if (!product_group || !campaign) return;

    const params: UpdateCommandInput = {
      ConditionExpression:
        'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
      Key: {
        partition_key: `brand#${brand_id}`,
        sort_key: product_group_sort_key,
      },
      TableName: process.env.TABLE_NAME,
      UpdateExpression:
        'SET assigned_campaign_name = :assigned_campaign_name, assigned_campaign_sort_key = :assigned_campaign_sort_key',
      ExpressionAttributeValues: {
        ':assigned_campaign_name': campaign.campaign_name,
        ':assigned_campaign_sort_key': campaign.sort_key,
      },
      ExpressionAttributeNames: {
        '#partition_key': 'partition_key',
        '#sort_key': 'sort_key',
      },
    };

    const command = new UpdateCommand(params);

    await dynamodb_documentclient.send(command);
  } catch (err) {
    console.log('handle_product_group_to_campaign_association error: ', err);
  }
};
