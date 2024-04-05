/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Utils ---------- */
import { decode_last_key } from '_helpers/database/decode-last-key';
import { encode_last_key } from '_helpers/database/encode-last-key';

/* ---------- Models ---------- */
import { BrandDomain } from '_modules/brand-domains/models';

/* ---------- Interfaces ---------- */
interface GetAllBrandDomainsInput {
  brand_id: string;
  last_key?: string;
}

/* ---------- Function ---------- */
const get_all_brand_domains = async ({
  brand_id,
  last_key,
}: GetAllBrandDomainsInput) => {
  const decoded_last_key = decode_last_key({ last_key });

  const exclusive_start_key = decoded_last_key && {
    datatype: 'brand-domain',
    partition_key: `brand#${brand_id}`,
    sort_key: decoded_last_key.sort_key,
  };

  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-pk-index',
    KeyConditionExpression:
      'datatype = :datatype AND partition_key = :partition_key',
    ExpressionAttributeValues: {
      ':datatype': 'brand-domain',
      ':partition_key': `brand#${brand_id}`,
    },
    ExclusiveStartKey: exclusive_start_key,
  };

  const command = new QueryCommand(params);

  const { Items, LastEvaluatedKey } = await dynamodb_documentclient.send(
    command,
  );

  const last_evaluated_key = encode_last_key({
    last_evaluated_key: LastEvaluatedKey,
    preserve: ['sort_key'],
  });

  return {
    last_evaluated_key,
    brand_domains: Items as BrandDomain[],
  };
};

/* ---------- Export ---------- */
export { get_all_brand_domains };
