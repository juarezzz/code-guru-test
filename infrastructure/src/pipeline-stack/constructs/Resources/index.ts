/* ---------- External ---------- */
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

/* ---------- Resources ---------- */
import { GithubResource } from '_pipeline-stack/constructs/Resources/github';
import { StartPipeResource } from '_pipeline-stack/constructs/Resources/start-pipe';

/* ---------- Constructs ---------- */
import { S3Buckets } from '_pipeline-stack/constructs/S3Buckets';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  rest_api: RestApi;
  s3_buckets: S3Buckets;
  inspector_lambda_arn: string;
  scheduler_role_arn: string;
}

export class Resources extends Construct {
  public readonly github_resource: GithubResource;

  public readonly start_pipe_resource: StartPipeResource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.github_resource = new GithubResource(
      scope,
      `Github-Resource-${props.environment}-Pipeline`,
      {
        rest_api: props.rest_api,
        environment: props.environment,
        s3_buckets: props.s3_buckets,
        inspector_lambda_arn: props.inspector_lambda_arn,
        scheduler_role_arn: props.scheduler_role_arn,
      },
    );

    this.start_pipe_resource = new StartPipeResource(
      scope,
      `StartPipe-Resource-${props.environment}-Pipeline`,
      {
        rest_api: props.rest_api,
        environment: props.environment,
        s3_buckets: props.s3_buckets,
      },
    );
  }
}
