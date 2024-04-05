/* ---------- External ---------- */
import { Construct } from 'constructs';
import { PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import {
  Cors,
  Model,
  IRestApi,
  CfnAuthorizer,
  AwsIntegration,
  JsonSchemaType,
  RequestValidator,
  AuthorizationType,
  PassthroughBehavior,
} from 'aws-cdk-lib/aws-apigateway';

/* ---------- Constructs ---------- */
import { KinesisConstruct } from '_stacks/backend-stack/constructs/Kinesis';

/* ---------- Interfaces ---------- */
interface Props {
  rest_api: IRestApi;
  environment: string;
  kinesis_construct: KinesisConstruct;
  cognito_mrf_authorizer: CfnAuthorizer;
}

export class MrfIngestResource extends Construct {
  public readonly post: AwsIntegration;

  public readonly ingest_model: Model;

  public readonly ingest_validator: RequestValidator;

  public readonly ingest_role: Role;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    const resource = props.rest_api.root.addResource('mrf-ingest', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ['POST'],
      },
    });

    /* ---------- Role ---------- */
    this.ingest_role = new Role(scope, `MRF-Ingest-Role-${props.environment}`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });

    this.ingest_role.addToPolicy(
      new PolicyStatement({
        actions: ['kinesis:*', 'kinesisanalytics:*', 'iam:*'],
        resources: ['*'],
      }),
    );

    /* ---------- Request templates ---------- */
    const json_request_template = `{
      "StreamName": "${props.kinesis_construct.streams.data_stream.streamName}",
      "Records": [
        #set($dq = '"')

        #set($gtinPropStart = '"gtin":')
        #set($countPropStart = '"count":')
        #set($mrfIdPropStart = '"mrf_id":')

        #set($mrfIdVal = $context.authorizer.claims['custom:mrf_id'])
        #set($mrfIdProp = "$mrfIdPropStart$dq$mrfIdVal$dq")

        #foreach($elem in $input.path('$'))
          #set($gtinVal = $elem['gtin'])
          #set($gtinProp = "$gtinPropStart$dq$gtinVal$dq")

          #set($countVal = $elem['count'])
          #set($countProp = "$countPropStart$countVal")

          #set($data = "{$gtinProp,$countProp,$mrfIdProp}")

          {
            "PartitionKey": "uv-scans",
            "Data": "$util.base64Encode($data)"
          }

          #if($foreach.hasNext),#end
        #end
      ]
    }`;

    /* ---------- Integration ---------- */
    this.post = new AwsIntegration({
      service: 'kinesis',
      integrationHttpMethod: 'POST',
      action: 'PutRecords',
      options: {
        credentialsRole: this.ingest_role,
        passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
        requestTemplates: {
          'application/json': json_request_template,
        },
        integrationResponses: [
          {
            statusCode: '201',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': "'*'",
              'method.response.header.Access-Control-Allow-Origin': "'*'",
              'method.response.header.Access-Control-Allow-Methods':
                "'OPTIONS,POST'",
            },
          },
        ],
      },
    });

    /* ---------- Models ---------- */
    this.ingest_model = new Model(
      scope,
      `MRF-Ingest-Model-${props.environment}`,
      {
        restApi: props.rest_api,
        contentType: 'application/json',
        modelName: `MRFIngestModel${props.environment}`,
        schema: {
          type: JsonSchemaType.ARRAY,
          items: {
            type: JsonSchemaType.OBJECT,
            required: ['gtin', 'count'],
            properties: {
              gtin: { type: JsonSchemaType.STRING },
              count: { type: JsonSchemaType.NUMBER },
            },
          },
        },
      },
    );

    /* ---------- Validators ---------- */
    this.ingest_validator = new RequestValidator(
      this,
      `MRF-Ingest-Validator-${props.environment}`,
      {
        restApi: props.rest_api,
        requestValidatorName: `mrf-ingest-validator-${props.environment.toLowerCase()}`,
        validateRequestBody: true,
      },
    );

    /* ---------- Methods ---------- */
    resource.addMethod('POST', this.post, {
      authorizationType: AuthorizationType.COGNITO,
      requestValidator: this.ingest_validator,
      requestModels: {
        'application/json': this.ingest_model,
      },
      authorizer: {
        authorizerId: props.cognito_mrf_authorizer.ref,
      },
      methodResponses: [
        {
          statusCode: '201',
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
  }
}
