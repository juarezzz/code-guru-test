/* ---------- External ---------- */
import { StreamRecord } from 'aws-lambda';

/* ---------- Interfaces ---------- */
export interface Failure {
  batchItemFailures: { itemIdentifier: string | undefined }[];
}

export interface Handler {
  ({ item }: { item: StreamRecord }): Promise<void>;
}
