/* ---------- External ---------- */
import {
  CfnUserPoolGroup,
  OAuthScope,
  StringAttribute,
  UserPool,
  UserPoolClient,
  UserPoolDomain,
  UserPoolEmail,
  VerificationEmailStyle,
} from 'aws-cdk-lib/aws-cognito';
import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';
import { Groups } from '_stacks/backend-stack/constructs/Cognito/Brand/@types';

/* ---------- Constructs ---------- */
import { KMSConstruct } from '_stacks/backend-stack/constructs/KMS';
import { LambdasConstruct } from '_stacks/backend-stack/constructs/Lambdas';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  kms_construct: KMSConstruct;
  lambdas_construct: LambdasConstruct;
}

export class CognitoBrandConstruct extends Construct {
  public readonly userpool: UserPool;

  public readonly userpool_client: UserPoolClient;

  public readonly userpool_domain: UserPoolDomain;

  public readonly groups: Groups;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { redirect_url, userpool }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.userpool = new UserPool(scope, `Userpool-${props.environment}`, {
      removalPolicy:
        props.environment === 'PROD'
          ? RemovalPolicy.RETAIN
          : RemovalPolicy.DESTROY,
      userPoolName: userpool,
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
        brand_id: new StringAttribute({ mutable: true }),
        roles: new StringAttribute({ mutable: true }),
        full_name: new StringAttribute({ mutable: true }),
        job_title: new StringAttribute({ mutable: true }),
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
        postAuthentication:
          props.lambdas_construct.lambdas.triggers.post_auth.function,
      },
      customSenderKmsKey: props.kms_construct.kms_key,
      email: UserPoolEmail.withSES({
        fromEmail: 'noreply@polyt.ag',
        fromName: 'Polytag',
      }),
    });

    this.userpool_client = new UserPoolClient(
      scope,
      `UserpoolClient-${props.environment}`,
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
        accessTokenValidity: Duration.minutes(15),
        idTokenValidity: Duration.minutes(15),
      },
    );

    this.userpool_domain = new UserPoolDomain(
      scope,
      `UserpoolDomain-${props.environment}`,
      {
        userPool: this.userpool,
        cognitoDomain: {
          domainPrefix: `polytag-${props.environment.toLocaleLowerCase()}`,
        },
      },
    );

    this.groups = {
      brand_admin: new CfnUserPoolGroup(
        scope,
        `UserpoolGroup-BrandAdmin-${props.environment}`,
        {
          userPoolId: this.userpool.userPoolId,
          description: 'Group for brand admin employees',
          precedence: 1,
          groupName: 'brand-admin',
        },
      ),
      brand_user: new CfnUserPoolGroup(
        scope,
        `UserpoolGroup-BrandUsers-${props.environment}`,
        {
          userPoolId: this.userpool.userPoolId,
          description: 'Group for brand users employees (archived)',
          precedence: 2,
          groupName: 'brand-users',
        },
      ),
      brand_analyst: new CfnUserPoolGroup(
        scope,
        `UserpoolGroup-BrandAnalyst-${props.environment}`,
        {
          userPoolId: this.userpool.userPoolId,
          description: 'Group for brand analyst employees',
          precedence: 2,
          groupName: 'brand-analyst',
        },
      ),
      brand_editor: new CfnUserPoolGroup(
        scope,
        `UserpoolGroup-BrandEditor-${props.environment}`,
        {
          userPoolId: this.userpool.userPoolId,
          description: 'Group for brand editor employees',
          precedence: 2,
          groupName: 'brand-editor',
        },
      ),
    };

    /* ---------- Tags ---------- */
    Tags.of(this.userpool).add('Custom:Service', 'Cognito');
    Tags.of(this.userpool).add('Custom:Userpool', 'Brand');
    Tags.of(this.userpool).add('Custom:Environment', props.environment);
  }
}
