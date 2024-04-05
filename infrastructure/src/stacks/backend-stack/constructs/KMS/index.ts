/* ---------- External ---------- */
import { Duration, Tags } from 'aws-cdk-lib';
import { Key, KeySpec, KeyUsage } from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
}

export class KMSConstruct extends Construct {
  public readonly kms_key: Key;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.kms_key = new Key(scope, `CognitoKey-${props.environment}`, {
      description: 'Cognito Key',
      pendingWindow: Duration.days(7),
      enableKeyRotation: true,
      keySpec: KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: KeyUsage.ENCRYPT_DECRYPT,
      alias: `cognito-${props.environment}`,
    });

    /* ---------- Tags ---------- */
    Tags.of(this.kms_key).add('Custom:Service', 'KMS');
    Tags.of(this.kms_key).add('Custom:Environment', props.environment);
  }
}
