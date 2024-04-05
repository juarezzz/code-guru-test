/* ---------- External ---------- */
import { DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';
import {
  Certificates,
  HostedZones,
} from '_pipeline-stack/constructs/Route53/@types';

/* ---------- Props ---------- */
interface Props {
  environment: string;
}

export class Route53Construct extends Construct {
  public readonly certificates: Certificates;

  public readonly hosted_zones: HostedZones;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.hosted_zones = {
      polytag: HostedZone.fromLookup(
        scope,
        `RestAPI-HostedZone-${props.environment}-PIPE`,
        {
          domainName: 'polyt.ag',
        },
      ),
    };

    this.certificates = {
      polytag: new DnsValidatedCertificate(
        scope,
        'RestAPI-ACM-Certificate-PIPE',
        {
          domainName: domain_name,
          region: 'us-east-1',
          hostedZone: this.hosted_zones.polytag,
          subjectAlternativeNames: ['*.polyt.ag'],
        },
      ),
    };
  }
}
