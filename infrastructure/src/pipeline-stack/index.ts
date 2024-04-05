/* ---------- External ---------- */
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/* ---------- Constructs ---------- */
import { Pipelines } from '_pipeline-stack/constructs/Pipelines';
import { RestAPI } from '_pipeline-stack/constructs/RestAPI';
import { S3Buckets } from '_pipeline-stack/constructs/S3Buckets';
import { Route53Construct } from '_pipeline-stack/constructs/Route53';
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { InspectorOutputLambda } from '_pipeline-stack/lambdas/events/inspector-output';
import { DeploymentNotificationLambda } from '_pipeline-stack/lambdas/events/deployment-notification';

/* ---------- Interfaces ---------- */
interface Props extends StackProps {
  environment: string;
  stack_name: string;
}

interface Lambdas {
  inspector_output_lambda: InspectorOutputLambda;
}

interface Roles {
  event_scheduler_role: Role;
}

/* ---------- Class ---------- */
class PolytagPipelineStack extends Stack {
  public readonly lambdas: Lambdas;

  public readonly roles: Roles;

  public readonly pipelines: Pipelines;

  public readonly rest_api: RestAPI;

  public readonly route_53_construct: Route53Construct;

  public readonly s3_buckets: S3Buckets;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    this.s3_buckets = new S3Buckets(this, 'S3Buckets', {
      environment: props.environment,
    });

    this.pipelines = new Pipelines(
      this,
      `Pipelines-${props.environment}-PIPE`,
      {
        environment: props.environment,
        s3_buckets: this.s3_buckets,
      },
    );

    this.route_53_construct = new Route53Construct(
      this,
      `Route53-Construct-${props.environment}-PIPE`,
      {
        environment: props.environment,
      },
    );

    this.lambdas = {
      inspector_output_lambda: new InspectorOutputLambda(
        this,
        `Inspector-Output-Lambda-${props.environment}`,
        {
          environment: props.environment,
          s3_buckets: this.s3_buckets,
        },
      ),
    };

    this.roles = {
      event_scheduler_role: new Role(
        this,
        `CodeBuildRole-${props.environment}`,
        {
          assumedBy: new ServicePrincipal('scheduler.amazonaws.com'),
          description: 'Role for EventBridge Scheduler to access AWS resources',
        },
      ),
    };

    this.roles.event_scheduler_role.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['lambda:InvokeFunction'],
        resources: ['*'],
      }),
    );

    this.rest_api = new RestAPI(
      this,
      `RestAPI-${props.environment}-PIPE-Construct`,
      {
        route_53_construct: this.route_53_construct,
        environment: props.environment,
        s3_buckets: this.s3_buckets,
        inspector_lambda_arn:
          this.lambdas.inspector_output_lambda.function.functionArn,
        scheduler_role_arn: this.roles.event_scheduler_role.roleArn,
      },
    );

    new DeploymentNotificationLambda(
      this,
      `DeploymentNotificationLambda-Function-${props.environment}-Construct`,
      { environment: props.environment },
    );
  }
}

/* ---------- Exports ---------- */
export { PolytagPipelineStack };
