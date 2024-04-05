/* ---------- External ---------- */
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Label } from '_modules/label/models';

/* ---------- Interfaces ---------- */
interface CreateLabel {
  gtin: string;
  sub: string;
  brand_id: string;
  serial: string;
}

const create_label = async ({ brand_id, gtin, serial, sub }: CreateLabel) => {
  const label: Label = {
    partition_key: `brand#${brand_id}`,
    sort_key: `brand-product#${gtin}serial#${serial}`,
    printed: false,
    timetolive: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 * 5,
    datatype: 'brand-label',
    created_at: Date.now(),
    created_by: sub,
    third_parties: [],
  };

  const params: PutCommandInput = {
    Item: label,
    TableName: process.env.TABLE_NAME,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return { label };
};

/* ---------- Export ---------- */
export { create_label };
