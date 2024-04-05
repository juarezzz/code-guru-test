/* ---------- External ---------- */
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Types ---------- */
export interface CreatePolytagBrandInviteInput {
  email: string;
  sub: string;
}

/* ---------- Function ---------- */
const create_polytag_brand_invite = async ({
  email,
  sub,
}: CreatePolytagBrandInviteInput) => {
  const put_params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: {
      partition_key: 'admin',
      sort_key: `brand-invite#${email}`,
      email,
      datatype: 'brand-invite',
      filter: `brand-invitation#${email}`,
      created_by: sub,
      created_at: Date.now(),
      updated_at: Date.now(),
    },
  };

  const command = new PutCommand(put_params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { create_polytag_brand_invite };
