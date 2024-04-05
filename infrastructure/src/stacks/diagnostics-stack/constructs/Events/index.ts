/* ---------- External ---------- */
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

/* ---------- Constructs ---------- */
import { LayersConstruct } from '_stacks/diagnostics-stack/constructs/Layers';
import { BucketsConstruct } from '_stacks/diagnostics-stack/constructs/Buckets';

/* ---------- Types ---------- */
import {
  Lambdas,
  Rules,
} from '_stacks/diagnostics-stack/constructs/Events/@types';

/* ---------- Events ---------- */
import { PingEventLambda } from '_stacks/diagnostics-stack/lambdas/events/ping-event';
import { AlarmEventLambda } from '_stacks/diagnostics-stack/lambdas/events/alarm-event';
import { CampaignsHealthcheckEventLambda } from '_stacks/diagnostics-stack/lambdas/events/campaigns-healthcheck-event';
import { UVScansAlarmEventLambda } from '_stacks/diagnostics-stack/lambdas/events/uv-scans-alarm-event';

/* ---------- Helpers ---------- */
import { add_inspector_tags_to_function } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  layers_construct: LayersConstruct;
  buckets_construct: BucketsConstruct;
}

export class ScheduledEventsConstruct extends Construct {
  public readonly lambdas: Lambdas;

  public readonly rules: Rules;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Lambdas ---------- */
    this.lambdas = {
      ping_event: new PingEventLambda(
        scope,
        `SheduledEvents-PingEventLambda-Construct-${props.environment}`,
        {
          environment: props.environment,
          layers: props.layers_construct.layers,
          buckets_construct: props.buckets_construct,
        },
      ),
      alarm_event: new AlarmEventLambda(
        scope,
        `SheduledEvents-AlarmEventLambda-Construct-${props.environment}`,
        {
          environment: props.environment,
        },
      ),
      healthcheck_event: new CampaignsHealthcheckEventLambda(
        scope,
        `SheduledEvents-CampaignsHealthcheckEventLambda-Construct-${props.environment}`,
        { environment: props.environment },
      ),
      uv_scans_healthcheck_event: new UVScansAlarmEventLambda(
        scope,
        `SheduledEvents-UVScansHealthcheckEventLambda-Construct-${props.environment}`,
        { environment: props.environment },
      ),
    };

    /* ---------- Schedule Rules ---------- */
    this.rules = {
      ping_event_rule: new Rule(
        scope,
        `Event-Ping-EventRule-${props.environment}`,
        {
          ruleName: `Event-PingEventRule-${props.environment}`,
          schedule: Schedule.cron({ hour: '8', minute: '0' }), // everyday at 8AM UTC time
          targets: [new LambdaFunction(this.lambdas.ping_event.function)],
          enabled: props.environment === 'PROD',
        },
      ),
      alarm_event_rule: new Rule(
        scope,
        `Event-Alarm-EventRule-${props.environment}`,
        {
          ruleName: `Event-Alarm-EventRule-${props.environment}`,
          schedule: Schedule.cron({ minute: '0', hour: '0/1' }), // every hour
          targets: [new LambdaFunction(this.lambdas.alarm_event.function)],
          enabled: props.environment === 'PROD',
        },
      ),
      healthcheck_event_rule: new Rule(
        scope,
        `Event-Healthcheck-EventRule-${props.environment}`,
        {
          ruleName: `Event-HealthcheckEventRule-${props.environment}`,
          schedule: Schedule.cron({ hour: '8,13', minute: '0' }), // everyday at 8AM and 1PM UTC time
          targets: [
            new LambdaFunction(this.lambdas.healthcheck_event.function),
          ],
          enabled: props.environment === 'PROD',
        },
      ),
      uv_scans_healthcheck_event_rule: new Rule(
        scope,
        `Event-UV-Scans-Healthcheck-EventRule-${props.environment}`,
        {
          ruleName: `Event-UV-Scans-HealthcheckEventRule-${props.environment}`,
          schedule: Schedule.cron({ minute: '0', hour: '0/1' }), // every hour
          targets: [
            new LambdaFunction(
              this.lambdas.uv_scans_healthcheck_event.function,
            ),
          ],
          enabled: false,
        },
      ),
    };

    if (props.environment !== 'STG')
      Object.values(this.lambdas).forEach(lambda =>
        add_inspector_tags_to_function(
          (lambda as { function: NodejsFunction }).function,
        ),
      );
  }
}
