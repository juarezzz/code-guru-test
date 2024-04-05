/* ---------- External ---------- */
import { getUnixTime } from 'date-fns';

/* ---------- Helpers ---------- */
import { send_slack_notification } from '_helpers/slack/send-slack-notification';
import { get_mrf_by_id } from '_modules/mrfs/functions/get/get-mrf-by-id';

/* ---------- Interfaces ---------- */
interface SendAlarmMessageInput {
  mrf_id: string;
  threshold: number;
}

/* ---------- Function ---------- */
const send_healthcheck_alarm_message = async ({
  mrf_id,
  threshold,
}: SendAlarmMessageInput) => {
  const unix_time = getUnixTime(new Date());

  const { mrf } = await get_mrf_by_id({ mrf_id });

  await send_slack_notification({
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `:rotating_light: UV Scans Healthcheck Alarm :rotating_light:`,
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
          text: `${
            mrf?.mrf_name ?? 'Unknown'
          } MRF did not send requests within the defined threshold period: ${
            threshold / 3600000
          }h`,
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
export { send_healthcheck_alarm_message };
