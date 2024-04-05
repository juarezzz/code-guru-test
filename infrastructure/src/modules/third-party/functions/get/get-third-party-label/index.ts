/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Label } from '_modules/label/models';

/* ---------- Interfaces ---------- */
interface GetThirdPartyLabelInput {
  gtin: string;
  serial: string;
  table_name?: string;
}

/* ---------- Function ---------- */
const get_third_party_label = async ({
  gtin,
  serial,
  table_name,
}: GetThirdPartyLabelInput) => {
  const params: QueryCommandInput = {
    TableName: table_name ?? process.env.TABLE_NAME,
    IndexName: 'datatype-sk-index',
    KeyConditionExpression: 'datatype = :datatype AND sort_key = :sort_key',
    ExpressionAttributeValues: {
      ':datatype': 'brand-label',
      ':sort_key': `brand-product#${gtin}serial#${serial}`,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items) return { third_party_label: null };

  return { third_party_label: Items[0] as Label };
};

/* ---------- Export ---------- */
export { get_third_party_label };
