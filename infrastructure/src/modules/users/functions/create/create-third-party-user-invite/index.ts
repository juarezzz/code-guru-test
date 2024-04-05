/* ---------- External ---------- */
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Modules ---------- */
import { ThirdPartyUserInvite } from '_modules/users/models/third-party-invite';

/* ---------- Types ---------- */
interface CreateThirdPartyUserInviteInput {
  email: string;
  sub: string;
  third_party_id: string;
  third_party_groups: string[];
}

/* ---------- Function ---------- */
const create_third_party_user_invite = async ({
  email,
  sub,
  third_party_id,
  third_party_groups,
}: CreateThirdPartyUserInviteInput) => {
  const invite_item: ThirdPartyUserInvite = {
    partition_key: 'admin',
    sort_key: `third-party-user-invite#${email}`,
    email,
    datatype: 'third-party-user-invite',
    created_by: sub,
    created_at: Date.now(),
    updated_at: Date.now(),
    third_party_id,
    third_party_groups,
  };

  const put_params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: invite_item,
  };

  const command = new PutCommand(put_params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { create_third_party_user_invite };
