/* ---------- External ---------- */
import { GetCommand, GetCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { BrandDomain } from '_modules/brand-domains/models';

/* ---------- Interfaces ---------- */
interface GetBrandDomainInput {
  brand_id: string;
  domain: string;
}

/* ---------- Function ---------- */
const get_brand_domain = async ({ brand_id, domain }: GetBrandDomainInput) => {
  const params: GetCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: `brand-domain#${domain}`,
    },
  };

  const command = new GetCommand(params);

  const { Item } = await dynamodb_documentclient.send(command);

  if (!Item)
    return {
      brand_domain: undefined,
    };

  return {
    brand_domain: Item as BrandDomain,
  };
};

/* ---------- Export ---------- */
export { get_brand_domain };
