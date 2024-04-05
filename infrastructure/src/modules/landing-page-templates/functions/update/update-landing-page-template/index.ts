/* ---------- External ---------- */
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { LandingPageTemplate } from '_modules/landing-page-templates/models';

/* ---------- Interfaces ---------- */
import { UpdateLandingPageTemplateInput } from '_modules/landing-page-templates/functions/update/update-landing-page-template/@types';

/* ---------- Function ---------- */
const update_landing_page_template = async ({
  landing_page_template_id,
  landing_page_template_name,
  components,
  global_styles,
}: UpdateLandingPageTemplateInput) => {
  const update_expression = [
    components && `components = :components`,
    global_styles && `global_styles = :global_styles`,
    landing_page_template_name &&
      `landing_page_template_name = :landing_page_template_name`,
    'updated_at = :updated_at',
  ]
    .filter(expression => expression)
    .join(', ');

  const expression_values: Record<string, string | number> = {};

  if (components) expression_values[':components'] = components;
  if (global_styles) expression_values[':global_styles'] = global_styles;
  if (landing_page_template_name)
    expression_values[':landing_page_template_name'] =
      landing_page_template_name;

  expression_values[':updated_at'] = Date.now();

  const params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    ConditionExpression:
      'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
    Key: {
      partition_key: 'admin',
      sort_key: `landing-page-template#${landing_page_template_id}`,
    },
    ExpressionAttributeValues: {
      ...expression_values,
    },
    ExpressionAttributeNames: {
      '#partition_key': 'partition_key',
      '#sort_key': 'sort_key',
    },
    UpdateExpression: `
      SET ${update_expression}
    `,
    ReturnValues: 'ALL_NEW',
  };

  const command = new UpdateCommand(params);

  const { Attributes } = await dynamodb_documentclient.send(command);

  return { landing_page_template: Attributes as LandingPageTemplate };
};

/* ---------- Export ---------- */
export { update_landing_page_template };
