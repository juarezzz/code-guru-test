/* ---------- External ---------- */
import { getUnixTime } from 'date-fns';

/* ---------- Helpers ---------- */
import { send_slack_notification } from '_helpers/slack/send-slack-notification';

interface Payload {
  success: boolean;
  stack: string;
  environment: string;
}

export const handler = async ({ success, environment, stack }: Payload) => {
  const unix_time = getUnixTime(new Date());

  await send_slack_notification({
    channel: '#test-reports',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Deployment - <!date^${unix_time}^{date_num}| >`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: success
            ? `Successful deployment completed on ${environment} ${stack} Stack. ✅`
            : `Failed deployment on ${environment} ${stack} Stack. ❌`,
        },
      },
    ],
  });
};
