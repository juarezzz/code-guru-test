/* ---------- Types ---------- */
import { Clients } from '__scripts/@types';

export type EnvironmentEnum = 'PROD' | 'PREPROD' | 'DEV' | 'TEST' | 'STG';

export interface StartCrawlerInput {
  crawler_name: string;
  clients: Clients;
}

export interface StartJobRunInput {
  job_name: string;
  target_db_name: string;
  glue_database_name: string;
  glue_table_name: string;
  clients: Clients;
}

export interface CognitoUserDump {
  Username: string;
  Attributes: { Name: string; Value: string }[];
  UserCreateDate: string;
  UserLastModifiedDate: string;
  Enable: boolean;
  UserStatus: string;
}
