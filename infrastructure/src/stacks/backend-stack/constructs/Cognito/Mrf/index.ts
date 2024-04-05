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

/* ---------- Constructs ---------- */
import { LambdasConstruct } from '_stacks/backend-stack/constructs/Lambdas';
import { KMSConstruct } from '_stacks/backend-stack/constructs/KMS';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props {
  lambdas_construct: LambdasConstruct;
  environment: string;
  kms_construct: KMSConstruct;
}

interface Groups {
  admin: CfnUserPoolGroup;
  viewer: CfnUserPoolGroup;
}

export class CognitoMrfConstruct extends Construct {
  public readonly groups: Groups;

  public readonly userpool: UserPool;

  public readonly userpool_client: UserPoolClient;

  public readonly userpool_domain: UserPoolDomain;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { redirect_url }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.userpool = new UserPool(scope, `MRF-Userpool-${props.environment}`, {
      removalPolicy:
        props.environment === 'PROD'
          ? RemovalPolicy.RETAIN
          : RemovalPolicy.DESTROY,
      userPoolName: `MRF-Users-${props.environment}`,
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
        mrf_id: new StringAttribute({ mutable: true }),
        roles: new StringAttribute({ mutable: true }),
        full_name: new StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireUppercase: true,
        requireSymbols: true,
      },
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
      `MRF-Userpool-Client${props.environment}`,
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
      `RC-Portal-UserpoolDomain-${props.environment}`,
      {
        userPool: this.userpool,
        cognitoDomain: {
          domainPrefix: `polytag-rc-portal-${props.environment.toLocaleLowerCase()}`,
        },
      },
    );

    this.groups = {
      admin: new CfnUserPoolGroup(
        scope,
        `UserpoolGroup-MRF-${props.environment}`,
        {
          userPoolId: this.userpool.userPoolId,
          description: 'Group for mrf admin users',
          precedence: 1,
          groupName: 'mrf-admin',
        },
      ),
      viewer: new CfnUserPoolGroup(
        scope,
        `UserpoolGroup-MRF-Viewer-${props.environment}`,
        {
          userPoolId: this.userpool.userPoolId,
          description: 'Group for MRF users with view access only',
          precedence: 2,
          groupName: 'mrf-viewer',
        },
      ),
    };

    /* ---------- Tags ---------- */
    Tags.of(this.userpool).add('Custom:Service', 'Cognito');
    Tags.of(this.userpool).add('Custom:Userpool', 'Mrf');
    Tags.of(this.userpool).add('Custom:Environment', props.environment);
  }
}
