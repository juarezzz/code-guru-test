/* ---------- External ---------- */
import { Construct } from 'constructs';
import { ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets';
import {
  Cors,
  DomainName,
  EndpointType,
  RestApi,
  SecurityPolicy,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Constructs ---------- */
import { Resources } from '_pipeline-stack/constructs/Resources';
import { S3Buckets } from '_pipeline-stack/constructs/S3Buckets';
import { Route53Construct } from '_pipeline-stack/constructs/Route53';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  s3_buckets: S3Buckets;
  route_53_construct: Route53Construct;
  inspector_lambda_arn: string;
  scheduler_role_arn: string;
}

export class RestAPI extends Construct {
  public readonly rest_api: RestApi;

  public readonly domain_name: DomainName;

  public readonly record: ARecord;

  public readonly resources: Resources;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { pipe_domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.rest_api = new RestApi(scope, `RestAPI-${props.environment}-PIPE`, {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: ['*'],
      },
    });

    this.domain_name = this.rest_api.addDomainName(
      `RestAPI-DomainName-${props.environment}-PIPE`,
      {
        domainName: pipe_domain_name,
        certificate: props.route_53_construct.certificates.polytag,
        endpointType: EndpointType.EDGE,
        securityPolicy: SecurityPolicy.TLS_1_2,
      },
    );

    this.record = new ARecord(
      scope,
      `RestAPI-HostRecord-${props.environment}-PIPE`,
      {
        zone: props.route_53_construct.hosted_zones.polytag,
        target: RecordTarget.fromAlias(new ApiGatewayDomain(this.domain_name)),
        recordName: pipe_domain_name,
      },
    );

    this.resources = new Resources(
      scope,
      `RestAPI-Resources-${props.environment}-PIPE`,
      {
        rest_api: this.rest_api,
        environment: props.environment,
        s3_buckets: props.s3_buckets,
        inspector_lambda_arn: props.inspector_lambda_arn,
        scheduler_role_arn: props.scheduler_role_arn,
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.rest_api).add('Custom:Service', 'API Gateway');
    Tags.of(this.rest_api).add('Custom:API', 'Pipeline');
    Tags.of(this.rest_api).add('Custom:Environment', props.environment);
  }
}
