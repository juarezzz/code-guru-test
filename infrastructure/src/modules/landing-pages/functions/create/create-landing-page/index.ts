/* ---------- External ---------- */
import { PutCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { LandingPage } from '_modules/landing-pages/models';

/* ---------- Interfaces ---------- */
interface CreateLandingPage {
  brand_id: string;
  components: string;
  global_styles: string;
  landing_page_name: string;
  user_id: string;
}

/* ---------- Function ---------- */
const create_landing_page = async ({
  brand_id,
  components,
  global_styles,
  landing_page_name,
  user_id,
}: CreateLandingPage) => {
  const landing_page_sk = uuidv4();

  const landing_page: LandingPage = {
    campaigns_count: 0,
    components,
    created_at: new Date().getTime(),
    created_by: user_id,
    datatype: 'brand-landing-page',
    global_styles,
    landing_page_name,
    partition_key: `brand#${brand_id}`,
    search: `brand-landing-page#${landing_page_name
      .replace(/\s/g, '_')
      .toLocaleLowerCase()}`,
    sort_key: `brand-landing-page#${landing_page_sk}`,
    updated_at: new Date().getTime(),
  };

  const put_params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: landing_page,
  };

  const command = new PutCommand(put_params);

  await dynamodb_documentclient.send(command);

  return { landing_page };
};

/* ---------- Export ---------- */
export { create_landing_page };
