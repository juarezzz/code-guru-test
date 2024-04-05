/* ---------- External ---------- */
import { UpdateCommandInput, UpdateCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface UpdateLabelsRequestBatchInfoInput {
  printer_id: string;
  request_id: string;
  complete?: boolean;
  batch_index: number;
}

/* ---------- Function ---------- */
const update_labels_request_batch_info = async ({
  printer_id,
  request_id,
  batch_index,
  complete = true,
}: UpdateLabelsRequestBatchInfoInput) => {
  const params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `printer#${printer_id}`,
      sort_key: `printer-labels-request#${request_id}`,
    },
    UpdateExpression: 'SET batches_info.#batch_index = :complete',
    ExpressionAttributeNames: {
      '#batch_index': `batch-${batch_index}`,
    },
    ExpressionAttributeValues: {
      ':complete': complete,
    },
  };

  const command = new UpdateCommand(params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { update_labels_request_batch_info };
