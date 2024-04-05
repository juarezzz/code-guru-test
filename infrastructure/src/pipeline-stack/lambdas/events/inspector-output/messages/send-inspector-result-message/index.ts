/* ---------- External ---------- */
import { getUnixTime } from 'date-fns';
import { groupBy } from 'lodash';

/* ---------- Helpers ---------- */
import { send_slack_notification } from '_helpers/slack/send-slack-notification';

/* ---------- Interfaces ---------- */
import { CustomFinding } from '../../handler';

interface SendInspectorMessageInput {
  findings: Record<string, CustomFinding>;
  url: string;
}

/* ---------- Function ---------- */
const send_inspector_result_message = async ({
  findings,
  url,
}: SendInspectorMessageInput) => {
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
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${
            Object.keys(findings).length
          } vulnerabilities found in lambdas:`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: Object.entries(groupBy(Object.values(findings), 'severity'))
            .map(
              ([severity, findings_array]) =>
                `*${severity}*: ${findings_array.length}`,
            )
            .join('\n'),
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            style: 'primary',
            text: {
              type: 'plain_text',
              text: 'See Inspector report',
              emoji: true,
            },
            url,
            value: 'view-inspector-report',
          },
        ],
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
export { send_inspector_result_message };
