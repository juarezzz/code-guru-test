/* ---------- External ---------- */
import { DeleteCommandInput, DeleteCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface DeleteBrandDomainInput {
  domain: string;
  brand_id: string;
}

/* ---------- Function ---------- */
const delete_brand_domain = async ({
  domain,
  brand_id,
}: DeleteBrandDomainInput) => {
  const params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: `brand-domain#${domain}`,
    },
    ConditionExpression: '#status <> :primary_status',
    ExpressionAttributeValues: {
      ':primary_status': 'Main domain',
    },
    ExpressionAttributeNames: {
      '#status': 'status',
    },
  };

  const command = new DeleteCommand(params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { delete_brand_domain };
