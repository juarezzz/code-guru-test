/* ---------- External ---------- */
import { DeleteCommandInput, DeleteCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface DeletePolytagBrandInviteInput {
  email: string;
}

/* ---------- Function ---------- */
const delete_polytag_brand_invite = async ({
  email,
}: DeletePolytagBrandInviteInput) => {
  const params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: 'admin',
      sort_key: `brand-invite#${email}`,
    },
  };

  const command = new DeleteCommand(params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { delete_polytag_brand_invite };
