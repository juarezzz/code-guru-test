/* ---------- External ---------- */
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Types ---------- */
import { OnboardingStep } from '_modules/users/models/user';

/* ---------- Interfaces ---------- */
interface UpdateUserOnboardingStepsInput {
  steps: OnboardingStep[];
  brand_id: string;
  user_sub: string;
  action: 'add' | 'delete' | 'set';
}

/* ---------- Function ---------- */
const update_user_onboarding_steps = async ({
  brand_id,
  user_sub,
  steps,
  action,
}: UpdateUserOnboardingStepsInput) => {
  const params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    ConditionExpression:
      'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: `brand-user#${user_sub}`,
    },
    ExpressionAttributeNames: {
      '#partition_key': 'partition_key',
      '#sort_key': 'sort_key',
    },
    UpdateExpression: `${action.toUpperCase()} onboarding_steps_completed :steps`,
    ExpressionAttributeValues: {
      ':steps': new Set(steps),
    },
  };

  const command = new UpdateCommand(params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { update_user_onboarding_steps };
