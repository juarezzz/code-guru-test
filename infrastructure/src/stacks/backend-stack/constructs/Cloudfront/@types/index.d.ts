/* ---------- External ---------- */
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { ARecord } from 'aws-cdk-lib/aws-route53';

/* ---------- Interfaces ---------- */
export interface Distributions {
  resolver: Distribution;
  mixpanel_proxy: Distribution;
}

export interface ARecords {
  resolver: ARecord;
}
