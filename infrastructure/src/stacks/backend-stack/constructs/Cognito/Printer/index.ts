/* ---------- External ---------- */
import {
  CfnUserPoolGroup,
  OAuthScope,
  StringAttribute,
  UserPool,
  UserPoolClient,
  UserPoolDomain,
  VerificationEmailStyle,
} from 'aws-cdk-lib/aws-cognito';
import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/* ---------- Constructs ---------- */
import { KMSConstruct } from '_stacks/backend-stack/constructs/KMS';
import { LambdasConstruct } from '_stacks/backend-stack/constructs/Lambdas';
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  kms_construct: KMSConstruct;
  lambdas_construct: LambdasConstruct;
}

interface Groups {
  admin: CfnUserPoolGroup;
}

export class CognitoPrinterConstruct extends Construct {
  public readonly groups: Groups;

  public readonly userpool: UserPool;

  public readonly userpool_client: UserPoolClient;

  public readonly userpool_domain: UserPoolDomain;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { redirect_url }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.userpool = new UserPool(
      scope,
      `Printer-Userpool-${props.environment}`,
      {
        removalPolicy:
          props.environment === 'PROD'
            ? RemovalPolicy.RETAIN
            : RemovalPolicy.DESTROY,
        userPoolName: `Printer-Users-${props.environment}`,
        selfSignUpEnabled: true,
        signInAliases: {
          email: true,
        },
        standardAttributes: {
          email: {
            required: true,
            mutable: true,
          },
        },
        customAttributes: {
          printer_id: new StringAttribute({ mutable: true }),
          full_name: new StringAttribute({ mutable: true }),
        },
        customSenderKmsKey: props.kms_construct.kms_key,
        passwordPolicy: {
          minLength: 8,
          requireDigits: true,
          requireUppercase: true,
          requireSymbols: false,
        },
        userVerification: {
          emailStyle: VerificationEmailStyle.CODE,
        },
        lambdaTriggers: {
          customEmailSender:
            props.lambdas_construct.lambdas.triggers.cognito_email.function,
        },
      },
    );

    this.userpool_client = new UserPoolClient(
      scope,
      `Printer-Userpool-Client${props.environment}`,
      {
        userPool: this.userpool,
        oAuth: {
          flows: {
            authorizationCodeGrant: true,
            implicitCodeGrant: true,
          },
          callbackUrls: [
            'http://localhost:3000/login',
            `${redirect_url}/login`,
          ],
          logoutUrls: ['http://localhost:3000/', redirect_url],
          scopes: [
            OAuthScope.EMAIL,
            OAuthScope.COGNITO_ADMIN,
            OAuthScope.PROFILE,
          ],
        },
        authFlows: {
          adminUserPassword: true,
          userPassword: true,
          userSrp: true,
        },
        idTokenValidity: Duration.days(1),
        accessTokenValidity: Duration.days(1),
        refreshTokenValidity: Duration.days(90),
      },
    );

    this.userpool_domain = new UserPoolDomain(
      scope,
      `Printer-UserpoolDomain-${props.environment}`,
      {
        userPool: this.userpool,
        cognitoDomain: {
          domainPrefix: `polytag-printer-${props.environment.toLocaleLowerCase()}`,
        },
      },
    );

    this.groups = {
      admin: new CfnUserPoolGroup(
        scope,
        `UserpoolGroup-Printer-${props.environment}`,
        {
          userPoolId: this.userpool.userPoolId,
          description: 'Group for printer admin users',
          precedence: 1,
          groupName: 'printer-admin',
        },
      ),
    };

    /* ---------- Tags ---------- */
    Tags.of(this.userpool).add('Custom:Service', 'Cognito');
    Tags.of(this.userpool).add('Custom:Userpool', 'Printer');
    Tags.of(this.userpool).add('Custom:Environment', props.environment);
  }
}
