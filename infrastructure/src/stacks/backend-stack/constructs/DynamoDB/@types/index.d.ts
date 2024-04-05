/* ---------- External ---------- */
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

/* ---------- Interfaces ---------- */
export interface GlobalSecondaryIndexes {
  index_name: string;
  partition_key: {
    name: string;
    type: AttributeType.STRING;
  };
  sort_key?: {
    name: string;
    type: AttributeType.STRING;
  };
}

export interface Tables {
  main_table: Table;
  labels_table: Table;
}

export interface EventSources {
  main_table_event_source: DynamoEventSource;
  labels_table_event_source: DynamoEventSource;
}
