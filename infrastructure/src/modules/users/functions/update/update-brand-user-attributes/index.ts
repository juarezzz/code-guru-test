/* ---------- External ---------- */
import {
  AttributeType,
  UpdateUserAttributesCommand,
  UpdateUserAttributesCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface UpdateUserAttributesInput {
  brand_id: string;
  user_sub: string;
  access_token: string;
  update_dynamo?: boolean;
  attributes: AttributeType[];
}

/* ---------- Function ---------- */
const update_brand_user_attributes = async ({
  brand_id,
  user_sub,
  attributes,
  access_token,
  update_dynamo = false,
}: UpdateUserAttributesInput) => {
  const cognito_params: UpdateUserAttributesCommandInput = {
    AccessToken: access_token,
    UserAttributes: attributes,
  };

  const update_expression_attrs = [];
  const update_expression_values: Record<string, unknown> = {};
  const update_expression_names: Record<string, string> = {};

  for (const attr of attributes) {
    const [, ...name_fragments] = attr?.Name?.split(':') || [];

    const attr_name = name_fragments.length
      ? name_fragments.join(':')
      : attr.Name;

    if (!attr_name || !attr?.Value || attr_name === 'brand_id') {
      continue;
    }

    update_expression_attrs.push(attr_name);
    update_expression_values[`:${attr_name}`] = attr.Value;
    update_expression_names[`#${attr_name}`] = attr_name;
  }

  const cognito_command = new UpdateUserAttributesCommand(cognito_params);

  const promises: Promise<unknown>[] = [cognito_client.send(cognito_command)];

  if (update_dynamo && update_expression_attrs.length) {
    const update_expression_fragments = update_expression_attrs.map(
      attr => `#${attr} = :${attr}`,
    );

    const update_expression = `SET ${update_expression_fragments.join(', ')}`;

    update_expression_names['#partition_key'] = 'partition_key';
    update_expression_names['#sort_key'] = 'sort_key';

    const dynamo_command = new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        partition_key: `brand#${brand_id}`,
        sort_key: `brand-user#${user_sub}`,
      },
      ConditionExpression:
        'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
      UpdateExpression: update_expression,
      ExpressionAttributeValues: update_expression_values,
      ExpressionAttributeNames: update_expression_names,
    });

    promises.push(dynamodb_documentclient.send(dynamo_command));
  }

  await Promise.all(promises);
};

/* ---------- Export ---------- */
export { update_brand_user_attributes };
