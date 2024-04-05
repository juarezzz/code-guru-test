/* ---------- External ---------- */
import { PutCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { BrandDomain } from '_modules/brand-domains/models';

/* ---------- Interfaces ---------- */
interface CreateBrandDomainInput {
  domain: string;
  status: string;
  brand_id: string;
}

/* ---------- Function ---------- */
const create_brand_domain = async ({
  domain,
  status,
  brand_id,
}: CreateBrandDomainInput) => {
  const new_domain: BrandDomain = {
    domain,
    status,
    datatype: 'brand-domain',
    created_at: new Date().getTime(),
    partition_key: `brand#${brand_id}`,
    sort_key: `brand-domain#${domain}`,
  };

  const params: PutCommandInput = {
    Item: new_domain,
    TableName: process.env.TABLE_NAME,
    ConditionExpression:
      'attribute_not_exists(#sort_key) AND attribute_not_exists(#partition_key)',
    ExpressionAttributeNames: {
      '#sort_key': 'sort_key',
      '#partition_key': 'partition_key',
    },
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return new_domain;
};

/* ---------- Export ---------- */
export { create_brand_domain };
