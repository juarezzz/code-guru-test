/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { CmsWebsite } from '_modules/cms/models';

/* ---------- Interfaces ---------- */
interface GetCMSDataInput {
  language: string;
}

export const get_cms_data = async ({ language }: GetCMSDataInput) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-sk-index',
    KeyConditionExpression:
      'datatype = :datatype AND begins_with(sort_key, :sort_key_prefix)',
    ExpressionAttributeValues: {
      ':datatype': 'cms-website',
      ':sort_key_prefix': `cms-website#${language}#`,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items || Items.length === 0) return { cms_website: null };

  return { cms_website: Items[Items.length - 1] as CmsWebsite };
};
