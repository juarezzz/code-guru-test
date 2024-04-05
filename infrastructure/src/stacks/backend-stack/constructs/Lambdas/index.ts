/* ---------- External ---------- */
import { Construct } from 'constructs';

/* ---------- Lambdas ---------- */
import { CloudfrontResolverViewerRequestLambda } from '_stacks/backend-stack/lambdas/cloudfront/resolver-viewer-request';
import { CognitoEmailTriggerLambda } from '_stacks/backend-stack/lambdas/triggers/cognito-email';
import { DynamoDBStreamLambda } from '_stacks/backend-stack/lambdas/events/dynamodb-stream';
import { DynamoDBLabelsStreamLambda } from '_stacks/backend-stack/lambdas/events/dynamodb-labels-stream';
import { PoliciesTriggerLambda } from '_stacks/backend-stack/lambdas/triggers/policies';
import { ApiDeploymentTriggerLambda } from '_stacks/backend-stack/lambdas/triggers/api-deployment';
import { PostAuthTriggerLambda } from '_stacks/backend-stack/lambdas/triggers/post-auth';
import { S3StreamLambda } from '_stacks/backend-stack/lambdas/events/s3-stream';
import { PrinterLabelsLambda } from '_stacks/backend-stack/lambdas/events/printer/printer-labels';
import { KinesisAnalyticsLambda } from '_stacks/backend-stack/lambdas/kinesis/analytics';
import { PrinterLabelsRetryLambda } from '_stacks/backend-stack/lambdas/events/printer/printer-labels-retry';

/* ---------- Constructs ---------- */
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';
import { KMSConstruct } from '_stacks/backend-stack/constructs/KMS';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';
import { SQSConstruct } from '_stacks/backend-stack/constructs/SQS';
import { KinesisConstruct } from '_stacks/backend-stack/constructs/Kinesis';
import { MixpanelProxyViewerRequestLambda } from '_stacks/backend-stack/lambdas/cloudfront/mixpanel-proxy-viewer-request';
import { LabelsQueueLambda } from '_stacks/backend-stack/lambdas/events/labels/update-labels';
import { add_inspector_tags_to_function } from '_helpers/general/add-inspector-tags';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  dynamodb_construct: DynamoDBConstruct;
  kinesis_construct: KinesisConstruct;
  sqs_construct: SQSConstruct;
  kms_construct: KMSConstruct;
  layers_construct: LayersConstruct;
  rest_api_id: string;
}

interface Lambdas {
  triggers: {
    cognito_email: CognitoEmailTriggerLambda;
    policies: PoliciesTriggerLambda;
    post_auth: PostAuthTriggerLambda;
    api_deployment: ApiDeploymentTriggerLambda;
  };
  cloudfront: {
    resolver_viewer_request: CloudfrontResolverViewerRequestLambda;
    mixpanel_proxy_viewer_request: MixpanelProxyViewerRequestLambda;
  };
  dynamodb: {
    main_stream: DynamoDBStreamLambda;
    labels_stream: DynamoDBLabelsStreamLambda;
  };
  s3: {
    stream: S3StreamLambda;
  };
  sqs: {
    printer_labels_lambda: PrinterLabelsLambda;
    labels_queue_lambda: LabelsQueueLambda;
    printer_labels_retry_lambda: PrinterLabelsRetryLambda;
  };
  kinesis: {
    analytics_lambda: KinesisAnalyticsLambda;
  };
}

export class LambdasConstruct extends Construct {
  public readonly lambdas: Lambdas;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.lambdas = {
      kinesis: {
        analytics_lambda: new KinesisAnalyticsLambda(
          scope,
          `KinesisAnalyticsLambda-${props.environment}`,
          {
            environment: props.environment,
            kinesis_construct: props.kinesis_construct,
          },
        ),
      },
      triggers: {
        cognito_email: new CognitoEmailTriggerLambda(
          scope,
          `CognitoEmailTriggerLambda-${props.environment}`,
          {
            environment: props.environment,
            kms_key_arn: props.kms_construct.kms_key.keyArn,
            layers_construct: props.layers_construct,
          },
        ),
        post_auth: new PostAuthTriggerLambda(
          scope,
          `PostAuthTriggerLambda-${props.environment}`,
          {
            environment: props.environment,
          },
        ),
        policies: new PoliciesTriggerLambda(
          scope,
          `PoliciesTriggerLambda-${props.environment}`,
          {
            environment: props.environment,
          },
        ),
        api_deployment: new ApiDeploymentTriggerLambda(
          scope,
          `ApiDeploymentTriggerLambda-${props.environment}`,
          {
            environment: props.environment,
            rest_api_id: props.rest_api_id,
          },
        ),
      },

      cloudfront: {
        resolver_viewer_request: new CloudfrontResolverViewerRequestLambda(
          scope,
          `Cloudfront-ResolverViewerRequest-Lambda-${props.environment}`,
          {
            environment: props.environment,
          },
        ),
        mixpanel_proxy_viewer_request: new MixpanelProxyViewerRequestLambda(
          scope,
          `Cloudfront-MixpanelProxyViewerRequest-LambdaEdge-${props.environment}`,
          { environment: props.environment },
        ),
      },

      dynamodb: {
        main_stream: new DynamoDBStreamLambda(
          scope,
          `DynamoDBStream-Construct-${props.environment}`,
          {
            environment: props.environment,
            layers: props.layers_construct.layers,
            dynamodb_construct: props.dynamodb_construct,
          },
        ),
        labels_stream: new DynamoDBLabelsStreamLambda(
          scope,
          `DynamoDBLabelsStream-Construct-${props.environment}`,
          {
            environment: props.environment,
            layers: props.layers_construct.layers,
            dynamodb_construct: props.dynamodb_construct,
          },
        ),
      },

      s3: {
        stream: new S3StreamLambda(
          scope,
          `S3Stream-Construct-${props.environment}`,
          {
            dynamodb_construct: props.dynamodb_construct,
            environment: props.environment,
          },
        ),
      },

      sqs: {
        printer_labels_lambda: new PrinterLabelsLambda(
          scope,
          `SQS-Printer-Labels-LambdaConstruct-${props.environment}`,
          {
            environment: props.environment,
            sqs_construct: props.sqs_construct,
          },
        ),
        labels_queue_lambda: new LabelsQueueLambda(
          scope,
          `SQS-Labels-Queue-LambdaConstruct`,
          {
            environment: props.environment,
            sqs_construct: props.sqs_construct,
          },
        ),
        printer_labels_retry_lambda: new PrinterLabelsRetryLambda(
          scope,
          `SQS-Printer-Labels-Retry-LambdaConstruct-${props.environment}`,
          {
            environment: props.environment,
            sqs_construct: props.sqs_construct,
          },
        ),
      },
    };

    if (props.environment !== 'STG')
      Object.values(this.lambdas).forEach(service =>
        Object.values(service).forEach(lambda =>
          add_inspector_tags_to_function(
            (lambda as { function: NodejsFunction }).function,
          ),
        ),
      );
  }
}
