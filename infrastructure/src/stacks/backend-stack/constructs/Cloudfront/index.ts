/* ---------- External ---------- */
import { S3Origin, HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  FunctionEventType,
  LambdaEdgeEventType,
  OriginRequestPolicy,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';
import {
  ARecords,
  Distributions,
} from '_stacks/backend-stack/constructs/Cloudfront/@types';

/* ---------- Constructs ---------- */
import { BucketsConstruct } from '_stacks/backend-stack/constructs/Buckets';
import { LambdasConstruct } from '_stacks/backend-stack/constructs/Lambdas';
import { Certificates, HostedZones } from '_stacks/backend-stack';

/* ---------- Interfaces ---------- */
interface Props {
  buckets_construct: BucketsConstruct;
  environment: string;
  lambdas_construct: LambdasConstruct;
  certificates: Certificates;
  hosted_zones: HostedZones;
}

export class CloudfrontConstruct extends Construct {
  public readonly distributions: Distributions;

  public readonly a_records: ARecords;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { resolver_domain_name, mixpanel_proxy_domain_name }: CDK.Context =
      this.node.tryGetContext(props.environment);

    this.distributions = {
      resolver: new Distribution(
        scope,
        `Resolver-Distribution-${props.environment}`,
        {
          certificate: props.certificates.resolver_certificate,
          domainNames: [resolver_domain_name],
          defaultRootObject: 'index.html',
          defaultBehavior: {
            origin: new S3Origin(props.buckets_construct.buckets.main_bucket),
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
            cachePolicy: CachePolicy.CACHING_OPTIMIZED,
            allowedMethods: AllowedMethods.ALLOW_ALL,
            responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
            functionAssociations: [
              {
                eventType: FunctionEventType.VIEWER_REQUEST,
                function:
                  props.lambdas_construct.lambdas.cloudfront
                    .resolver_viewer_request.function,
              },
            ],
          },
        },
      ),
      mixpanel_proxy: new Distribution(
        scope,
        `Mixpanel-Proxy-Distribution-${props.environment}`,
        {
          certificate: props.certificates.polytag_certificate,
          domainNames: [mixpanel_proxy_domain_name],
          defaultBehavior: {
            origin: new HttpOrigin('api.mixpanel.com'),
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            originRequestPolicy: OriginRequestPolicy.CORS_CUSTOM_ORIGIN,
            cachePolicy: CachePolicy.CACHING_OPTIMIZED,
            allowedMethods: AllowedMethods.ALLOW_ALL,
            responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
            edgeLambdas: [
              {
                functionVersion:
                  props.lambdas_construct.lambdas.cloudfront
                    .mixpanel_proxy_viewer_request.function.currentVersion,
                eventType: LambdaEdgeEventType.VIEWER_REQUEST,
                includeBody: true,
              },
            ],
          },
        },
      ),
    };

    new ARecord(scope, `Resolver-ARecord-${props.environment}`, {
      zone: props.hosted_zones.resolver,
      target: RecordTarget.fromAlias(
        new CloudFrontTarget(this.distributions.resolver),
      ),
      recordName: resolver_domain_name,
    });

    new ARecord(this, `MixpanelProxy-ARecord-${props.environment}`, {
      zone: props.hosted_zones.polytag,
      target: RecordTarget.fromAlias(
        new CloudFrontTarget(this.distributions.mixpanel_proxy),
      ),
      recordName: mixpanel_proxy_domain_name,
    });

    this.distributions.resolver.node.addDependency(
      props.certificates.resolver_certificate,
    );

    this.distributions.mixpanel_proxy.node.addDependency(
      props.certificates.polytag_certificate,
    );

    /* ---------- Tags ---------- */
    Tags.of(this.distributions.resolver).add('Custom:Service', 'Cloudfront');
    Tags.of(this.distributions.resolver).add('Custom:Distribution', 'Resolver');
    Tags.of(this.distributions.resolver).add(
      'Custom:Environment',
      props.environment,
    );

    Tags.of(this.distributions.mixpanel_proxy).add(
      'Custom:Service',
      'Cloudfront',
    );
    Tags.of(this.distributions.mixpanel_proxy).add(
      'Custom:Distribution',
      'Mixpanel Proxy',
    );
    Tags.of(this.distributions.mixpanel_proxy).add(
      'Custom:Environment',
      props.environment,
    );
  }
}
