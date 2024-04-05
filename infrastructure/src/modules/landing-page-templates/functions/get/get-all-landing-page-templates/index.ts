/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { LandingPageTemplate } from '_modules/landing-page-templates/models';

/* ---------- Utils ---------- */
import { decode_last_key } from '_helpers/database/decode-last-key';
import { encode_last_key } from '_helpers/database/encode-last-key';

/* ---------- Interfaces ---------- */
interface GetAllLandingPageTemplatesInput {
  last_key?: string;
}

/* ---------- Function ---------- */
const get_all_landing_page_templates = async ({
  last_key,
}: GetAllLandingPageTemplatesInput) => {
  const decoded_last_key = decode_last_key({ last_key });

  const exclusive_start_key = decoded_last_key && {
    datatype: 'landing-page-template',
    sort_key: decoded_last_key.sort_key,
    partition_key: 'admin',
  };

  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-pk-index',
    KeyConditionExpression:
      'partition_key = :partition_key AND datatype = :datatype',
    ExpressionAttributeValues: {
      ':partition_key': 'admin',
      ':datatype': 'landing-page-template',
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
    landing_page_templates: Items as LandingPageTemplate[],
    last_evaluated_key,
  };
};

/* ---------- Export ---------- */
export { get_all_landing_page_templates };
