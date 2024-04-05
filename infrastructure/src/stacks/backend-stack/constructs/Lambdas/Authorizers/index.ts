/* ---------- External ---------- */
import {
  AuthorizationType,
  CfnAuthorizer,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

interface Props {
  environment: string;
  cognito_construct: CognitoConstruct;
  rest_api_construct: RestApi;
}

interface Lambdas {
  admin: CfnAuthorizer;
  brand: CfnAuthorizer;
  third_party: CfnAuthorizer;
  mrf: CfnAuthorizer;
  printer: CfnAuthorizer;
}

export class LambdaAuthorizers extends Construct {
  public readonly authorizer: Lambdas;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.authorizer = {
      admin: new CfnAuthorizer(
        this,
        `Polytag-Admin-Authorizer-${props.environment}-BACK`,
        {
          identitySource: 'method.request.header.Authorization',
          name: `admin-cognito-authorizer-${props.environment}-Backend-API`,
          providerArns: [
            props.cognito_construct.userpools.admin.userpool.userPoolArn,
          ],
          restApiId: props.rest_api_construct.restApiId,
          type: AuthorizationType.COGNITO,
        },
      ),
      brand: new CfnAuthorizer(
        this,
        `Polytag-Brand-Authorizer-${props.environment}-BACK`,
        {
          name: `brand-cognito-authorizer-${props.environment}-Backend-API`,
          identitySource: 'method.request.header.Authorization',
          providerArns: [
            props.cognito_construct.userpools.brand.userpool.userPoolArn,
          ],
          restApiId: props.rest_api_construct.restApiId,
          type: AuthorizationType.COGNITO,
        },
      ),
      third_party: new CfnAuthorizer(
        this,
        `Polytag-Third-Party-Authorizer-${props.environment}-BACK`,
        {
          name: `third-party-cognito-authorizer-${props.environment}-Backend-API`,
          identitySource: 'method.request.header.Authorization',
          providerArns: [
            props.cognito_construct.userpools.third_party.userpool.userPoolArn,
          ],
          restApiId: props.rest_api_construct.restApiId,
          type: AuthorizationType.COGNITO,
        },
      ),
      mrf: new CfnAuthorizer(
        this,
        `Polytag-Mrf-Authorizer-${props.environment}-BACK`,
        {
          name: `mrf-cognito-authorizer-${props.environment}-Backend-API`,
          identitySource: 'method.request.header.Authorization',
          providerArns: [
            props.cognito_construct.userpools.mrf.userpool.userPoolArn,
          ],
          restApiId: props.rest_api_construct.restApiId,
          type: AuthorizationType.COGNITO,
        },
      ),
      printer: new CfnAuthorizer(
        this,
        `Polytag-Printer-Authorizer-${props.environment}-BACK`,
        {
          name: `printer-cognito-authorizer-${props.environment}-Backend-API`,
          identitySource: 'method.request.header.Authorization',
          providerArns: [
            props.cognito_construct.userpools.printer.userpool.userPoolArn,
          ],
          restApiId: props.rest_api_construct.restApiId,
          type: AuthorizationType.COGNITO,
        },
      ),
    };
  }
}
