/* ---------- External ---------- */
import { v4 as uuidv4 } from 'uuid';
import { PutCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { LabelsRequest } from '_modules/label/models/labels-request';

/* ---------- Interfaces ---------- */
interface CreateLabelsRequestInput {
  sub: string;
  gtin: string;
  format: string;
  brand_id: string;
  reference?: string;
  printer_id: string;
  batches_count: number;
  labels_amount: number;
}

/* ---------- Function ---------- */
const create_labels_request = async ({
  sub,
  format,
  brand_id,
  gtin,
  reference,
  printer_id,
  batches_count,
  labels_amount,
}: CreateLabelsRequestInput) => {
  const batches_info: Record<string, boolean> = {};

  new Array(batches_count).fill(0).forEach((_, index) => {
    batches_info[`batch-${index}`] = false;
  });

  const labels_request: LabelsRequest = {
    format,
    reference,
    brand_id,
    gtin,
    batches_info,
    labels_amount,
    created_by: sub,
    status: 'PENDING',
    datatype: 'printer-labels-request',
    created_at: new Date().getTime(),
    partition_key: `printer#${printer_id}`,
    sort_key: `printer-labels-request#${uuidv4()}`,
  };

  const params: PutCommandInput = {
    TableName: process.env.LABELS_TABLE_NAME,
    Item: labels_request,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return { labels_request };
};

/* ---------- Export ---------- */
export { create_labels_request };
