/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  LambdaIntegration,
  Resource,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Lambdas ---------- */
import { GithubPOSTLambda } from '_pipeline-stack/lambdas/RestAPI/github/POST';

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

export class GithubResource extends Construct {
  public readonly post: GithubPOSTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('github');

    /* ---------- Lambdas ---------- */
    this.post = new GithubPOSTLambda(
      scope,
      `GithubPOST-Lambda-${props.environment}-Pipeline`,
      {
        environment: props.environment,
        s3_buckets: props.s3_buckets,
        inspector_lambda_arn: props.inspector_lambda_arn,
        scheduler_role_arn: props.scheduler_role_arn,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'POST',
      new LambdaIntegration(this.post.function, { allowTestInvoke: false }),
    );

    /* ---------- Tags ---------- */
    Tags.of(this.post.function).add('Custom:Service', 'Lambda');
    Tags.of(this.post.function).add('Custom:Action', 'Github');
    Tags.of(this.post.function).add('Custom:Event', 'Github');
    Tags.of(this.post.function).add('Custom:Environment', props.environment);
  }
}
