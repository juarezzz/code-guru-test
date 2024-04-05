/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyEvent,
} from 'aws-lambda';
import {
  MeasureValueType,
  TimeUnit,
  _Record,
} from '@aws-sdk/client-timestream-write';
import {
  SendMessageCommand,
  SendMessageCommandInput,
} from '@aws-sdk/client-sqs';

/* ---------- Clients ---------- */
import { sqs_client } from '_clients/sqs';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

/**
 * @description Sends a message to a sqs queue to create a record for the lambda metrics.
  Don't forget to include the queue url as an env variable and to add the necessary sqs policies to the lambda.
 */
export const log_lambda_metrics = async (
  ev: Event,
  handler: (event: Event) => Promise<APIGatewayProxyStructuredResultV2>,
) => {
  const execution_start = Date.now();

  const result = (await handler(ev)) as APIGatewayProxyStructuredResultV2;

  try {
    if (ev.source && ev.source === 'aws.events') return result;

    const {
      requestContext: { requestTimeEpoch, requestId, path, httpMethod },
    } = ev as unknown as APIGatewayProxyEvent;

    const response_duration = Date.now() - requestTimeEpoch;
    const execution_duration = Date.now() - execution_start;

    const log_item: _Record = {
      Time: String(requestTimeEpoch),
      TimeUnit: TimeUnit.MILLISECONDS,
      MeasureName: 'third_party_duration',
      MeasureValue: String(response_duration),
      MeasureValueType: MeasureValueType.BIGINT,
      Dimensions: [
        {
          Name: 'handler_duration',
          Value: String(execution_duration),
        },
        {
          Name: 'response_status',
          Value: String(result.statusCode),
        },
        {
          Name: 'request_id',
          Value: requestId,
        },
        {
          Name: 'resource_path',
          Value: path,
        },
        {
          Name: 'http_method',
          Value: httpMethod,
        },
      ],
    };

    const params: SendMessageCommandInput = {
      MessageBody: JSON.stringify({ log_item }),
      QueueUrl: process.env.QUEUE_URL,
      DelaySeconds: 0,
    };

    const command = new SendMessageCommand(params);

    await sqs_client.send(command, { requestTimeout: 500 });

    return result;
  } catch (error) {
    console.error('Error at logging wrapper: ', error);
    return result;
  }
};
