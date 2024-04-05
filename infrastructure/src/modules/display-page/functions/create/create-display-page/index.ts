/* ---------- External ---------- */
import { PutCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { DisplayPage } from '_modules/display-page/models';

/* ---------- Interfaces ---------- */
interface CreateDisplayPageInput {
  brand_id: string;
  campaign_id: string;
  landing_page_id: string;
  product_group_id: string;
  product_id: string;
  start_date?: string;
  end_date?: string;
}

/* ---------- Function ---------- */
const create_display_page = async ({
  brand_id,
  campaign_id,
  landing_page_id,
  product_group_id,
  product_id,
  start_date,
  end_date,
}: CreateDisplayPageInput) => {
  const unix_start_date = new Date(`${start_date}T00:00:00.000Z`);
  const unix_end_date = new Date(`${end_date}T23:59:59.999Z`);

  const date_identifier = `${unix_start_date
    ?.toISOString()
    .split('T')[0]
    ?.replace(/\D/g, '')}${unix_end_date
    ?.toISOString()
    .split('T')[0]
    ?.replace(/\D/g, '')}`;

  const new_display_page: DisplayPage = {
    partition_key: `brand#${brand_id}`,
    sort_key: `brand-display-page#${product_id}#${date_identifier}`,
    datatype: 'brand-display-page',
    campaign_id,
    created_at: Date.now(),
    landing_page_id,
    product_group_id,
    product_id,
    runs_until: unix_end_date.getTime(),
    starts_on: unix_start_date.getTime(),
  };

  const params: PutCommandInput = {
    Item: new_display_page,
    TableName: process.env.TABLE_NAME,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return new_display_page;
};

/* ---------- Export ---------- */
export { create_display_page };
