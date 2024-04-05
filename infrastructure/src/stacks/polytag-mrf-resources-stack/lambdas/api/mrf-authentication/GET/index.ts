/* ---------- External ---------- */
import path from 'path';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Interfaces -------------- */
interface Props {
  cognito_construct: CognitoConstruct;
  environment: string;
  layers_construct: LayersConstruct;
}

export class MrfAuthenticationGETLambda extends Construct {
  public readonly function: NodejsFunction;

  public readonly rule: Rule;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      this,
      `Mrf-Authentication-GET-Function-${props.environment}`,
      {
        bundling: {
          externalModules: ['@aws-sdk/*', 'aws-lambda', 'base-64'],
        },
        entry: path.join(__dirname, 'handler.ts'),
        environment: {
          COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.mrf.userpool_client
              .userPoolClientId,
        },
        functionName: `mrf-authentication-get-${props.environment.toLowerCase()}`,
        handler: 'handler',
        layers: [
          props.layers_construct.layers.aws_lambda,
          props.layers_construct.layers.base_64,
        ],
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        memorySize: 1024,
        runtime: Runtime.NODEJS_18_X,
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['cognito-idp:*'],
        resources: ['*'],
      }),
    );

    this.rule = new Rule(
      scope,
      `Mrf-Authentication-GET-Rule-${props.environment}`,
      {
        ruleName: `mrf-authentication-get-rule-${props.environment.toLowerCase()}`,
        schedule: Schedule.cron({ minute: '*/2' }),
        targets: [new LambdaFunction(this.function)],
      },
    );
  }
}
