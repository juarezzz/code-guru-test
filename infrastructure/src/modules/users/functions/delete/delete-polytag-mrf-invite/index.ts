/* ---------- External ---------- */
import { DeleteCommandInput, DeleteCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface DeletePolytagMrfInviteInput {
  email: string;
  mrf_id: string;
}

/* ---------- Function ---------- */
const delete_polytag_mrf_invite = async ({
  email,
  mrf_id,
}: DeletePolytagMrfInviteInput) => {
  const params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `mrf#${mrf_id}`,
      sort_key: email,
    },
  };

  const command = new DeleteCommand(params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { delete_polytag_mrf_invite };
