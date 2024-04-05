/* ---------- External ---------- */
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import {
  BackupPlan,
  BackupPlanRule,
  BackupVault,
  BackupResource,
} from 'aws-cdk-lib/aws-backup';
import { Schedule } from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';

/* ---------- Constructs ---------- */
import { BucketsConstruct } from '_stacks/backend-stack/constructs/Buckets';
import { TimestreamConstruct } from '_stacks/backend-stack/constructs/Timestream';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  buckets_construct: BucketsConstruct;
  timestream_construct: TimestreamConstruct;
}

export class BackupsConstruct extends Construct {
  public readonly timestream_backup_warm_storage_plan_rule: BackupPlanRule;

  public readonly timestream_backup_cold_storage_plan_rule: BackupPlanRule;

  public readonly timestream_backup_vault: BackupVault;

  public readonly timestream_backup_release_plan: BackupPlan;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);
    /* ----------
     * Rules
     * ---------- */
    this.timestream_backup_warm_storage_plan_rule = new BackupPlanRule({
      // Runs every 6 hours
      ruleName: `TimestreamBackupPlanRuleWarmStorage-${props.environment}`,
      deleteAfter: Duration.days(7),
      scheduleExpression: Schedule.cron({
        minute: '0',
        hour: '*/6',
      }),
    });

    this.timestream_backup_cold_storage_plan_rule = new BackupPlanRule({
      // Runs every Thursday at midnight
      ruleName: `TimestreamBackupPlanRuleColdStorage-${props.environment}`,
      moveToColdStorageAfter: Duration.days(1),
      deleteAfter: Duration.days(91),
      scheduleExpression: Schedule.cron({
        minute: '0',
        weekDay: '5',
        hour: '0',
      }),
    });

    /* ----------
     * Vaults
     * ---------- */
    this.timestream_backup_vault = new BackupVault(
      scope,
      `TimestreamBackupVault-${props.environment}`,
      {
        backupVaultName: `TimestreamBackupVault-${props.environment}`,
        removalPolicy: RemovalPolicy.RETAIN,
      },
    );

    /* ----------
     * Plans
     * ---------- */
    this.timestream_backup_release_plan = new BackupPlan(
      scope,
      `TimestreamBackupPlan-Release-${props.environment}`,
      {
        backupPlanName: `TimestreamBackupPlan-Release-${props.environment}`,
        backupPlanRules: [
          this.timestream_backup_warm_storage_plan_rule,
          this.timestream_backup_cold_storage_plan_rule,
        ],
        backupVault: this.timestream_backup_vault,
      },
    );

    this.timestream_backup_release_plan.addSelection(
      `TimestreamBackupPlan-Release-Selection-${props.environment}`,
      {
        resources: [
          BackupResource.fromArn(
            props.timestream_construct.tables.main_table.attrArn,
          ),
        ],
      },
    );
  }
}
