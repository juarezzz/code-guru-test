/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  LambdaIntegration,
  Resource,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Lambdas ---------- */
import { StartPipePutLambda } from '_pipeline-stack/lambdas/RestAPI/start-pipe/PUT';

/* ---------- Constructs ---------- */
import { S3Buckets } from '_pipeline-stack/constructs/S3Buckets';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  rest_api: RestApi;
  s3_buckets: S3Buckets;
}

export class StartPipeResource extends Construct {
  public readonly put: StartPipePutLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('start-pipe');

    /* ---------- Lambdas ---------- */
    this.put = new StartPipePutLambda(
      scope,
      `StartPipePut-Lambda-${props.environment}-Pipeline`,
      {
        environment: props.environment,
        s3_buckets: props.s3_buckets,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'PUT',
      new LambdaIntegration(this.put.function, { allowTestInvoke: false }),
    );

    /* ---------- Tags ---------- */
    Tags.of(this.put.function).add('Custom:Service', 'Lambda');
    Tags.of(this.put.function).add('Custom:Event', 'Start Pipeline');
    Tags.of(this.put.function).add('Custom:Environment', props.environment);
  }
}
