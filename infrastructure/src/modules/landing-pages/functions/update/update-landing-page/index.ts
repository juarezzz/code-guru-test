/* ---------- External ---------- */
import { UpdateCommandInput, UpdateCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { LandingPage } from '_modules/landing-pages/models';

/* ---------- Interfaces ---------- */
interface UpdateLandingPage {
  brand_id: string;
  campaigns_count: number;
  components: string;
  global_styles: string;
  landing_page_name: string;
  sort_key: string;
}

/* ---------- Function ---------- */
const update_landing_page = async ({
  brand_id,
  campaigns_count,
  components,
  global_styles,
  landing_page_name,
  sort_key,
}: UpdateLandingPage) => {
  const update_expression = [
    campaigns_count !== undefined && `campaigns_count = :campaigns_count`,
    components !== undefined && `#components = :components`,
    global_styles !== undefined && `global_styles = :global_styles`,
    landing_page_name !== undefined && `landing_page_name = :landing_page_name`,
    landing_page_name !== undefined && `#search = :search`,
    'updated_at = :updated_at',
  ]
    .filter(expression => expression)
    .join(', ');

  const expression_values: Record<string, string | string[] | number> = {
    ':updated_at': new Date().getTime(),
  };

  const expression_names: Record<string, string> = {
    '#partition_key': 'partition_key',
    '#sort_key': 'sort_key',
  };

  if (campaigns_count !== undefined)
    expression_values[':campaigns_count'] = campaigns_count;

  if (components !== undefined) {
    expression_values[':components'] = components;
    expression_names['#components'] = 'components';
  }

  if (global_styles !== undefined)
    expression_values[':global_styles'] = global_styles;

  if (landing_page_name !== undefined) {
    expression_values[':landing_page_name'] = landing_page_name;
    expression_values[':search'] = `brand-landing-page#${landing_page_name
      .replace(/\s/g, '_')
      .toLocaleLowerCase()}`;
    expression_names['#search'] = 'search';
  }

  const update_params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    ConditionExpression:
      'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key,
    },
    UpdateExpression: `
      SET ${update_expression}
    `,
    ExpressionAttributeValues: {
      ...expression_values,
    },
    ExpressionAttributeNames: {
      ...expression_names,
    },
    ReturnValues: 'ALL_NEW',
  };

  const command = new UpdateCommand(update_params);

  const { Attributes: ReturnedAttributes } = await dynamodb_documentclient.send(
    command,
  );

  return { landing_page: ReturnedAttributes as LandingPage };
};

/* ---------- Export ---------- */
export { update_landing_page };
