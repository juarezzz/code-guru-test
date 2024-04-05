/* ---------- External ---------- */
import { Construct } from 'constructs';
import { NestedStackProps, NestedStack } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { Route53Construct } from '_stacks/certificates/certificate-web-stack/constructs/Route53';

/* ---------- Interfaces ---------- */
interface Props extends NestedStackProps {
  environment: string;
  stack_name: string;
}

export class CertificateWebStack extends NestedStack {
  public readonly route_53_construct: Route53Construct;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    this.route_53_construct = new Route53Construct(
      this,
      `Route53-Construct-Web-${props.environment}`,
      {
        environment: props.environment,
      },
    );
  }
}
