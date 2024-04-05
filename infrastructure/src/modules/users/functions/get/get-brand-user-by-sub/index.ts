/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { User, OnboardingStep } from '_modules/users/models/user';

/* ---------- Types ---------- */
interface GetBrandUserBySubInput {
  sub: string;
  brand_id: string;
}

interface GetBrandUserBySubOutput {
  user?: Omit<User, 'onboarding_steps_completed'> & {
    onboarding_steps_completed: Array<OnboardingStep>;
  };
}

/* ---------- Function ---------- */
const get_brand_user_by_sub = async ({
  sub,
  brand_id,
}: GetBrandUserBySubInput): Promise<GetBrandUserBySubOutput> => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression:
      'partition_key = :partition_key AND sort_key = :sort_key',
    ExpressionAttributeValues: {
      ':partition_key': `brand#${brand_id}`,
      ':sort_key': `brand-user#${sub}`,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items?.[0]) return { user: undefined };

  const user = Items[0] as User;

  user.onboarding_steps_completed = Array.from(
    user.onboarding_steps_completed || [],
  );

  return { user } as GetBrandUserBySubOutput;
};

/* ---------- Export ---------- */
export { get_brand_user_by_sub };
