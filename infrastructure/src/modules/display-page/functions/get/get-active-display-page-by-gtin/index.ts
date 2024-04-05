/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { DisplayPage } from '_modules/display-page/models';

/* ---------- Interfaces ---------- */
interface GetActiveDisplayPageByGTINInput {
  gtin: string;
}

/* ---------- Function ---------- */
const get_active_display_page_by_gtin = async ({
  gtin,
}: GetActiveDisplayPageByGTINInput) => {
  const current_date = new Date().getTime();

  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-sk-index',
    KeyConditionExpression:
      'datatype = :datatype AND begins_with(sort_key, :sort_key_prefix)',
    FilterExpression:
      'starts_on <= :current_date AND runs_until >= :current_date',
    ExpressionAttributeValues: {
      ':datatype': 'brand-display-page',
      ':sort_key_prefix': `brand-display-page#${gtin}#`,
      ':current_date': current_date,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items || Items.length === 0) return { display_page: null };

  return { display_page: Items[0] as DisplayPage };
};

/* ---------- Export ---------- */
export { get_active_display_page_by_gtin };
