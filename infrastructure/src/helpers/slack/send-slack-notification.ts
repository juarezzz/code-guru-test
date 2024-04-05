import axios from 'axios';

interface SlackNotificationInput {
  channel?: string;
  blocks: unknown[];
}

export const send_slack_notification = async ({
  channel = '#polytag-notifications',
  blocks,
}: SlackNotificationInput) => {
  await axios.post(process.env.SLACK_CHANNEL_URL as string, {
    channel,
    blocks,
  });
};
