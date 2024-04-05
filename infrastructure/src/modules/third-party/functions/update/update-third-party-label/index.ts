/* ---------- External ---------- */
import { PutCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Label } from '_modules/label/models';

/* ---------- Interfaces ---------- */
export interface ThirdParties {
  third_party_id: string;
  redeemed_at: number;
  confirmed_at: number;
  status: string;
}

export interface UpdateThirdPartyLabel {
  label: Label;
}

/* ---------- Function ---------- */
const update_third_party_label = async ({ label }: UpdateThirdPartyLabel) => {
  const update_third_party_label_command = new PutCommand({
    TableName: process.env.TABLE_NAME,
    Item: label,
  });

  await dynamodb_documentclient.send(update_third_party_label_command);
};

export { update_third_party_label };
