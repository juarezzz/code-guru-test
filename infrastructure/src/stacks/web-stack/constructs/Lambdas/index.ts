/* ---------- External ---------- */
import { Construct } from 'constructs';

/* ---------- Types ---------- */
import { AnalyticsWEBOriginRequestLambda } from '_stacks/web-stack/lambdas/cloudfront/analytics-web-origin-request';

/* ---------- Interfaces ---------- */
interface Lambdas {
  cloudfront: {
    analytics_web_origin_request: AnalyticsWEBOriginRequestLambda;
  };
}

interface Props {
  environment: string;
}

export class LambdasConstruct extends Construct {
  public readonly lambdas: Lambdas;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.lambdas = {
      cloudfront: {
        analytics_web_origin_request: new AnalyticsWEBOriginRequestLambda(
          scope,
          `Analytics-Web-Origin-Request-${props.environment}`,
          {
            environment: props.environment,
          },
        ),
      },
    };
  }
}
