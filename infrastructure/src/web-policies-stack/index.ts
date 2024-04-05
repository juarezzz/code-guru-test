/* ---------- External ---------- */
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Stack, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class PolytagWebPoliciesStack extends Stack {
  public readonly nextjs_statics_cache_policy: cloudfront.CachePolicy;

  public readonly nextjs_lambda_cache_policy: cloudfront.CachePolicy;

  public readonly nextjs_image_cache_policy: cloudfront.CachePolicy;

  public readonly nextjs_fallback_origin_policy: cloudfront.OriginRequestPolicy;

  public readonly nextjs_image_origin_policy: cloudfront.OriginRequestPolicy;

  public readonly nextjs_lambda_origin_policy: cloudfront.OriginRequestPolicy;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    /* ----------
     * Cache Policies
     * ---------- */
    this.nextjs_statics_cache_policy = new cloudfront.CachePolicy(
      this,
      'NextJS-Statics-CachePolicyWeb-Default',
      {
        cachePolicyName: 'NextJS-Statics-CachePolicyWeb-Default',
        comment: 'Default cache policy for NextJS static files',
        defaultTtl: Duration.seconds(2592000),
        minTtl: Duration.seconds(2592000),
        maxTtl: Duration.seconds(2592000),
        cookieBehavior: cloudfront.CacheCookieBehavior.none(),
        queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
        headerBehavior: cloudfront.CacheHeaderBehavior.none(),
        enableAcceptEncodingBrotli: true,
        enableAcceptEncodingGzip: true,
      },
    );

    this.nextjs_lambda_cache_policy = new cloudfront.CachePolicy(
      this,
      'NextJS-Lambda-CachePolicyWeb-Default',
      {
        cachePolicyName: 'NextJS-Lambda-CachePolicyWeb-Default',
        comment: 'Default cache policy for NextJS lambdas',
        defaultTtl: Duration.seconds(0),
        minTtl: Duration.seconds(0),
        maxTtl: Duration.seconds(31536000),
        cookieBehavior: cloudfront.CacheCookieBehavior.all(),
        queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
        headerBehavior: cloudfront.CacheHeaderBehavior.none(),
        enableAcceptEncodingBrotli: true,
        enableAcceptEncodingGzip: true,
      },
    );

    this.nextjs_image_cache_policy = new cloudfront.CachePolicy(
      this,
      'NextJS-Image-CachePolicyWeb-Default',
      {
        cachePolicyName: 'NextJS-Image-CachePolicyWeb-Default',
        comment: 'Default cache policy for NextJS images',
        defaultTtl: Duration.seconds(86400),
        minTtl: Duration.seconds(0),
        maxTtl: Duration.seconds(31536000),
        cookieBehavior: cloudfront.CacheCookieBehavior.none(),
        queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
        headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Accept'),
        enableAcceptEncodingBrotli: true,
        enableAcceptEncodingGzip: true,
      },
    );

    /* ----------
     * Origin Policies
     * ---------- */
    this.nextjs_fallback_origin_policy = new cloudfront.OriginRequestPolicy(
      this,
      'NextJS-Fallback-OriginPolicyWeb-Default',
      {
        originRequestPolicyName: 'NextJS-Fallback-OriginPolicyWeb-Default',
        comment: 'Default origin policy for NextJS fallback origin',
        cookieBehavior: cloudfront.OriginRequestCookieBehavior.all(),
        headerBehavior: cloudfront.OriginRequestHeaderBehavior.all(),
        queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
      },
    );

    this.nextjs_image_origin_policy = new cloudfront.OriginRequestPolicy(
      this,
      'NextJS-Image-OriginPolicyWeb-Default',
      {
        originRequestPolicyName: 'NextJS-Image-OriginPolicyWeb-Default',
        comment: 'Default origin policy for NextJS image optimization',
        cookieBehavior: cloudfront.OriginRequestCookieBehavior.none(),
        headerBehavior:
          cloudfront.OriginRequestHeaderBehavior.allowList('accept'),
        queryStringBehavior:
          cloudfront.OriginRequestQueryStringBehavior.allowList(
            'q',
            'w',
            'url',
          ),
      },
    );

    this.nextjs_lambda_origin_policy = new cloudfront.OriginRequestPolicy(
      this,
      'NextJS-Lambda-OriginPolicyWeb-Default',
      {
        originRequestPolicyName: 'NextJS-Lambda-OriginPolicyWeb-Default',
        comment: 'Default origin policy for NextJS lambdas',
        cookieBehavior: cloudfront.OriginRequestCookieBehavior.all(),
        queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
        headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList(
          'Origin',
          'Access-Control-Request-Method',
          'Access-Control-Request-Headers',
          'CloudFront-Viewer-Country',
          'CloudFront-Viewer-City',
          'CloudFront-Viewer-Latitude',
          'CloudFront-Viewer-Longitude',
          'CloudFront-Is-IOS-Viewer',
          'CloudFront-Is-Android-Viewer',
        ),
      },
    );
  }
}
