/* ---------- External ---------- */
import { CfnDatabase, CfnTable } from 'aws-cdk-lib/aws-timestream';
import { Construct } from 'constructs';

/* ---------- Interfaces ---------- */
export interface Databases {
  logs_database: CfnDatabase;
}

export interface Tables {
  logs_table: CfnTable;
}

interface Props {
  environment: string;
}

export class TimestreamConstruct extends Construct {
  public readonly databases: Databases;

  public readonly tables: Tables;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.databases = {
      logs_database: new CfnDatabase(
        scope,
        `Logs-Database-${props.environment}`,
        {
          databaseName: `Polytag-Logs-${props.environment}`,
        },
      ),
    };

    this.tables = {
      logs_table: new CfnTable(scope, `Logs-Table-${props.environment}`, {
        tableName: `Polytag-Logs-${props.environment}`,
        databaseName: this.databases.logs_database.databaseName as string,
        magneticStoreWriteProperties: {
          enableMagneticStoreWrites: true,
        },
        retentionProperties: {
          memoryStoreRetentionPeriodInHours: `${24 * 15}`,
          magneticStoreRetentionPeriodInDays: `${5 * 365}`,
        },
      }),
    };

    this.tables.logs_table.addDependency(this.databases.logs_database);
  }
}
