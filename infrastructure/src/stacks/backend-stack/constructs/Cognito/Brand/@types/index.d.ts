/* ---------- External ---------- */
import { CfnUserPoolGroup } from 'aws-cdk-lib/aws-cognito';

/* ---------- Groups ---------- */
export interface Groups {
  brand_admin: CfnUserPoolGroup;
  brand_user: CfnUserPoolGroup;
  brand_editor: CfnUserPoolGroup;
  brand_analyst: CfnUserPoolGroup;
}
