/* ---------- External ---------- */
import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
  Operation,
} from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { RemovalPolicy, Tags } from 'aws-cdk-lib';
import {
  FilterCriteria,
  FilterRule,
  StartingPosition,
} from 'aws-cdk-lib/aws-lambda';
import {
  Alarm,
  ComparisonOperator,
  TreatMissingData,
} from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';
import {
  GlobalSecondaryIndexes,
  Tables,
  EventSources,
} from '_stacks/backend-stack/constructs/DynamoDB/@types';

/* ---------- Constructs ---------- */
import { SNSConstruct } from '../SNS';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  sns_construct: SNSConstruct;
}

export class DynamoDBConstruct extends Construct {
  public readonly event_sources: EventSources;

  public readonly global_secondary_indexes: GlobalSecondaryIndexes[];

  public readonly tables: Tables;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name, labels_table_name }: CDK.Context =
      this.node.tryGetContext(props.environment);

    this.tables = {
      main_table: new Table(scope, `MainTable-${props.environment}`, {
        tableName: table_name,
        partitionKey: { name: 'partition_key', type: AttributeType.STRING },
        sortKey: { name: 'sort_key', type: AttributeType.STRING },
        billingMode: BillingMode.PAY_PER_REQUEST,
        removalPolicy:
          props.environment === 'PROD'
            ? RemovalPolicy.RETAIN
            : RemovalPolicy.DESTROY,
        timeToLiveAttribute: 'timetolive',
        stream: StreamViewType.NEW_AND_OLD_IMAGES,
        pointInTimeRecovery: props.environment === 'PROD',
      }),
      labels_table: new Table(scope, `LabelsTable-${props.environment}`, {
        tableName: labels_table_name,
        partitionKey: { name: 'partition_key', type: AttributeType.STRING },
        sortKey: { name: 'sort_key', type: AttributeType.STRING },
        billingMode: BillingMode.PAY_PER_REQUEST,
        removalPolicy:
          props.environment === 'PROD'
            ? RemovalPolicy.RETAIN
            : RemovalPolicy.DESTROY,
        timeToLiveAttribute: 'timetolive',
        stream: StreamViewType.NEW_AND_OLD_IMAGES,
        pointInTimeRecovery: props.environment === 'PROD',
      }),
    };

    this.global_secondary_indexes = [
      {
        index_name: 'datatype-index',
        partition_key: { name: 'datatype', type: AttributeType.STRING },
      },
      {
        index_name: 'datatype-pk-index',
        partition_key: {
          name: 'datatype',
          type: AttributeType.STRING,
        },
        sort_key: {
          name: 'partition_key',
          type: AttributeType.STRING,
        },
      },
      {
        index_name: 'datatype-sk-index',
        partition_key: {
          name: 'datatype',
          type: AttributeType.STRING,
        },
        sort_key: {
          name: 'sort_key',
          type: AttributeType.STRING,
        },
      },
      {
        index_name: 'search-pk-index',
        partition_key: {
          name: 'partition_key',
          type: AttributeType.STRING,
        },
        sort_key: {
          name: 'search',
          type: AttributeType.STRING,
        },
      },
      {
        index_name: 'filter-sk-index',
        partition_key: {
          name: 'filter',
          type: AttributeType.STRING,
        },
        sort_key: {
          name: 'sort_key',
          type: AttributeType.STRING,
        },
      },
    ];

    this.event_sources = {
      main_table_event_source: new DynamoEventSource(this.tables.main_table, {
        startingPosition: StartingPosition.LATEST,
        reportBatchItemFailures: true,
        retryAttempts: 3,
      }),
      labels_table_event_source: new DynamoEventSource(
        this.tables.labels_table,
        {
          startingPosition: StartingPosition.LATEST,
          reportBatchItemFailures: true,
          retryAttempts: 3,
          filters: [
            FilterCriteria.filter({
              dynamodb: {
                NewImage: {
                  datatype: { S: FilterRule.isEqual('printer-labels-request') },
                },
              },
            }),
          ],
        },
      ),
    };

    this.global_secondary_indexes.forEach(
      ({ index_name, partition_key, sort_key }) =>
        this.tables.main_table.addGlobalSecondaryIndex({
          indexName: index_name,
          partitionKey: partition_key,
          sortKey: sort_key,
        }),
    );

    this.tables.labels_table.addGlobalSecondaryIndex({
      indexName: 'datatype-sk-index',
      partitionKey: {
        name: 'datatype',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'sort_key',
        type: AttributeType.STRING,
      },
    });

    /* ---------- Alarms ---------- */
    if (props.environment === 'PROD') {
      new Alarm(scope, `DynamoDB-Throttle-Alarm-${props.environment}`, {
        alarmName: `DynamoDB-Throttle-Alarm-${props.environment}`,
        metric: this.tables.main_table.metricThrottledRequestsForOperations({
          operations: [
            Operation.PUT_ITEM,
            Operation.BATCH_WRITE_ITEM,
            Operation.QUERY,
          ],
        }),
        alarmDescription: `This alarms watches the number of throttled operations happening in the DynamoDB Main Table.`,
        threshold: 1,
        evaluationPeriods: 5,
        datapointsToAlarm: 1,
        treatMissingData: TreatMissingData.NOT_BREACHING,
        comparisonOperator:
          ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }).addAlarmAction(
        new SnsAction(props.sns_construct.cloudwatch_alarms_topic),
      );

      new Alarm(scope, `DynamoDB-System-Errors-Alarm-${props.environment}`, {
        alarmName: `DynamoDB-System-Errors-Alarm-${props.environment}`,
        metric: this.tables.main_table.metricSystemErrorsForOperations({
          operations: [
            Operation.PUT_ITEM,
            Operation.BATCH_WRITE_ITEM,
            Operation.QUERY,
            Operation.GET_ITEM,
            Operation.DELETE_ITEM,
            Operation.UPDATE_ITEM,
          ],
        }),
        alarmDescription: `This alarms watches the number of systems errors happening in the DynamoDB Main Table. If this alarm is fired it could be that DynamoDB is facing some downtime at the moment.`,
        threshold: 1,
        evaluationPeriods: 5,
        datapointsToAlarm: 1,
        treatMissingData: TreatMissingData.NOT_BREACHING,
        comparisonOperator:
          ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }).addAlarmAction(
        new SnsAction(props.sns_construct.cloudwatch_alarms_topic),
      );
    }

    /* ---------- Tags ---------- */
    Tags.of(this.tables.main_table).add('Custom:Service', 'Dynamo');
    Tags.of(this.tables.main_table).add(
      'Custom:Environment',
      props.environment,
    );

    Tags.of(this.tables.labels_table).add('Custom:Service', 'Dynamo');
    Tags.of(this.tables.labels_table).add(
      'Custom:Environment',
      props.environment,
    );
  }
}
