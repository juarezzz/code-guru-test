/* ---------- External ---------- */
import { CfnDatabase, CfnTable } from 'aws-cdk-lib/aws-timestream';
import { Construct } from 'constructs';

/* ---------- Constructs ---------- */
import { BucketsConstruct } from '_stacks/backend-stack/constructs/Buckets';

/* ---------- Interfaces ---------- */
export interface Databases {
  main_database: CfnDatabase;
}

export interface Tables {
  main_table: CfnTable;
}

interface Props {
  buckets_construct: BucketsConstruct;
  environment: string;
}

export class TimestreamConstruct extends Construct {
  public readonly databases: Databases;

  public readonly tables: Tables;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.databases = {
      main_database: new CfnDatabase(
        scope,
        `Analytics-Main-Database-${props.environment}`,
        {
          databaseName: `Polytag-${props.environment}`,
        },
      ),
    };

    this.tables = {
      main_table: new CfnTable(
        scope,
        `Analytics-Main-Table-${props.environment}`,
        {
          tableName: `Polytag-${props.environment}`,
          databaseName: this.databases.main_database.databaseName as string,
          magneticStoreWriteProperties: {
            enableMagneticStoreWrites: true,
            magneticStoreRejectedDataLocation: {
              s3Configuration: {
                bucketName:
                  props.buckets_construct.buckets.backup_bucket.bucketName,
                encryptionOption: 'SSE_S3',
              },
            },
          },
          retentionProperties: {
            memoryStoreRetentionPeriodInHours: `${24 * 30}`,
            magneticStoreRetentionPeriodInDays: `${10 * 365}`,
          },
        },
      ),
    };

    this.node.addDependency(props.buckets_construct.buckets.backup_bucket);

    this.tables.main_table.addDependency(this.databases.main_database);
  }
}
