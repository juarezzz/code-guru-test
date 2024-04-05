/* -------------- External -------------- */
import {
  CloudWatchClient,
  GetMetricDataCommand,
  MetricDataQuery,
} from '@aws-sdk/client-cloudwatch';
import { Context, Callback, ScheduledEvent } from 'aws-lambda';

/* -------------- Helpers -------------- */
import { send_slack_notification } from '_helpers/slack/send-slack-notification';

/* ---------- Constants ---------- */
const METRICS_QUERY_LIST: MetricDataQuery[] = [
  {
    Id: `lambda_errors`,
    Expression: `SELECT SUM(Errors) FROM Schema("AWS/Lambda", FunctionName) GROUP BY FunctionName`,
    Period: 60 * 60,
  },
  {
    Id: `lambda_duration`,
    Expression: `SELECT AVG(Duration) FROM Schema("AWS/Lambda", FunctionName) GROUP BY FunctionName`,
    Period: 60 * 60,
  },
];

const THRESHOLDS = {
  lambda_errors: { value: 1, unit: 'error' },
  lambda_duration: {
    default: { value: 15000, unit: 'ms' },
    'third-party': { value: 500, unit: 'ms' },
  },
} as const;

export const handler = async (
  event: ScheduledEvent,
  _: Context,
  callback: Callback,
): Promise<void> => {
  const cloudwatch_client = new CloudWatchClient({});

  const current_date = new Date();
  const one_hour_ago_date = new Date();
  one_hour_ago_date.setUTCHours(current_date.getUTCHours() - 1);

  const command_promises = METRICS_QUERY_LIST.map(metric => {
    const command = new GetMetricDataCommand({
      MetricDataQueries: [metric],
      EndTime: current_date,
      StartTime: one_hour_ago_date,
    });

    return cloudwatch_client.send(command);
  });

  const function_metrics_list = await Promise.all(command_promises);

  const prod_metrics_list = function_metrics_list.map(({ MetricDataResults }) =>
    MetricDataResults
      ? MetricDataResults.filter(result => result.Label?.endsWith('-prod'))
      : [],
  );

  const exceeding_metrics: Record<
    string,
    { threshold: { value: number; unit: string }; items: string[] }
  > = {
    third_party_duration: {
      threshold: THRESHOLDS.lambda_duration['third-party'],
      items: [],
    },
    lambda_duration: {
      threshold: THRESHOLDS.lambda_duration.default,
      items: [],
    },
    lambda_errors: {
      threshold: THRESHOLDS.lambda_errors,
      items: [],
    },
  };

  prod_metrics_list.forEach(list => {
    list.forEach(({ Values, Id, Label }) => {
      if (!Id || !Values || !Label) return;

      if (Id === 'lambda_errors') {
        const exceeding_value = Values.find(
          value => value >= THRESHOLDS[Id].value,
        );

        if (!exceeding_value) return;

        const label_with_value = `${Label as string} - ${exceeding_value} ${
          THRESHOLDS[Id].unit
        }`;

        exceeding_metrics[Id].items.push(label_with_value);
      }

      if (Id === 'lambda_duration') {
        const is_third_party = Label.startsWith('third-party');

        const exceeding_value = Values.find(value =>
          is_third_party
            ? value >= THRESHOLDS[Id]['third-party'].value
            : value >= THRESHOLDS[Id].default.value,
        );

        if (!exceeding_value) return;

        const label_with_value = `${Label as string} - ${exceeding_value} ${
          THRESHOLDS[Id].default.unit
        }`;

        exceeding_metrics[
          is_third_party ? 'third_party_duration' : Id
        ].items.push(label_with_value);
      }
    });
  });

  if (Object.values(exceeding_metrics).some(value => value.items.length)) {
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
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'The following metrics have triggered the alarm:',
        },
      },
      ...Object.entries(exceeding_metrics)
        .filter(([, { items }]) => items.length > 0)
        .map(([metric, { threshold, items: lambdas }]) => {
          return {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${metric}* - Limit: ${threshold.value} ${
                threshold.unit
              }\n ${lambdas.join('\n')}`,
            },
          };
        }),
    ];

    await send_slack_notification({ blocks });
  }

  return callback(null, event);
};
