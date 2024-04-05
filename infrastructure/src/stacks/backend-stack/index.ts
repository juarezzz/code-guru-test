/* ---------- External ---------- */
import { Construct } from 'constructs';
import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import {
  CertificateValidation,
  DnsValidatedCertificate,
} from 'aws-cdk-lib/aws-certificatemanager';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Stacks ---------- */
import { PolytagAdminResourcesStack } from '_stacks/polytag-admin-resources-stack';
import { PolytagBrandResourcesStack } from '_stacks/polytag-brand-resources-stack';
import { PolytagMrfResourcesStack } from '_stacks/polytag-mrf-resources-stack';
import { PolytagPrinterResourcesStack } from '_stacks/polytag-printer-resources-stack';
import { PolytagThirdPartyResourcesStack } from '_stacks/polytag-third-party-resources-stack';
import { PolytagAnalyticsResourcesStack } from '_stacks/polytag-analytics-resources-stack';

/* ---------- Constructs ---------- */
import { BackupsConstruct } from '_stacks/backend-stack/constructs/Backups';
import { BucketsConstruct } from '_stacks/backend-stack/constructs/Buckets';
import { CloudfrontConstruct } from '_stacks/backend-stack/constructs/Cloudfront';
import { CloudWatchConstruct } from '_stacks/backend-stack/constructs/CloudWatch';
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';
import { KMSConstruct } from '_stacks/backend-stack/constructs/KMS';
import { SNSConstruct } from '_stacks/backend-stack/constructs/SNS';
import { LambdasConstruct } from '_stacks/backend-stack/constructs/Lambdas';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';
import { SQSConstruct } from '_stacks/backend-stack/constructs/SQS';
import { StateMachineConstruct } from '_stacks/backend-stack/constructs/StateMachine';
import { TriggersConstruct } from '_stacks/backend-stack/constructs/Triggers';
import { KinesisConstruct } from '_stacks/backend-stack/constructs/Kinesis';
import { TimestreamConstruct } from '_stacks/backend-stack/constructs/Timestream';
import { IAMConstruct } from '_stacks/backend-stack/constructs/IAM';
import { LambdaAuthorizers } from '_stacks/backend-stack/constructs/Lambdas/Authorizers';
import { DeployRestApi } from '_stacks/deploy-rest-api';

/* ---------- Interfaces ---------- */
interface Props extends StackProps {
  environment: string;
  // certificate_stack: CertificateStack;
}

/* ---------- Temporary solution until AWS fix the Certificate bug ---------- */
export interface HostedZones {
  polytag: IHostedZone;
  resolver: IHostedZone;
}

export interface Certificates {
  polytag_certificate: DnsValidatedCertificate;
  resolver_certificate: DnsValidatedCertificate;
}
/* ---------- Temporary solution until AWS fix the Certificate bug ---------- */

export class BackendStack extends Stack {
  /* ---------- Temporary solution until AWS fix the Certificate bug ---------- */

  public readonly hosted_zones: HostedZones;

  public readonly certificates: Certificates;

  /* ---------- Temporary solution until AWS fix the Certificate bug ---------- */

  public readonly backups_construct: BackupsConstruct;

  public readonly buckets_construct: BucketsConstruct;

  public readonly cloudfront_construct: CloudfrontConstruct;

  public readonly cloudwatch_construct: CloudWatchConstruct;

  public readonly cognito_construct: CognitoConstruct;

  public readonly dynamodb_construct: DynamoDBConstruct;

  public readonly kinesis_construct: KinesisConstruct;

  public readonly kms_construct: KMSConstruct;

  public readonly sns_construct: SNSConstruct;

  public readonly lambdas_construct: LambdasConstruct;

  public readonly timestream_construct: TimestreamConstruct;

  public readonly layers_construct: LayersConstruct;

  public readonly iam_construct: IAMConstruct;

  public readonly sqs_construct: SQSConstruct;

  public readonly state_machine_construct: StateMachineConstruct;

  public readonly triggers_construct: TriggersConstruct;

  public readonly rest_api_construct: RestApi;

  public readonly lambda_authorizers: LambdaAuthorizers;

  public readonly admin_resources_stack: PolytagAdminResourcesStack;

  public readonly brand_resources_stack: PolytagBrandResourcesStack;

  public readonly mrf_resources_stack: PolytagMrfResourcesStack;

  public readonly printer_resources_stack: PolytagPrinterResourcesStack;

  public readonly third_party_resources_stack: PolytagThirdPartyResourcesStack;

  public readonly analytics_resources_stack: PolytagAnalyticsResourcesStack;

  public readonly deploy_rest_api: DeployRestApi;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    /* ---------- Temporary solution until AWS fix the Certificate bug ---------- */
    const { resolver_domain_name, domain_name }: CDK.Context =
      this.node.tryGetContext(props.environment);

    this.hosted_zones = {
      polytag: HostedZone.fromLookup(
        this,
        `HostedZone--${props.environment}-back`,
        {
          domainName: 'polyt.ag',
        },
      ),
      resolver: HostedZone.fromLookup(
        this,
        `SubZone--${props.environment}-back`,
        {
          domainName: 'tgz.bz',
        },
      ),
    };

    this.certificates = {
      resolver_certificate: new DnsValidatedCertificate(
        this,
        `PolytagResolver-ACM-Certificate-${props.environment}-Back`,
        {
          domainName: resolver_domain_name,
          hostedZone: this.hosted_zones.resolver,
          certificateName: `resolver-certificate-${props.environment.toLowerCase()}-back`,
          cleanupRoute53Records: true,
          region: 'us-east-1',
          validation: CertificateValidation.fromDns(this.hosted_zones.polytag),
          subjectAlternativeNames: ['*.tgz.bz'],
        },
      ),
      polytag_certificate: new DnsValidatedCertificate(
        this,
        `Polytag-ACM-Certificate-${props.environment}-Back`,
        {
          domainName: domain_name,
          hostedZone: this.hosted_zones.polytag,
          certificateName: `polytag-certificate-${props.environment.toLowerCase()}-back`,
          cleanupRoute53Records: true,
          region: 'us-east-1',
          validation: CertificateValidation.fromDns(this.hosted_zones.polytag),
          subjectAlternativeNames: ['*.polyt.ag'],
        },
      ),
    };

    this.rest_api_construct = new RestApi(
      this,
      `RestAPI-${props.environment}-BACK`,
      {
        deploy: false,
        restApiName: `RestAPI-${props.environment}-BACK`,
      },
    );

    this.rest_api_construct.root.addResource('check').addMethod('GET');

    /* ---------- Temporary solution until AWS fix the Certificate bug ---------- */

    this.layers_construct = new LayersConstruct(
      this,
      `Layers-Construct-${props.environment}`,
      {
        environment: props.environment,
      },
    );

    this.kms_construct = new KMSConstruct(
      this,
      `KMS-${props.environment}-BACK`,
      {
        environment: props.environment,
      },
    );

    this.kinesis_construct = new KinesisConstruct(
      this,
      `Kinesis-${props.environment}-BACK`,
      { environment: props.environment },
    );

    this.sns_construct = new SNSConstruct(
      this,
      `SNS-${props.environment}-BACK`,
      {
        environment: props.environment,
      },
    );

    this.dynamodb_construct = new DynamoDBConstruct(
      this,
      `DynamoDB-Construct-${props.environment}-BACK`,
      {
        environment: props.environment,
        sns_construct: this.sns_construct,
      },
    );

    this.state_machine_construct = new StateMachineConstruct(
      this,
      `StateMachine-Construct-${props.environment}-BACK`,
      {
        environment: props.environment,
        dynamodb_construct: this.dynamodb_construct,
      },
    );

    this.sqs_construct = new SQSConstruct(
      this,
      `SQS-Construct-${props.environment}-BACK`,
      {
        environment: props.environment,
      },
    );

    this.lambdas_construct = new LambdasConstruct(
      this,
      `Lambdas-Construct-${props.environment}-BACK`,
      {
        dynamodb_construct: this.dynamodb_construct,
        environment: props.environment,
        kms_construct: this.kms_construct,
        layers_construct: this.layers_construct,
        sqs_construct: this.sqs_construct,
        kinesis_construct: this.kinesis_construct,
        rest_api_id: this.rest_api_construct.restApiId,
      },
    );

    this.buckets_construct = new BucketsConstruct(
      this,
      `Buckets-Construct-${props.environment}-BACK`,
      {
        environment: props.environment,
        dynamodb_construct: this.dynamodb_construct,
        lambdas_construct: this.lambdas_construct,
        state_machine_construct: this.state_machine_construct,
      },
    );

    this.timestream_construct = new TimestreamConstruct(
      this,
      `Timestream-Construct-${props.environment}-BACK`,
      {
        buckets_construct: this.buckets_construct,
        environment: props.environment,
      },
    );

    this.cognito_construct = new CognitoConstruct(
      this,
      `Cognito-Construct-${props.environment}-BACK`,
      {
        environment: props.environment,
        kms_construct: this.kms_construct,
        lambdas_construct: this.lambdas_construct,
      },
    );

    this.iam_construct = new IAMConstruct(
      this,
      `IAM-Construct-${props.environment}-BACK`,
      {
        environment: props.environment,
      },
    );

    /* ----------
     * CloudWatch Construct
     * ---------- */

    this.cloudwatch_construct = new CloudWatchConstruct(
      this,
      `Cloudwatch-Contruct-${props.environment}-BACK`,
      {
        environment: props.environment,
      },
    );

    this.cloudfront_construct = new CloudfrontConstruct(
      this,
      `Cloudfront-Construct-${props.environment}-BACK`,
      {
        buckets_construct: this.buckets_construct,
        environment: props.environment,
        lambdas_construct: this.lambdas_construct,
        hosted_zones: this.hosted_zones,
        certificates: this.certificates,
      },
    );

    if (props.environment === 'PROD') {
      this.backups_construct = new BackupsConstruct(
        this,
        `Backups-Construct-${props.environment}`,
        {
          environment: props.environment,
          buckets_construct: this.buckets_construct,
          timestream_construct: this.timestream_construct,
        },
      );
    }

    this.lambdas_construct.node.addDependency(this.dynamodb_construct);

    this.lambda_authorizers = new LambdaAuthorizers(
      this,
      `LambdaAuthorizers-Construct-${props.environment}`,
      {
        environment: props.environment,
        cognito_construct: this.cognito_construct,
        rest_api_construct: this.rest_api_construct,
      },
    );

    /* ----------
     * Nested Stacks Constructs
     * ---------- */

    this.admin_resources_stack = new PolytagAdminResourcesStack(
      this,
      `${props.environment}-Polytag-Admin-RESOURCES`,
      {
        stack_name: `${props.environment}-Polytag-Admin-RESOURCES`,
        description: 'Resources for Admin portal',
        backend_stack: this,
        environment: props.environment,
        rest_api_id: this.rest_api_construct.restApiId,
        root_resource_id: this.rest_api_construct.restApiRootResourceId,
      },
    );

    this.brand_resources_stack = new PolytagBrandResourcesStack(
      this,
      `${props.environment}-Polytag-Brand-RESOURCES`,
      {
        stack_name: `${props.environment}-Polytag-Brand-RESOURCES`,
        description: 'Resources for Brand portal',
        rest_api_id: this.rest_api_construct.restApiId,
        root_resource_id: this.rest_api_construct.restApiRootResourceId,
        backend_stack: this,
        environment: props.environment,
      },
    );

    this.third_party_resources_stack = new PolytagThirdPartyResourcesStack(
      this,
      `${props.environment}-Polytag-Third-Party-RESOURCES`,
      {
        stack_name: `${props.environment}-Polytag-Third-Party-RESOURCES`,
        description: 'Resources for Third Party integrations',
        backend_stack: this,
        environment: props.environment,
        rest_api_id: this.rest_api_construct.restApiId,
        root_resource_id: this.rest_api_construct.restApiRootResourceId,
      },
    );

    this.mrf_resources_stack = new PolytagMrfResourcesStack(
      this,
      `${props.environment}-Polytag-MRF-RESOURCES`,
      {
        stack_name: `${props.environment}-Polytag-Mrf-RESOURCES`,
        description: 'Resources for MRF integrations',
        backend_stack: this,
        environment: props.environment,
        rest_api_id: this.rest_api_construct.restApiId,
        root_resource_id: this.rest_api_construct.restApiRootResourceId,
      },
    );

    this.printer_resources_stack = new PolytagPrinterResourcesStack(
      this,
      `${props.environment}-Polytag-Printer-RESOURCES`,
      {
        stack_name: `${props.environment}-Polytag-Printer-RESOURCES`,
        description: 'Resources for printer integrations',
        backend_stack: this,
        environment: props.environment,
        rest_api_id: this.rest_api_construct.restApiId,
        root_resource_id: this.rest_api_construct.restApiRootResourceId,
      },
    );

    this.analytics_resources_stack = new PolytagAnalyticsResourcesStack(
      this,
      `${props.environment}-Polytag-Analytics-RESOURCES`,
      {
        stack_name: `${props.environment}-Polytag-Analytics-RESOURCES`,
        description: 'Analytics API Resources',
        backend_stack: this,
        environment: props.environment,
        rest_api_id: this.rest_api_construct.restApiId,
        root_resource_id: this.rest_api_construct.restApiRootResourceId,
      },
    );

    this.deploy_rest_api = new DeployRestApi(
      this,
      `${props.environment}-RestApi-DeployStack`,
      {
        environment: props.environment,
        rest_api_id: this.rest_api_construct.restApiId,
        api_resources: [
          this.admin_resources_stack.admin_resources,
          this.brand_resources_stack.brand_resources,
          this.third_party_resources_stack.third_party_resources,
          this.mrf_resources_stack.mrf_resources,
          this.printer_resources_stack.printer_resources,
          this.analytics_resources_stack.analytics_resources,
        ],
      },
    );

    this.triggers_construct = new TriggersConstruct(
      this,
      `Triggers-Construct-${props.environment}-BACK`,
      {
        environment: props.environment,
        lambdas_construct: this.lambdas_construct,
        deployment_dependencies: [this.deploy_rest_api],
      },
    );

    this.triggers_construct.trigger.executeAfter(this.dynamodb_construct);
    this.triggers_construct.api_deployment_trigger.executeAfter(
      this.rest_api_construct,
    );
    this.lambdas_construct.node.addDependency(this.rest_api_construct);

    /* ---------- Tags ---------- */
    Tags.of(this.rest_api_construct).add('Custom:Service', 'API Gateway');
    Tags.of(this.rest_api_construct).add('Custom:API', 'Main');
    Tags.of(this.rest_api_construct).add(
      'Custom:Environment',
      props.environment,
    );
  }
}
