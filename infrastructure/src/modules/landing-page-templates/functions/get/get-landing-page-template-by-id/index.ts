/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
import { GetLandingPageTemplateInput } from '_modules/landing-page-templates/functions/get/get-landing-page-template-by-id/@types';

/* ---------- Models ---------- */
import { LandingPageTemplate } from '_modules/landing-page-templates/models';

/* ---------- Function ---------- */
const get_landing_page_template_by_id = async ({
  landing_page_template_id,
}: GetLandingPageTemplateInput) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression:
      'sort_key = :sort_key AND partition_key = :partition_key',
    ExpressionAttributeValues: {
      ':sort_key': `landing-page-template#${landing_page_template_id}`,
      ':partition_key': 'admin',
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items) throw new Error('Landing page template not found');

  return {
    landing_page_template: Items[0] as LandingPageTemplate,
  };
};

/* ---------- Export ---------- */
export { get_landing_page_template_by_id };
