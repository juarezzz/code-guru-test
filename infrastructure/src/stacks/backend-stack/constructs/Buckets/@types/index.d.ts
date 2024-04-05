/* ---------- External ---------- */
import { Bucket } from 'aws-cdk-lib/aws-s3';

/* ---------- Interfaces ---------- */
export interface Buckets {
  main_bucket: Bucket;
  backup_bucket: Bucket;
}
