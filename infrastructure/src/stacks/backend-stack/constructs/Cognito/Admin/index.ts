/* ---------- External ---------- */
import {
  UserPool,
  UserPoolClient,
  UserPoolDomain,
  StringAttribute,
  VerificationEmailStyle,
  OAuthScope,
  CfnUserPoolGroup,
} from 'aws-cdk-lib/aws-cognito';
import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';
import { Groups } from '_stacks/backend-stack/constructs/Cognito/Admin/@types';

/* ---------- Constructs ---------- */
import { KMSConstruct } from '_stacks/backend-stack/constructs/KMS';
import { LambdasConstruct } from '_stacks/backend-stack/constructs/Lambdas';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  kms_construct: KMSConstruct;
  lambdas_construct: LambdasConstruct;
}

export class CognitoAdminConstruct extends Construct {
  public readonly userpool: UserPool;

  public readonly userpool_client: UserPoolClient;

  public readonly userpool_domain: UserPoolDomain;

  public readonly groups: Groups;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { admin_redirect_url }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.userpool = new UserPool(scope, `ADMIN-Userpool-${props.environment}`, {
      removalPolicy:
        props.environment === 'PROD'
          ? RemovalPolicy.RETAIN
          : RemovalPolicy.DESTROY,
      userPoolName: `Admin-Users-${props.environment}`,
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
        full_name: new StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireUppercase: true,
        requireSymbols: true,
      },
      selfSignUpEnabled: true,
      userVerification: {
        emailStyle: VerificationEmailStyle.CODE,
      },
      lambdaTriggers: {
        customEmailSender:
          props.lambdas_construct.lambdas.triggers.cognito_email.function,
      },
      customSenderKmsKey: props.kms_construct.kms_key,
    });

    this.userpool_client = new UserPoolClient(
      scope,
      `ADMIN-Userpool-Client-${props.environment}`,
      {
        userPool: this.userpool,
        oAuth: {
          flows: {
            authorizationCodeGrant: true,
            implicitCodeGrant: true,
          },
          callbackUrls: [
            'http://localhost:3000/login',
            `${admin_redirect_url}/login`,
          ],
          logoutUrls: ['http://localhost:3000/', admin_redirect_url],
          scopes: [
            OAuthScope.EMAIL,
            OAuthScope.OPENID,
            OAuthScope.COGNITO_ADMIN,
            OAuthScope.PROFILE,
          ],
        },
        authFlows: {
          adminUserPassword: true,
          userPassword: true,
          userSrp: true,
        },
        refreshTokenValidity: Duration.days(31),
        accessTokenValidity: Duration.days(1),
        idTokenValidity: Duration.days(1),
      },
    );

    this.userpool_domain = new UserPoolDomain(
      scope,
      `Admin-UserpoolDomain-${props.environment}`,
      {
        userPool: this.userpool,
        cognitoDomain: {
          domainPrefix: `polytag-admin-${props.environment.toLocaleLowerCase()}`,
        },
      },
    );

    this.groups = {
      admin: new CfnUserPoolGroup(
        scope,
        `UserpoolGroup-Admin-${props.environment}`,
        {
          userPoolId: this.userpool.userPoolId,
          description: 'Group for polytag admin users',
          precedence: 2,
          groupName: 'polytag-admin',
        },
      ),
      super_admin: new CfnUserPoolGroup(
        scope,
        `UserpoolGroup-SuperAdmin-${props.environment}`,
        {
          userPoolId: this.userpool.userPoolId,
          description: 'Group for super admin polytag users',
          precedence: 1,
          groupName: 'polytag-super-admin',
        },
      ),
    };

    /* ---------- Tags ---------- */
    Tags.of(this.userpool).add('Custom:Service', 'Cognito');
    Tags.of(this.userpool).add('Custom:Userpool', 'Admin');
    Tags.of(this.userpool).add('Custom:Environment', props.environment);
  }
}
