/* ---------- External ---------- */
import { getUnixTime } from 'date-fns';

/* ---------- Helpers ---------- */
import { send_slack_notification } from '_helpers/slack/send-slack-notification';

/* ---------- Interfaces ---------- */
interface SendInternalErrorMessageInput {
  internal_error_message: string;
}

/* ---------- Function ---------- */
const send_internal_error_message = async ({
  internal_error_message,
}: SendInternalErrorMessageInput) => {
  const unix_time = getUnixTime(new Date());
  const test_date = new Date()
    .toLocaleString('en-GB', {
      timeZone: 'Europe/London',
    })
    .toUpperCase();

  await send_slack_notification({
    channel: '#test-reports',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `Inspector Findings - ${test_date}`,
          emoji: true,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '❌ An *internal error* ocurred while running the tests',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'plain_text',
            text: "The lambda encountered an error it didn't know how to handle.",
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Error message:*',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: internal_error_message,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<!date^${unix_time}^{date_short} {time_secs}| >`,
          },
        ],
      },
    ],
  });
};

/* ---------- Export ---------- */
export { send_internal_error_message };
