/* ---------- External ---------- */
import { Construct } from 'constructs';

/* ---------- Lambdas ---------- */
import { LogMetricsLambda } from '_stacks/diagnostics-stack/lambdas/sqs/logs';

/* ---------- Constructs ---------- */
import { SQSConstruct } from '_stacks/diagnostics-stack/constructs/SQS';
import { TimestreamConstruct } from '_stacks/diagnostics-stack/constructs/Timestream';

/* ---------- Helpers ---------- */
import { add_inspector_tags_to_function } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  sqs_construct: SQSConstruct;
  timestream_contruct: TimestreamConstruct;
}

interface Lambdas {
  sqs: {
    log_metrics_lambda: LogMetricsLambda;
  };
}

export class LambdasConstruct extends Construct {
  public readonly lambdas: Lambdas;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.lambdas = {
      sqs: {
        log_metrics_lambda: new LogMetricsLambda(
          scope,
          `SQS-Log-Metrics-LambdaConstruct-${props.environment}`,
          {
            environment: props.environment,
            sqs_construct: props.sqs_construct,
            timestream_construct: props.timestream_contruct,
          },
        ),
      },
    };

    if (props.environment !== 'STG')
      add_inspector_tags_to_function(
        this.lambdas.sqs.log_metrics_lambda.function,
      );
  }
}
