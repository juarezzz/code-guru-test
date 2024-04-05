/* ---------- External ---------- */
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { ThirdParty } from '_modules/third-party/models';

/* ---------- Interfaces ---------- */
interface CreateThirdPartyInput {
  third_party_name: string;
  sub: string;
  partition_key?: string;
}

const create_third_party = async ({
  third_party_name,
  sub,
  partition_key,
}: CreateThirdPartyInput) => {
  const third_party: ThirdParty = {
    datatype: 'third-party',
    created_at: new Date().getTime(),
    created_by: sub,
    third_party_name,
    partition_key: partition_key || `third-party#${uuidv4()}`,
    sort_key: 'third-party',
    updated_at: new Date().getTime(),
    search: `third-party-name#${third_party_name
      .replace(/\s/g, '_')
      .toLocaleLowerCase()}`,
  };

  const params: PutCommandInput = {
    Item: third_party,
    TableName: process.env.TABLE_NAME,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return third_party;
};

/* ---------- Export ---------- */
export { create_third_party };
