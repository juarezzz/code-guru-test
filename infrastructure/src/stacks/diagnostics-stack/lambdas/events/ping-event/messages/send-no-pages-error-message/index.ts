/* ---------- External ---------- */
import { format, getUnixTime } from 'date-fns';

/* ---------- Helpers ---------- */
import { send_slack_notification } from '_helpers/slack/send-slack-notification';

/* ---------- Function ---------- */
const send_no_pages_error_message = async () => {
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
          text: ':grey_question: *No* active landing pages found.',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'plain_text',
            text: "Ignore this message if that's how it should be :)",
          },
        ],
      },
      {
        type: 'divider',
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
export { send_no_pages_error_message };
