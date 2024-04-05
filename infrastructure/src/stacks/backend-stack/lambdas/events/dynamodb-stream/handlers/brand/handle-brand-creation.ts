/* ---------- External ---------- */
import { StreamRecord } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { getUnixTime } from 'date-fns';
import { GetCommand, GetCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Models ---------- */
import { Brand } from '_modules/brands/models';
import { User } from '_modules/users/models/user';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Helpers ---------- */
import { send_slack_notification } from '_helpers/slack/send-slack-notification';

/* ---------- Interfaces ---------- */
interface HandleCampaignCreationInput {
  item: StreamRecord;
}

/* ---------- Functions ---------- */
const handle_brand_creation = async ({ item }: HandleCampaignCreationInput) => {
  try {
    if (process.env.ENVIRONMENT !== 'PROD') return;

    const { NewImage } = item;

    if (!NewImage) return;

    const new_brand = unmarshall(
      NewImage as Record<string, AttributeValue>,
    ) as Brand;

    const current_unix_time = getUnixTime(new Date());

    const creation_unix_time = getUnixTime(new_brand.created_at);

    const creation_date = `<!date^${creation_unix_time}^{date_short}, {time}| >`;

    const params: GetCommandInput = {
      TableName: process.env.TABLE_NAME,
      Key: {
        partition_key: new_brand.partition_key,
        sort_key: `brand-user#${new_brand.created_by}`,
      },
    };

    const command = new GetCommand(params);

    const { Item } = await dynamodb_documentclient.send(command);

    const brand_user = Item as User;

    const brand_info = [
      {
        label: 'Brand name',
        value: `${new_brand.brand_name}`,
      },
      { label: 'Owner full name', value: brand_user.full_name || 'unknown' },
      { label: 'Owner job title', value: brand_user.job_title || 'unknown' },
      { label: 'Owner email', value: brand_user.email || 'unknown' },
      { label: 'Creation date', value: creation_date },
      { label: 'Organization size', value: new_brand.organisation_size },
      { label: 'Industry', value: new_brand.industry },
      { label: 'GS1 territory', value: new_brand.gs1_territory },
    ];

    await send_slack_notification({
      channel: '#onboarding',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'A new brand signed up! :tada:',
            emoji: true,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Brand information: ',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${brand_info
              .map(({ label, value }) => `*${label}*: ${value}`)
              .join('\n')}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `<!date^${current_unix_time}^{date_short} {time_secs}| >`,
            },
          ],
        },
      ],
    });
  } catch (err) {
    console.error('error at handle_brand_creation:');
    console.error(err);
  }
};

/* ---------- Exports ---------- */
export { handle_brand_creation };
