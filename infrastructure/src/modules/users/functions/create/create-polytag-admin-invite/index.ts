/* ---------- External ---------- */
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Types ---------- */
export interface CreatePolytagAdminInviteInput {
  email: string;
  cognito_group: string;
  sub: string;
}

/* ---------- Function ---------- */
const create_polytag_admin_invite = async ({
  email,
  cognito_group,
  sub,
}: CreatePolytagAdminInviteInput) => {
  const put_params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: {
      partition_key: `admin`,
      sort_key: `admin-invite#${email}`,
      email,
      cognito_group,
      datatype: 'admin-invite',
      created_by: sub,
      created_at: Date.now(),
      updated_at: Date.now(),
    },
  };

  const command = new PutCommand(put_params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { create_polytag_admin_invite };
