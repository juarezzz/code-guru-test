/* ---------- External ---------- */
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { ARecord } from 'aws-cdk-lib/aws-route53';

/* ---------- Interfaces ---------- */
export interface Distributions {
  analytics_edge: Distribution;
}

export interface ARecords {
  analytics_edge: ARecord;
}
