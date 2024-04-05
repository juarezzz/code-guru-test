type CountDynamoDBData = Record<string, string>;
type BackupCognitoData = Record<string, string>;

interface ChoicesInCaseOfAll {
  analytics: {
    count_dynamodb_data: CountDynamoDBData;
    backup_cognito_data: BackupCognitoData;
  };
}

export const choices_in_case_of_all: ChoicesInCaseOfAll = {
  analytics: {
    count_dynamodb_data: {
      STG: 'new',
      PROD: 'old',
      DEV: 'new',
      PREPROD: 'new',
    },
    backup_cognito_data: {
      STG: 'eu-west-1_dQf3BhQZY',
      PROD: 'eu-west-1_nQCRpn9BT',
      DEV: 'eu-west-1_9MoBOsqum',
      PREPROD: 'eu-west-1_jF3TBkfUH',
    },
  },
};
