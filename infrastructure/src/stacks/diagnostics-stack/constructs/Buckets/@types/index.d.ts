/* ---------- External ---------- */
import { Bucket } from 'aws-cdk-lib/aws-s3';

/* ---------- Interfaces ---------- */
export interface Buckets {
  diagnostics_bucket: Bucket;
}
