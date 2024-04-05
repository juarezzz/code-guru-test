/* ---------- External ---------- */
import {
  CfnUserPoolGroup,
  StringAttribute,
  UserPool,
  UserPoolClient,
  VerificationEmailStyle,
} from 'aws-cdk-lib/aws-cognito';
import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/* ---------- Constructs ---------- */
import { LambdasConstruct } from '_stacks/backend-stack/constructs/Lambdas';
import { KMSConstruct } from '_stacks/backend-stack/constructs/KMS';

/* ---------- Interfaces ---------- */
interface Props {
  lambdas_construct: LambdasConstruct;
  environment: string;
  kms_construct: KMSConstruct;
}

interface Groups {
  admin: CfnUserPoolGroup;
  labels: CfnUserPoolGroup;
}

export class CognitoThirdPartyConstruct extends Construct {
  public readonly userpool: UserPool;

  public readonly userpool_client: UserPoolClient;

  public readonly groups: Groups;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.userpool = new UserPool(
      scope,
      `ThirdParty-Userpool-${props.environment}`,
      {
        removalPolicy:
          props.environment === 'PROD'
            ? RemovalPolicy.RETAIN
            : RemovalPolicy.DESTROY,
        userPoolName: `ThirdParty-Users-${props.environment}`,
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
          third_party_id: new StringAttribute({ mutable: true }),
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
        },
        customSenderKmsKey: props.kms_construct.kms_key,
      },
    );

    this.userpool_client = this.userpool.addClient(
      `ThirdParty-Userpool-Client${props.environment}`,
      {
        preventUserExistenceErrors: true,
        generateSecret: false,
        authFlows: {
          userPassword: true,
          userSrp: true,
          custom: true,
        },
        oAuth: {
          flows: {
            implicitCodeGrant: true,
          },
        },
        idTokenValidity: Duration.days(1),
        refreshTokenValidity: Duration.days(180),
      },
    );

    this.groups = {
      admin: new CfnUserPoolGroup(
        scope,
        `UserpoolGroup-ThirdParty-${props.environment}`,
        {
          userPoolId: this.userpool.userPoolId,
          description: 'Group for third-party admin users',
          precedence: 1,
          groupName: 'third-party-admin',
        },
      ),
      labels: new CfnUserPoolGroup(
        scope,
        `UserpoolGroup-ThirdPartyLabels-${props.environment}`,
        {
          userPoolId: this.userpool.userPoolId,
          description:
            'Group for third-party users that are allowed to retrieve and update labels information',
          precedence: 1,
          groupName: 'third-party-labels',
        },
      ),
    };

    /* ---------- Tags ---------- */
    Tags.of(this.userpool).add('Custom:Service', 'Cognito');
    Tags.of(this.userpool).add('Custom:Userpool', 'Third Party');
    Tags.of(this.userpool).add('Custom:Environment', props.environment);
  }
}
