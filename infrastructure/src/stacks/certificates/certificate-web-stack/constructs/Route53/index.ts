/* ---------- External ---------- */
import {
  Certificate,
  CertificateValidation,
} from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Props ---------- */
interface Props {
  environment: string;
}

interface HostedZones {
  polytag: IHostedZone;
}

export class Route53Construct extends Construct {
  public readonly hosted_zones: HostedZones;

  public readonly polytag_certificate: Certificate;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.hosted_zones = {
      polytag: HostedZone.fromLookup(
        scope,
        `HostedZone-Web-${props.environment}`,
        {
          domainName: 'polyt.ag',
        },
      ),
    };

    this.polytag_certificate = new Certificate(
      scope,
      `Polytag-ACM-Certificate-Web-${props.environment}`,
      {
        domainName: domain_name,
        certificateName:
          `polytag-certificate-web-${props.environment}`.toLowerCase(),
        subjectAlternativeNames: ['*.polyt.ag'],
        validation: CertificateValidation.fromDns(this.hosted_zones.polytag),
      },
    );
  }
}
