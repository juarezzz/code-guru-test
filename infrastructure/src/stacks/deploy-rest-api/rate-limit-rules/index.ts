/* ---------- EXternal ---------- */
import { CfnWebACL } from 'aws-cdk-lib/aws-wafv2';

/* ---------- Constants ---------- */
const WEBSITE_ROUTES = ['/brand-', '/analytics-'];
const INTEGRATION_ROUTES = ['/printer-', '/third-party-', '/mrf-'];

export const get_rate_limit_rules = (
  environment: string,
): CfnWebACL.RuleProperty[] => [
  {
    name: `RestAPI-WAF-RateLimit-Website-Rule-BACK-${environment}`,
    priority: 2,
    statement: {
      rateBasedStatement: {
        limit: 500, // 100 requests per minute
        aggregateKeyType: 'IP',
        scopeDownStatement: {
          orStatement: {
            statements: WEBSITE_ROUTES.map(route => ({
              byteMatchStatement: {
                searchString: route,
                fieldToMatch: {
                  uriPath: {},
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'NORMALIZE_PATH',
                  },
                ],
                positionalConstraint: 'STARTS_WITH',
              },
            })),
          },
        },
      },
    },
    action: {
      block: {},
    },
    visibilityConfig: {
      cloudWatchMetricsEnabled: true,
      metricName: `RestAPI-WAF-RateLimit-Website-Rule-Metric-BACK-${environment}`,
      sampledRequestsEnabled: true,
    },
  },
  {
    name: `RestAPI-WAF-RateLimit-Integrations-Rule-BACK-${environment}`,
    priority: 3,
    statement: {
      rateBasedStatement: {
        limit: 5_000, // 1,000 requests per minute
        aggregateKeyType: 'IP',
        scopeDownStatement: {
          orStatement: {
            statements: INTEGRATION_ROUTES.map(route => ({
              byteMatchStatement: {
                searchString: route,
                fieldToMatch: {
                  uriPath: {},
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'NORMALIZE_PATH',
                  },
                ],
                positionalConstraint: 'STARTS_WITH',
              },
            })),
          },
        },
      },
    },
    action: {
      block: {},
    },
    visibilityConfig: {
      cloudWatchMetricsEnabled: true,
      metricName: `RestAPI-WAF-RateLimit-Integrations-Rule-Metric-BACK-${environment}`,
      sampledRequestsEnabled: true,
    },
  },
];
