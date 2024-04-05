/* ---------- External ---------- */
import { DeleteCommandInput, DeleteCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { LandingPage } from '_modules/landing-pages/models';

/* ---------- Interfaces ---------- */
interface DeleteLandingPage {
  brand_id: string;
  landing_page_sort_key: string;
}

/* ---------- Function ---------- */
const delete_landing_page = async ({
  brand_id,
  landing_page_sort_key,
}: DeleteLandingPage) => {
  const params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: landing_page_sort_key,
    },
    ReturnValues: 'ALL_OLD',
  };

  const command = new DeleteCommand(params);

  const { Attributes } = await dynamodb_documentclient.send(command);

  return { landing_page: Attributes as LandingPage };
};

/* ---------- Export ---------- */
export { delete_landing_page };
