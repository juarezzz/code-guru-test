/* ---------- External ---------- */
import { ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Duration, Tags } from 'aws-cdk-lib';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import {
  AllowedMethods,
  CacheHeaderBehavior,
  CachePolicy,
  Distribution,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
  LambdaEdgeEventType,
} from 'aws-cdk-lib/aws-cloudfront';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Stacks ---------- */
import { CertificateWebStack } from '_stacks/certificates/certificate-web-stack';

/* ---------- Constructs ---------- */
import { BucketsConstruct } from '_stacks/web-stack/constructs/Buckets';
import { LambdasConstruct } from '_stacks/web-stack/constructs/Lambdas';

/* ---------- Interfaces ---------- */
interface Distributions {
  web_analytics: Distribution;
}

interface ARecords {
  web_analytics: ARecord;
}

interface Props {
  buckets_construct: BucketsConstruct;
  certificate_web_stack: CertificateWebStack;
  environment: string;
  lambdas_construct: LambdasConstruct;
}

export class CloudfrontConstruct extends Construct {
  public readonly distributions: Distributions;

  public readonly cache_policy: CachePolicy;

  public readonly a_records: ARecords;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { web_analytics_domain }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.cache_policy = new CachePolicy(
      scope,
      `Cloudfront-WEB-Analytics-CachePolicy-${props.environment}`,
      {
        cachePolicyName: `Cloudfront-WEB-Analytics-CachePolicy-${props.environment}`,
        defaultTtl: Duration.minutes(1),
        minTtl: Duration.minutes(1),
        maxTtl: Duration.minutes(2),
        headerBehavior: CacheHeaderBehavior.allowList(
          'CloudFront-Viewer-City',
          'CloudFront-Viewer-Country-Name',
          'CloudFront-Viewer-Country-Region-Name',
          'CloudFront-Viewer-Latitude',
          'CloudFront-Viewer-Longitude',
          'CloudFront-Viewer-Time-Zone',
          'CloudFront-Viewer-Postal-Code',
          'CloudFront-Is-Android-Viewer',
          'CloudFront-Is-IOS-Viewer',
        ),
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
      },
    );

    this.distributions = {
      web_analytics: new Distribution(
        scope,
        `WEB-Analytics-Distribution-${props.environment}`,
        {
          certificate:
            props.certificate_web_stack.route_53_construct.polytag_certificate,
          domainNames: [web_analytics_domain],
          defaultBehavior: {
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            origin: new S3Origin(
              props.buckets_construct.buckets.analytics_web_bucket,
            ),
            allowedMethods: AllowedMethods.ALLOW_ALL,
            edgeLambdas: [
              {
                functionVersion:
                  props.lambdas_construct.lambdas.cloudfront
                    .analytics_web_origin_request.function.currentVersion,
                eventType: LambdaEdgeEventType.ORIGIN_REQUEST,
                includeBody: true,
              },
            ],
            cachePolicy: this.cache_policy,
            responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
          },
        },
      ),
    };

    this.a_records = {
      web_analytics: new ARecord(
        scope,
        `WEB-Analytics-HostRecord-${props.environment}`,
        {
          zone: props.certificate_web_stack.route_53_construct.hosted_zones
            .polytag,
          target: RecordTarget.fromAlias(
            new CloudFrontTarget(this.distributions.web_analytics),
          ),
          recordName: web_analytics_domain,
        },
      ),
    };

    /* ---------- Tags ---------- */
    Tags.of(this.distributions.web_analytics).add(
      'Custom:Service',
      'Cloudfront',
    );
    Tags.of(this.distributions.web_analytics).add(
      'Custom:Distribution',
      'Web Analytics',
    );
    Tags.of(this.distributions.web_analytics).add(
      'Custom:Environment',
      props.environment,
    );
  }
}
