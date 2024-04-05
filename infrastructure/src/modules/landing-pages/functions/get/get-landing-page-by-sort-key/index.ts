/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Model ---------- */
import { LandingPage } from '_modules/landing-pages/models';

/* ---------- Interfaces ---------- */
interface GetLandingPageBySortKey {
  brand_id: string;
  landing_page_sort_key: string;
}

/* ---------- Function ---------- */
const get_landing_page_by_sort_key = async ({
  brand_id,
  landing_page_sort_key,
}: GetLandingPageBySortKey) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression:
      'sort_key = :sort_key AND partition_key = :partition_key',
    ExpressionAttributeValues: {
      ':sort_key': landing_page_sort_key,
      ':partition_key': `brand#${brand_id}`,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items || Items.length === 0) return { landing_page: undefined };

  return { landing_page: Items[0] as LandingPage };
};

/* ---------- Export ---------- */
export { get_landing_page_by_sort_key };
