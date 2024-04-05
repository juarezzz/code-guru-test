/* -------------- External -------------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Context, Callback, ScheduledEvent } from 'aws-lambda';

/* -------------- Clients -------------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* -------------- Messages -------------- */
import { send_healthcheck_alarm_message } from '_stacks/diagnostics-stack/lambdas/events/uv-scans-alarm-event/messages/send-uv-scan-alarm-message';
import { send_internal_error_message } from '_stacks/diagnostics-stack/lambdas/events/uv-scans-alarm-event/messages/send-internal-error-message';

/* -------------- Helpers -------------- */
import { create_error_message } from '_helpers/general/create-error-message';

/* -------------- Iterfaces -------------- */
interface MrfHealthcheck {
  datatype: string;
  last_request: number;
  partition_key: string;
  sort_key: string;
}

/* -------------- Constansts -------------- */
const THRESHOLD = 1000 * 60 * 60 * 2; // 2 hours

export const handler = async (
  event: ScheduledEvent,
  _: Context,
  callback: Callback,
): Promise<void> => {
  try {
    const params: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
      IndexName: 'datatype-index',
      KeyConditionExpression: 'datatype = :datatype',
      ExpressionAttributeValues: {
        ':datatype': `mrf-healthcheck`,
      },
    };

    const command = new QueryCommand(params);

    const { Items } = await dynamodb_documentclient.send(command);

    if (!Items) return callback(null, event);

    for (const healthcheck of Items as MrfHealthcheck[]) {
      const { last_request, partition_key } = healthcheck;
      const mrf_id = partition_key.split('#')[1];
      if (Date.now() - last_request > THRESHOLD)
        await send_healthcheck_alarm_message({ mrf_id, threshold: THRESHOLD });
    }
  } catch (error) {
    console.error(error);
    await send_internal_error_message({
      internal_error_message: create_error_message(JSON.stringify(error)),
    });
  }

  return callback(null, event);
};
