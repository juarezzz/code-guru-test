/* ---------- External ---------- */
import { CfnUserPoolGroup } from 'aws-cdk-lib/aws-cognito';

/* ---------- Groups ---------- */
export interface Groups {
  admin: CfnUserPoolGroup;
  super_admin: CfnUserPoolGroup;
}
