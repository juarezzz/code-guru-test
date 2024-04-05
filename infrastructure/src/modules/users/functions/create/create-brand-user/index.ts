/* ---------- External ---------- */
import { PutCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import {
  User,
  BrandUserRole,
  OnboardingStep,
} from '_modules/users/models/user';

/* ---------- Interfaces ---------- */
interface CreateBrandUserInput {
  brand_id: string;
  sub: string;
  steps?: Set<OnboardingStep> | Array<OnboardingStep>;
  role?: BrandUserRole;
  full_name?: string;
  email?: string;
  job_title?: string;
}

/* ---------- Function ---------- */
const create_brand_user = async ({
  brand_id,
  sub,
  email,
  full_name,
  job_title,
  role,
  steps = [],
}: CreateBrandUserInput) => {
  const completed_steps = new Set([...steps] as const);

  const user: User = {
    created_at: new Date().getTime(),
    datatype: 'brand-account',
    partition_key: `brand#${brand_id}`,
    sort_key: `brand-user#${sub}`,
    updated_at: new Date().getTime(),
    status: 'ACTIVE',
    email,
    filter: `brand-invitation#${email}`,
    full_name,
    job_title,
    role,
  };

  if (completed_steps.size) {
    user.onboarding_steps_completed = completed_steps;
  }

  const params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: user,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return {
    user: {
      ...user,
      onboarding_steps_completed: [...steps],
    } as User,
  };
};

/* ---------- Export ---------- */
export { create_brand_user };
