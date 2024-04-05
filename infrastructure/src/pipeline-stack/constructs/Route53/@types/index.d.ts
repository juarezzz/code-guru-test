/* ---------- External ---------- */
import { DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { IHostedZone } from 'aws-cdk-lib/aws-route53';

/* ---------- Interfaces ---------- */
export interface Certificates {
  polytag: DnsValidatedCertificate;
}

export interface HostedZones {
  polytag: IHostedZone;
}
