/* ---------- External ---------- */
import { format, getUnixTime } from 'date-fns';

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
  const test_date = format(new Date(), 'dd/MM/yyyy');

  await send_slack_notification({
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `Landing Pages Health Check Results - ${test_date}`,
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
            text: "The health check lambda encountered an error it didn't know how to handle.",
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
