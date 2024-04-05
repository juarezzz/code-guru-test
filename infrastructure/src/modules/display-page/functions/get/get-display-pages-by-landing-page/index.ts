/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { DisplayPage } from '_modules/display-page/models';

/* ---------- Interfaces ---------- */
interface GetBrandDisplayPagesByLandingPageInput {
  brand_id: string;
  landing_page_sort_key: string;
  last_key?: Record<string, unknown> | undefined;
}

interface GetBrandDisplayPagesByLandingPageOutput {
  display_pages: DisplayPage[];
  last_evaluated_key: Record<string, unknown> | undefined;
}

/* ---------- Function ---------- */
const get_brand_display_pages_by_landing_page = async ({
  brand_id,
  last_key,
  landing_page_sort_key,
}: GetBrandDisplayPagesByLandingPageInput): Promise<GetBrandDisplayPagesByLandingPageOutput> => {
  const landing_page_id = landing_page_sort_key.split('#')[1];

  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression:
      'partition_key = :partition_key AND begins_with(sort_key, :sort_key_prefix)',
    FilterExpression: 'landing_page_id = :landing_page_id',
    ExpressionAttributeValues: {
      ':partition_key': `brand#${brand_id}`,
      ':sort_key_prefix': 'brand-display-page#',
      ':landing_page_id': landing_page_id,
    },
    ExclusiveStartKey: last_key,
  };

  const command = new QueryCommand(params);

  const { Items, LastEvaluatedKey } = await dynamodb_documentclient.send(
    command,
  );

  if (!Items?.length) {
    return { display_pages: [], last_evaluated_key: undefined };
  }

  return {
    display_pages: Items as DisplayPage[],
    last_evaluated_key: LastEvaluatedKey,
  };
};

/* ---------- Export ---------- */
export { get_brand_display_pages_by_landing_page };
