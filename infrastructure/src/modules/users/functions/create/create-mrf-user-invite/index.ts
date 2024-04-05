/* ---------- External ---------- */
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Modules ---------- */
import { RCUserInvite } from '_modules/users/models/rc-user-invite';

/* ---------- Types ---------- */
interface CreateMRFUserInviteInput {
  email: string;
  sub: string;
  mrf_id: string;
  role: string;
}

/* ---------- Function ---------- */
const create_mrf_user_invite = async ({
  email,
  sub,
  mrf_id,
  role,
}: CreateMRFUserInviteInput) => {
  const invite_item: RCUserInvite = {
    partition_key: `mrf#${mrf_id}`,
    sort_key: email,
    email,
    role,
    datatype: 'mrf-invite',
    filter: `mrf-invitation#${email}`,
    created_by: sub,
    created_at: Date.now(),
    updated_at: Date.now(),
    mrf_id,
  };

  const put_params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: invite_item,
  };

  const command = new PutCommand(put_params);

  await dynamodb_documentclient.send(command);
};

// This is a test

/* ---------- Export ---------- */
export { create_mrf_user_invite };
