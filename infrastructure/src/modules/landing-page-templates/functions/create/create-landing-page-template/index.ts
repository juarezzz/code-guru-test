/* ---------- External ---------- */
import { PutCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { LandingPageTemplate } from '_modules/landing-page-templates/models';

/* ---------- Interfaces ---------- */
interface CreateLandingPageTemplateInput {
  components: string;
  created_by: string;
  global_styles: string;
  landing_page_template_name: string;
}

/* ---------- Function ---------- */
const create_landing_page_template = async ({
  created_by,
  components,
  global_styles,
  landing_page_template_name,
}: CreateLandingPageTemplateInput) => {
  const landing_page_template_id = uuidv4();

  const landing_page_template: LandingPageTemplate = {
    created_at: new Date().getTime(),
    created_by,
    datatype: 'landing-page-template',
    components,
    global_styles,
    landing_page_template_name,
    partition_key: 'admin',
    sort_key: `landing-page-template#${landing_page_template_id}`,
    updated_at: new Date().getTime(),
  };

  const params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: landing_page_template,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return { landing_page_template };
};

/* ---------- Export ---------- */
export { create_landing_page_template };
