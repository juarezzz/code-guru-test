/* ---------- External ---------- */
import { PutCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Brand } from '_modules/brands/models';

/* ---------- Interfaces ---------- */
interface CreateBrandInput {
  pk?: string;
  sub: string;
  industry: string;
  brand_name: string;
  gs1_territory: string;
  organisation_size: string;
}

/* ---------- Function ---------- */
const create_brand = async ({
  pk,
  sub,
  industry,
  brand_name,
  gs1_territory,
  organisation_size,
}: CreateBrandInput) => {
  const brand: Brand = {
    brand_name,
    industry,
    logo_url: '',
    gs1_territory,
    created_by: sub,
    datatype: 'brand',
    sort_key: 'brand',
    products_count: 0,
    landing_pages_count: 0,
    campaigns_count: 0,
    product_group_count: 0,
    organisation_size,
    updated_at: new Date().getTime(),
    created_at: new Date().getTime(),
    partition_key: pk || `brand#${uuidv4()}`,
    search: `brand#${brand_name.replace(/\s/g, '_')}`,
  };

  const params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: brand,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return { brand };
};

/* ---------- Export ---------- */
export { create_brand };
