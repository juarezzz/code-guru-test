/* ---------- EXternal ---------- */
import { Rule } from 'aws-cdk-lib/aws-events';

/* ---------- Events ---------- */
import { PingEventLambda } from '_stacks/diagnostics-stack/lambdas/events/ping-event';
import { AlarmEventLambda } from '_stacks/diagnostics-stack/lambdas/events/alarm-event';
import { CampaignsHealthcheckEventLambda } from '_stacks/diagnostics-stack/lambdas/events/campaigns-healthcheck-event';
import { UVScansAlarmEventLambda } from '_stacks/diagnostics-stack/lambdas/events/uv-scans-alarm-event';

/* ---------- Interfaces ---------- */
export interface Lambdas {
  ping_event: PingEventLambda;
  alarm_event: AlarmEventLambda;
  healthcheck_event: CampaignsHealthcheckEventLambda;
  uv_scans_healthcheck_event: UVScansAlarmEventLambda;
}

export interface Rules {
  ping_event_rule: Rule;
  alarm_event_rule: Rule;
  healthcheck_event_rule: Rule;
  uv_scans_healthcheck_event_rule: Rule;
}
