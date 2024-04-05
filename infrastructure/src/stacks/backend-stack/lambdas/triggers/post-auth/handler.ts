/* -------------- External -------------- */
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import {
  Context,
  Callback,
  PostAuthenticationTriggerEvent,
  PostAuthenticationTriggerHandler,
} from 'aws-lambda';

/* -------------- Clients -------------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

export const handler: PostAuthenticationTriggerHandler = async (
  event: PostAuthenticationTriggerEvent,
  _: Context,
  callback: Callback,
): Promise<void> => {
  try {
    const user_id = event.userName;
    const mrf_id = event.request.userAttributes['custom:mrf_id'];
    const brand_id = event.request.userAttributes['custom:brand_id'];

    if (!mrf_id && !brand_id) return callback(null, event);

    const update_parameters: Partial<UpdateCommandInput> = {
      TableName: process.env.TABLE_NAME,
      UpdateExpression: 'SET last_login = :last_login',
      ConditionExpression:
        'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
      ExpressionAttributeNames: {
        '#partition_key': 'partition_key',
        '#sort_key': 'sort_key',
      },
      ExpressionAttributeValues: { ':last_login': new Date().getTime() },
    };

    if (mrf_id) {
      update_parameters.Key = {
        partition_key: `mrf#${mrf_id}`,
        sort_key: `mrf-user#${user_id}`,
      };
    }

    if (brand_id) {
      update_parameters.Key = {
        partition_key: `brand#${brand_id}`,
        sort_key: `brand-user#${user_id}`,
      };
    }

    const update_command = new UpdateCommand(
      update_parameters as UpdateCommandInput,
    );

    await dynamodb_documentclient.send(update_command);
  } catch (err) {
    console.error(`error at post-auth-trigger:`, err);
  }

  return callback(null, event);
};
