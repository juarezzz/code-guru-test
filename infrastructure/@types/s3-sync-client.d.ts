declare module 's3-sync-client' {
  import { S3Client } from '@aws-sdk/client-s3';

  interface SyncOptions {
    /**
     * Files that exist in the destination but not
     * in the source are deleted during sync.
     *
     * default is false
     */
    del?: boolean;

    /**
     * Displays the operations that would
     * be performed using the specified
     * command without actually running them.
     *
     * default is false
     */
    dryRun?: boolean;
  }

  interface S3SyncClient {
    sync: (
      source: string,
      target: string,
      options?: SyncOptions,
    ) => Promise<void>;
  }

  interface S3SyncClientConstructor {
    client: S3Client;
  }

  class S3SyncClient {
    constructor({ client }: S3SyncClientConstructor);
  }

  export default S3SyncClient;
}
