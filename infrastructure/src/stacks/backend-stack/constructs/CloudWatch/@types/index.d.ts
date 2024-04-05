/* ---------- EXternal ---------- */
import { Rule } from 'aws-cdk-lib/aws-events';

/* ---------- Events ---------- */
import { BackupEventLambda } from '_stacks/backend-stack/lambdas/cloudwatch/backup-event';

/* ---------- Interfaces ---------- */
export interface Lambdas {
  backup_event: BackupEventLambda;
}

export interface Rules {
  backup_event_rule: Rule;
}
