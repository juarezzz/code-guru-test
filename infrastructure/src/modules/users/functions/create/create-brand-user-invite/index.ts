/* ---------- External ---------- */
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface CreateBrandUserInviteInput {
  email: string;
  brand_id: string;
  roles: string[];
  sub: string;
}

/* ---------- Function ---------- */
const create_brand_user_invite = async ({
  email,
  brand_id,
  roles,
  sub,
}: CreateBrandUserInviteInput) => {
  const put_params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: {
      partition_key: `brand#${brand_id}`,
      sort_key: email,
      email,
      roles,
      datatype: 'brand-invite',
      filter: `brand-invitation#${email}`,
      created_by: sub,
      created_at: Date.now(),
    },
  };

  const command = new PutCommand(put_params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { create_brand_user_invite };
