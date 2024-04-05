/* ---------- External ---------- */
import {
  AdminAddUserToGroupCommand,
  AdminAddUserToGroupCommandInput,
  SignUpCommand,
  SignUpCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { ThirdPartyUser } from '_modules/users/models/third-party-user';

/* ---------- Interfaces ---------- */
interface CreateThirdPartyUserInput {
  third_party_id: string;
  email: string;
  password: string;
  third_party_groups: string[];
  created_by: string;
}

/* ---------- Function ---------- */
const create_third_party_user = async ({
  email,
  third_party_id,
  password,
  third_party_groups,
  created_by,
}: CreateThirdPartyUserInput) => {
  const sign_up_params: SignUpCommandInput = {
    ClientId: process.env.THIRD_PARTY_COGNITO_CLIENT_ID,
    Password: password,
    Username: email,
    UserAttributes: [
      { Name: 'custom:full_name', Value: '' },
      { Name: 'custom:third_party_id', Value: third_party_id },
    ],
  };

  const sign_up_command = new SignUpCommand(sign_up_params);

  const { UserSub } = await cognito_client.send(sign_up_command);

  await Promise.allSettled(
    third_party_groups.map(group => {
      const add_to_group_params: AdminAddUserToGroupCommandInput = {
        GroupName: group,
        UserPoolId: process.env.THIRD_PARTY_COGNITO_USERPOOL_ID,
        Username: UserSub,
      };

      const add_to_group_command = new AdminAddUserToGroupCommand(
        add_to_group_params,
      );

      return cognito_client.send(add_to_group_command);
    }),
  );

  const third_party_user: ThirdPartyUser = {
    created_at: new Date().getTime(),
    datatype: 'third-party-user',
    partition_key: `third-party#${third_party_id}`,
    sort_key: `third-party-user#${UserSub}`,
    updated_at: new Date().getTime(),
    last_login: new Date().getTime(),
    email,
    third_party_groups,
    created_by,
  };

  const params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: third_party_user,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return { third_party_user };
};

/* ---------- Export ---------- */
export { create_third_party_user };
