/* ---------- External ---------- */
import { RemovalPolicy } from 'aws-cdk-lib';
import {
  AccessLogField,
  AccessLogFormat,
  Deployment,
  DomainName,
  EndpointType,
  IRestApi,
  LogGroupLogDestination,
  MethodLoggingLevel,
  RestApi,
  SecurityPolicy,
  Stage,
} from 'aws-cdk-lib/aws-apigateway';
import {
  CertificateValidation,
  DnsValidatedCertificate,
} from 'aws-cdk-lib/aws-certificatemanager';
import { LogGroup, LogRetention, RetentionDays } from 'aws-cdk-lib/aws-logs';
import {
  ARecord,
  HostedZone,
  IHostedZone,
  RecordTarget,
} from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets';
import { CfnWebACL, CfnWebACLAssociation } from 'aws-cdk-lib/aws-wafv2';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Rules ---------- */
import { get_rate_limit_rules } from '_stacks/deploy-rest-api/rate-limit-rules';

interface Props {
  environment: string;

  rest_api_id: string;
  api_resources: Construct[];
}

export interface HostedZones {
  polytag: IHostedZone;
}

/* ---------- Constants ---------- */
const BOT_CONTROL_UNFILTERED_ROUTES = ['/printer-', '/third-party-', '/mrf-'];

export class DeployRestApi extends Construct {
  public readonly hosted_zones: HostedZones;

  public readonly polytag_certificate: DnsValidatedCertificate;

  public readonly api_waf_rule: CfnWebACL;

  public readonly rest_api: IRestApi;

  public readonly access_log_group: LogGroup;

  public readonly deployment: Deployment;

  public readonly domain: DomainName;

  public readonly api_waf_association: CfnWebACLAssociation;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { api_domain_name, domain_name }: CDK.Context =
      this.node.tryGetContext(props.environment);

    this.hosted_zones = {
      polytag: HostedZone.fromLookup(
        this,
        `HostedZone--${props.environment}-Back-API`,
        {
          domainName: 'polyt.ag',
        },
      ),
    };

    this.polytag_certificate = new DnsValidatedCertificate(
      this,
      `Polytag-ACM-Certificate-${props.environment}-Back-API`,
      {
        domainName: domain_name,
        hostedZone: this.hosted_zones.polytag,
        certificateName: `polytag-certificate-${props.environment.toLowerCase()}-back-api`,
        cleanupRoute53Records: true,
        region: 'us-east-1',
        validation: CertificateValidation.fromDns(this.hosted_zones.polytag),
        subjectAlternativeNames: ['*.polyt.ag'],
      },
    );

    this.rest_api = RestApi.fromRestApiId(
      this,
      `RestAPI-Deployment-${props.environment}`,
      props.rest_api_id,
    );

    this.deployment = new Deployment(this, `Deployment-${props.environment}`, {
      api: this.rest_api,
    });

    props.api_resources.forEach(resource =>
      this.deployment.node.addDependency(resource),
    );

    this.access_log_group = new LogGroup(
      this,
      `AccessLogs-Back-API-${props.environment}`,
      {
        logGroupName: `AccessLogs-Back-API-${props.environment}`,
        retention: RetentionDays.TWO_WEEKS,
        removalPolicy:
          props.environment !== 'PROD'
            ? RemovalPolicy.DESTROY
            : RemovalPolicy.RETAIN,
      },
    );

    /*
     * We need to create this log retention policy for the
     * API Execution log group which has a default of "never expires".
     */
    new LogRetention(
      this,
      `API-Gateway-Execution-Logs-Retention-BACK-${props.environment}`,
      {
        logGroupName: `API-Gateway-Execution-Logs_${this.rest_api.restApiId}/prod`,
        retention: RetentionDays.TWO_WEEKS,
        removalPolicy:
          props.environment !== 'PROD'
            ? RemovalPolicy.DESTROY
            : RemovalPolicy.RETAIN,
      },
    );

    const stage = new Stage(this, `${props.environment}-Stage-RestApi`, {
      deployment: this.deployment,
      accessLogDestination: new LogGroupLogDestination(this.access_log_group),
      accessLogFormat: AccessLogFormat.custom(
        JSON.stringify({
          request_id: AccessLogField.contextRequestId(),
          user_sub: AccessLogField.contextAuthorizerClaims('sub'),
          path: AccessLogField.contextResourcePath(),
          method: AccessLogField.contextHttpMethod(),
          response_status: AccessLogField.contextStatus(),
          error_message: AccessLogField.contextErrorMessage(),
        }),
      ),
      loggingLevel: MethodLoggingLevel.INFO,
      dataTraceEnabled: true,
      stageName: 'prod',
    });

    /*
     * Only enabling WAF if the environment is production or staging (temp)
     */

    if (props.environment === 'PROD') {
      this.api_waf_rule = new CfnWebACL(
        this,
        `RestAPI-WAF-Rule-BACK-${props.environment}`,
        {
          name: `RestAPI-WAF-Rule-BACK-${props.environment}`,
          defaultAction: { allow: {} },

          scope: 'REGIONAL',
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `RestAPI-WAF-Metrics-BACK-${props.environment}`,
            sampledRequestsEnabled: true,
          },
          rules: [
            {
              name: `RestAPI-WAF-CRS-Rule-BACK-${props.environment}`,
              priority: 0,
              statement: {
                managedRuleGroupStatement: {
                  name: 'AWSManagedRulesCommonRuleSet',
                  vendorName: 'AWS',
                  ruleActionOverrides: [
                    {
                      name: 'SizeRestrictions_BODY',
                      actionToUse: {
                        count: {},
                      },
                    },
                    {
                      name: 'CrossSiteScripting_BODY',
                      actionToUse: {
                        count: {},
                      },
                    },
                  ],
                },
              },
              visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: `RestAPI-WAF-CRS-Rule-Metric-BACK-${props.environment}`,
                sampledRequestsEnabled: true,
              },
              overrideAction: {
                none: {},
              },
            },
            {
              name: `RestAPI-WAF-BotControl-Rule-BACK-${props.environment}`,
              priority: 1,
              statement: {
                managedRuleGroupStatement: {
                  name: 'AWSManagedRulesBotControlRuleSet',
                  vendorName: 'AWS',
                  scopeDownStatement: {
                    andStatement: {
                      statements: BOT_CONTROL_UNFILTERED_ROUTES.map(route => ({
                        notStatement: {
                          statement: {
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
                          },
                        },
                      })),
                    },
                  },
                },
              },
              visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: `RestAPI-WAF-BotControl-Rule-Metric-BACK-${props.environment}`,
                sampledRequestsEnabled: true,
              },
              overrideAction: {
                none: {},
              },
            },
            ...get_rate_limit_rules(props.environment),
          ],
        },
      );

      this.api_waf_association = new CfnWebACLAssociation(
        this,
        `RestAPI-WAF-Association-BACK-${props.environment}`,
        {
          resourceArn: stage.stageArn,
          webAclArn: this.api_waf_rule.attrArn,
        },
      );
    }

    this.domain = new DomainName(
      this,
      `RestAPI-DomainName-${props.environment}-BACK`,
      {
        domainName: api_domain_name,
        certificate: this.polytag_certificate,
        securityPolicy: SecurityPolicy.TLS_1_2,
        endpointType: EndpointType.EDGE,
      },
    );

    this.domain.addBasePathMapping(this.rest_api, {
      basePath: '',
      stage,
    });

    new ARecord(this, `RestAPI-HostRecord-${props.environment}-BACK`, {
      zone: this.hosted_zones.polytag,
      target: RecordTarget.fromAlias(new ApiGatewayDomain(this.domain)),
      recordName: api_domain_name,
    });
  }
}
