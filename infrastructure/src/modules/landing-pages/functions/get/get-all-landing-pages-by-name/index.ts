/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Model ---------- */
import { LandingPage } from '_modules/landing-pages/models';

/* ---------- Interface ---------- */
interface GetAllLandingPagesByName {
  brand_id: string;
  landing_page_name: string;
}

/* ---------- Function ---------- */
const get_all_landing_pages_by_name = async ({
  brand_id,
  landing_page_name,
}: GetAllLandingPagesByName) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'search-pk-index',
    KeyConditionExpression:
      '#partition_key = :partition_key AND begins_with(#search, :search)',
    ExpressionAttributeValues: {
      ':partition_key': `brand#${brand_id}`,
      ':search': `brand-landing-page#${landing_page_name
        .replace(/\s/g, '_')
        .toLocaleLowerCase()}`,
    },
    ExpressionAttributeNames: {
      '#partition_key': 'partition_key',
      '#search': 'search',
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  return { landing_pages: Items as LandingPage[] };
};

/* ---------- Export ---------- */
export { get_all_landing_pages_by_name };
