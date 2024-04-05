/* ---------- External ---------- */
import { DeleteCommandInput, DeleteCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
import { DeleteLandingPageTemplateInput } from '_modules/landing-page-templates/functions/delete/delete-landing-page-template/@types';

/* ---------- Function ---------- */
const delete_landing_page_template = async ({
  landing_page_template_id,
}: DeleteLandingPageTemplateInput) => {
  const params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: 'admin',
      sort_key: `landing-page-template#${landing_page_template_id}`,
    },
  };

  const command = new DeleteCommand(params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { delete_landing_page_template };
