/* ---------- External ---------- */
import { StreamRecord } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { CampaignToLandingPageAssociation } from '_modules/landing-pages/models/campaign-to-landing-page-association';

/* ---------- Modules ---------- */
import { get_landing_page_by_sort_key } from '_modules/landing-pages/functions/get/get-landing-page-by-sort-key';

/* ---------- Interfaces ---------- */
interface HandleCampaignToLandingPageDissociationInput {
  item: StreamRecord;
}

/* ---------- Functions ---------- */
const handle_campaign_to_landing_page_dissociation = async ({
  item,
}: HandleCampaignToLandingPageDissociationInput) => {
  try {
    const { OldImage } = item;

    if (!OldImage) return;

    const record = unmarshall(
      OldImage as Record<string, AttributeValue>,
    ) as CampaignToLandingPageAssociation;

    const { partition_key, sort_key } = record;

    const brand_id = partition_key.replace('brand#', '');
    const landing_page_sort_key = sort_key.split('brand-campaign#')[0];

    /* ----------
     * 1. Fetching information about the landing page
     * ---------- */
    const landing_page = await get_landing_page_by_sort_key({
      brand_id,
      landing_page_sort_key,
    });

    if (!landing_page) return;

    /* ----------
     * 2. Decreasing the landing page's campaigns count
     * ---------- */
    const params: UpdateCommandInput = {
      ConditionExpression:
        'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
      Key: {
        partition_key: `brand#${brand_id}`,
        sort_key: landing_page_sort_key,
      },
      ExpressionAttributeNames: {
        '#sort_key': 'sort_key',
        '#partition_key': 'partition_key',
      },
      ExpressionAttributeValues: {
        ':incr': -1,
      },
      TableName: process.env.TABLE_NAME,
      UpdateExpression: 'ADD campaigns_count :incr',
    };

    const command = new UpdateCommand(params);

    await dynamodb_documentclient.send(command);
  } catch (err) {
    console.error('error at handle_campaign_to_landing_page_dissociation:');
    console.error(err);
  }
};

/* ---------- Exports ---------- */
export { handle_campaign_to_landing_page_dissociation };
