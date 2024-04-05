/* ---------- External ---------- */
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

/* ---------- Types ---------- */
import {
  Lambdas,
  Rules,
} from '_stacks/backend-stack/constructs/CloudWatch/@types';

/* ---------- Events ---------- */
import { BackupEventLambda } from '_stacks/backend-stack/lambdas/cloudwatch/backup-event';

/* ---------- Helpers ---------- */
import { add_inspector_tags_to_function } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
}

export class CloudWatchConstruct extends Construct {
  public readonly lambdas: Lambdas;

  public readonly rules: Rules;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Lambdas ---------- */
    this.lambdas = {
      backup_event: new BackupEventLambda(
        scope,
        `Cloudwatch-BackupEventLambda-Construct-${props.environment}`,
        {
          environment: props.environment,
        },
      ),
    };

    /* ---------- Schedule Rules ---------- */
    this.rules = {
      backup_event_rule: new Rule(
        scope,
        `Cloudwatch-Backup-EventRule-${props.environment}`,
        {
          ruleName: `Cloudwatch-BackupEventRule-${props.environment}`,
          schedule: Schedule.cron({ minute: '0', weekDay: '5', hour: '0' }), // every thursday at midnight
          targets: [new LambdaFunction(this.lambdas.backup_event.function)],
        },
      ),
    };

    /* ---------- Tags ---------- */
    if (props.environment !== 'STG')
      add_inspector_tags_to_function(this.lambdas.backup_event.function);
  }
}
