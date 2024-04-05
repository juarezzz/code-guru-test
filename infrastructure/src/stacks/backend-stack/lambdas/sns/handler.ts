/* -------------- External -------------- */
import { SNSHandler } from 'aws-lambda';

/* -------------- Helpers -------------- */
import { send_slack_notification } from '_helpers/slack/send-slack-notification';

/* -------------- Interfaces -------------- */
interface AlarmEvent {
  AlarmName: string;
  AlarmDescription?: string;
  Trigger: {
    MetricName?: string;
    Dimensions: { value: string; name: string }[];
    Threshold: number;
    Unit?: string;
    Metrics?: [{ Label: string }];
  };
}

/* ---------- Functions ---------- */
export const handler: SNSHandler = async (event, _, callback) => {
  const { Sns } = event.Records[0];
  const { Message } = Sns;
  const parsed: AlarmEvent = JSON.parse(Message);

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: ':rotating_light: Metrics Alarm :rotating_light:',
      },
    },
    {
      type: 'divider',
    },
  ];

  const {
    AlarmName,
    AlarmDescription,
    Trigger: { MetricName, Threshold, Unit, Metrics },
  } = parsed;

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${AlarmName}* was triggered by the metric: *${
        MetricName || Metrics?.[0]?.Label || 'Unspecified'
      }* \n *Defined Threshold*: ${Threshold} ${Unit ?? ''}`,
    },
  });

  if (AlarmDescription)
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Description* \n ${AlarmDescription}`,
      },
    });

  await send_slack_notification({ blocks });

  return callback(null);
};
