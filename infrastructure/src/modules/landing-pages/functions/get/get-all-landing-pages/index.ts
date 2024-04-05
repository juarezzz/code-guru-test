/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { LandingPage } from '_modules/landing-pages/models';

/* ---------- Utils ---------- */
import { decode_last_key } from '_helpers/database/decode-last-key';
import { encode_last_key } from '_helpers/database/encode-last-key';

/* ---------- Interfaces ---------- */
export interface GetAllLandingPages {
  brand_id: string;
  last_key?: string;
}

/* ---------- Function ---------- */
const get_all_landing_pages = async ({
  brand_id,
  last_key,
}: GetAllLandingPages) => {
  const decoded_last_key = decode_last_key({ last_key });

  const exclusive_start_key = decoded_last_key && {
    datatype: 'brand-landing-page',
    partition_key: `brand#${brand_id}`,
    sort_key: decoded_last_key.sort_key,
  };

  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-pk-index',
    KeyConditionExpression:
      'partition_key = :partition_key AND datatype = :datatype',
    ExpressionAttributeValues: {
      ':partition_key': `brand#${brand_id}`,
      ':datatype': 'brand-landing-page',
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
    landing_pages: Items as LandingPage[],
  };
};

/* ---------- Export ---------- */
export { get_all_landing_pages };
