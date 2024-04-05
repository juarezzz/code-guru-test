/* ---------- External ---------- */
import axios from 'axios';

/* ---------- Models ---------- */
import { ContactFormField } from '_modules/brand-contact/models';

/* ---------- Interfaces ---------- */
interface SendSlackMessageInput {
  persona: string;
  slack_channel_id: string;
  fields: ContactFormField[];
}

/* ---------- Function ---------- */
const send_slack_message = async ({
  fields,
  persona,
  slack_channel_id,
}: SendSlackMessageInput) => {
  const filtered_fields = fields.filter(
    field => field.value?.length || field.placeholder?.length,
  );

  const markdown_entries = filtered_fields.map(
    field => `*${field.label}*: ${field.value || field.placeholder}`,
  );

  return axios.post(process.env.SLACK_WEBHOOK_URL as string, {
    channel: slack_channel_id,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'New message received :rocket:',
          emoji: true,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'plain_text',
            text: `Persona: ${persona}`,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: markdown_entries.join('\n\n'),
        },
      },
    ],
  });
};

/* ---------- Export ---------- */
export { send_slack_message };
