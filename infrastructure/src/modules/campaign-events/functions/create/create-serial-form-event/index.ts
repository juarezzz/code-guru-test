/* ---------- External ---------- */
import { PutCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { CampaignFormEvent } from '_modules/campaign-events/models';

/* ---------- Interfaces ---------- */
interface CreateCampaignFormEventInput {
  brand_id: string;
  campaign_id: string;
  email: string;
  gtin: string;
  serial: string;
  campaign_name: string;
  landing_page_name: string;
  product_name: string;
  checkboxes: Array<{
    label: string;
    checked: boolean;
    mandatory: boolean;
  }>;
}

/* ---------- Function ---------- */
const create_serial_form_event = async ({
  brand_id,
  campaign_id,
  email,
  gtin,
  serial,
  campaign_name,
  landing_page_name,
  product_name,
  checkboxes,
}: CreateCampaignFormEventInput) => {
  const new_event: CampaignFormEvent = {
    partition_key: `brand#${brand_id}`,
    sort_key: `campaign-event#${campaign_id}#form-event-serial#${serial}`,
    datatype: 'campaign-event',
    created_at: new Date().getTime(),
    email,
    campaign_id,
    gtin,
    serial,
    campaign_name,
    landing_page_name,
    product_name,
    checkboxes,
  };

  const params: PutCommandInput = {
    Item: new_event,
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

  return new_event;
};

/* ---------- Export ---------- */
export { create_serial_form_event };
