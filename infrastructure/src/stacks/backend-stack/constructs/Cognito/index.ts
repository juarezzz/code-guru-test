/* ---------- External ---------- */

import { Construct } from 'constructs';

/* ---------- Constructs ---------- */
import { CognitoAdminConstruct } from '_stacks/backend-stack/constructs/Cognito/Admin';
import { CognitoBrandConstruct } from '_stacks/backend-stack/constructs/Cognito/Brand';
import { CognitoMrfConstruct } from '_stacks/backend-stack/constructs/Cognito/Mrf';
import { CognitoPrinterConstruct } from '_stacks/backend-stack/constructs/Cognito/Printer';
import { CognitoThirdPartyConstruct } from '_stacks/backend-stack/constructs/Cognito/ThirdParty';
import { KMSConstruct } from '_stacks/backend-stack/constructs/KMS';
import { LambdasConstruct } from '_stacks/backend-stack/constructs/Lambdas';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  kms_construct: KMSConstruct;
  lambdas_construct: LambdasConstruct;
}

interface Userpools {
  admin: CognitoAdminConstruct;
  brand: CognitoBrandConstruct;
  mrf: CognitoMrfConstruct;
  printer: CognitoPrinterConstruct;
  third_party: CognitoThirdPartyConstruct;
}

export class CognitoConstruct extends Construct {
  public readonly userpools: Userpools;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.userpools = {
      admin: new CognitoAdminConstruct(
        scope,
        `Userpools-Admin-${props.environment}`,
        {
          environment: props.environment,
          kms_construct: props.kms_construct,
          lambdas_construct: props.lambdas_construct,
        },
      ),
      brand: new CognitoBrandConstruct(
        scope,
        `Userpools-Brand-${props.environment}`,
        {
          environment: props.environment,
          kms_construct: props.kms_construct,
          lambdas_construct: props.lambdas_construct,
        },
      ),
      mrf: new CognitoMrfConstruct(
        scope,
        `Userpools-Mrf-${props.environment}`,
        {
          environment: props.environment,
          lambdas_construct: props.lambdas_construct,
          kms_construct: props.kms_construct,
        },
      ),
      printer: new CognitoPrinterConstruct(
        scope,
        `Userpools-Printer-${props.environment}`,
        {
          environment: props.environment,
          kms_construct: props.kms_construct,
          lambdas_construct: props.lambdas_construct,
        },
      ),
      third_party: new CognitoThirdPartyConstruct(
        scope,
        `Userpools-ThirdParty-${props.environment}`,
        {
          environment: props.environment,
          lambdas_construct: props.lambdas_construct,
          kms_construct: props.kms_construct,
        },
      ),
    };
  }
}
