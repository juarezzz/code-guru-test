/* ---------- External ---------- */
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface Policy {
  partition_key: string;
  sort_key: string;
  datatype: string;
  policy: {
    Statement: {
      Action: string;
      Effect: string;
      Resource: string[];
      SID: string;
    }[];
    Version: string;
  };
}

interface CreatePolicy {
  policy: Policy;
}

const create_policy = async ({ policy }: CreatePolicy) => {
  const params: PutCommandInput = {
    Item: policy,
    TableName: process.env.TABLE_NAME,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { create_policy };
