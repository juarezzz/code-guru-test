/* ---------- External ---------- */
import { GetCommand, GetCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { ThirdParty } from '_modules/third-party/models';

/* ---------- Interfaces ---------- */
interface GetThirdPartyByIdInput {
  third_party_id: string;
}

/* ---------- Function ---------- */
const get_third_party_by_id = async ({
  third_party_id,
}: GetThirdPartyByIdInput) => {
  const params: GetCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `third-party#${third_party_id}`,
      sort_key: 'third-party',
    },
  };

  const command = new GetCommand(params);

  const { Item } = await dynamodb_documentclient.send(command);

  if (!Item) return { third_party: undefined };

  return {
    third_party: Item as ThirdParty,
  };
};

/* ---------- Export ---------- */
export { get_third_party_by_id };
