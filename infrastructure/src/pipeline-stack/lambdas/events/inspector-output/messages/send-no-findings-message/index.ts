/* ---------- External ---------- */
import { getUnixTime } from 'date-fns';

/* ---------- Helpers ---------- */
import { send_slack_notification } from '_helpers/slack/send-slack-notification';

/* ---------- Function ---------- */
const send_no_findings_error_message = async () => {
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
          text: 'No problems found',
        },
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
export { send_no_findings_error_message };
