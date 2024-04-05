/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { DisplayPage } from '_modules/display-page/models';

/* ---------- Interfaces ---------- */
interface GetDisplayPagesByGTINInput {
  gtin: string;
  last_key?: Record<string, unknown> | undefined;
}

interface GetDisplayPagesByGTINOutput {
  display_pages: DisplayPage[];
  last_evaluated_key?: Record<string, unknown> | undefined;
}

/* ---------- Function ---------- */
const get_display_pages_by_gtin = async ({
  gtin,
}: GetDisplayPagesByGTINInput): Promise<GetDisplayPagesByGTINOutput> => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-sk-index',
    KeyConditionExpression:
      'datatype = :datatype AND begins_with(sort_key, :sort_key_prefix)',
    ExpressionAttributeValues: {
      ':datatype': 'brand-display-page',
      ':sort_key_prefix': `brand-display-page#${gtin}#`,
    },
  };

  const command = new QueryCommand(params);

  const { Items, LastEvaluatedKey } = await dynamodb_documentclient.send(
    command,
  );

  if (!Items?.length)
    return { display_pages: [], last_evaluated_key: undefined };

  return {
    display_pages: Items as DisplayPage[],
    last_evaluated_key: LastEvaluatedKey,
  };
};

/* ---------- Export ---------- */
export { get_display_pages_by_gtin };
