/* ---------- External ---------- */
import {
  AwsIntegration,
  IRestApi,
  Model,
  PassthroughBehavior,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

/* ---------- Constructs ---------- */
import { KinesisConstruct } from '_stacks/backend-stack/constructs/Kinesis';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  rest_api: IRestApi;
  kinesis_construct: KinesisConstruct;
}

export class AnalyticsLandingPageResource extends Construct {
  public readonly post: AwsIntegration;

  public readonly resource: Resource;

  public readonly role: Role;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Role ---------- */
    this.role = new Role(
      scope,
      `Analytics-Landing-Page-Role-${props.environment}`,
      {
        assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      },
    );

    this.role.addToPolicy(
      new PolicyStatement({
        actions: ['kinesis:*', 'kinesisanalytics:*', 'iam:*'],
        resources: ['*'],
      }),
    );

    /* ---------- CORS Policy ---------- */
    const allowed_origins = [
      `https://${domain_name}`,
      ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
    ];

    const origin_response_template = `
      #set($origin = $input.params().header.get("Origin"))

      #if($origin == "")
        #set($origin = $input.params().header.get("origin"))
      #end

      ${
        allowed_origins.length > 1 &&
        allowed_origins.slice(1).map(
          origin => `
            #if($origin == "${origin}")
              #set($context.responseOverride.header.Access-Control-Allow-Origin = $origin)
            #end

          `,
        )
      }
    `;

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('analytics-landing-page', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: allowed_origins,
        allowMethods: ['POST'],
      },
    });

    /* ---------- Integration ---------- */
    this.post = new AwsIntegration({
      service: 'kinesis',
      integrationHttpMethod: 'POST',
      action: 'PutRecord',
      options: {
        credentialsRole: this.role,
        passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
        requestTemplates: {
          'application/json': `{
            "StreamName": "${props.kinesis_construct.streams.data_stream.streamName}",
            "Data": "$util.base64Encode($input.json('$'))",
            "PartitionKey": "qr-scan#$input.path('$').get('gtin')"
          }`,
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: { 'application/json': origin_response_template },
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': "'*'",
              'method.response.header.Access-Control-Allow-Origin': `'${allowed_origins[0]}'`,
              'method.response.header.Access-Control-Allow-Methods':
                "'OPTIONS,POST'",
            },
          },
        ],
      },
    });

    /* ---------- Methods ---------- */
    this.resource.addMethod('POST', this.post, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Methods': true,
          },
          responseModels: {
            'application/json': Model.EMPTY_MODEL,
          },
        },
      ],
    });

    /* ---------- Invocations ---------- */
    this.role.addToPolicy(
      new PolicyStatement({
        actions: ['kinesis:*', 'kinesisanalytics:*', 'iam:*'],
        resources: ['*'],
      }),
    );
  }
}
