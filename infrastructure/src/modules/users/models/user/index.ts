/* ---------- Types ---------- */
export type BrandUserStatus = 'ACTIVE' | 'LOCKED';

export type BrandUserRole = 'brand-admin' | 'brand-editor' | 'brand-analyst';

export type OnboardingStep =
  | 'create_brand'
  | 'upload_products'
  | 'invite_colleagues'
  | 'check_printer'
  | 'create_landing_page'
  | 'create_campaign';

/* ---------- Interfaces ---------- */
interface UserInterface {
  partition_key: string;
  sort_key: string;
  datatype: string;
  created_at: number;
  updated_at: number;
  last_login?: number;
  role?: BrandUserRole;
  full_name?: string;
  email?: string;
  job_title?: string;
  status: BrandUserStatus;
  onboarding_steps_completed?: Set<OnboardingStep> | Array<OnboardingStep>;
}

export class User implements UserInterface {
  partition_key: string;

  sort_key: string;

  datatype: string;

  created_at: number;

  updated_at: number;

  last_login?: number;

  role?: BrandUserRole;

  full_name?: string;

  email?: string;

  filter: string;

  job_title?: string;

  status: BrandUserStatus;

  onboarding_steps_completed?: Set<OnboardingStep> | Array<OnboardingStep>;
}
