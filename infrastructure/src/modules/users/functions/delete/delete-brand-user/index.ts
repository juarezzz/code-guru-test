/* ---------- External ---------- */
import {
  AdminDeleteUserCommand,
  AdminDeleteUserCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import { DeleteCommand, DeleteCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { User } from '_modules/users/models/user';

/* ---------- Interfaces ---------- */
export interface DeleteBrandUser {
  brand_id: string;
  brand_user_id: string;
}

/* ---------- Function ---------- */
export const delete_brand_user = async ({
  brand_id,
  brand_user_id,
}: DeleteBrandUser) => {
  const dynamo_params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: `brand-user#${brand_user_id}`,
    },
    ReturnValues: 'ALL_OLD',
  };

  const cognito_params: AdminDeleteUserCommandInput = {
    Username: brand_user_id,
    UserPoolId: process.env.COGNITO_USERPOOL_ID,
  };

  const dynamo_delete_command = new DeleteCommand(dynamo_params);
  const cognito_delete_command = new AdminDeleteUserCommand(cognito_params);

  const [{ Attributes }] = await Promise.all([
    dynamodb_documentclient.send(dynamo_delete_command),
    cognito_client.send(cognito_delete_command),
  ]);

  return { brand_user: Attributes as User };
};
