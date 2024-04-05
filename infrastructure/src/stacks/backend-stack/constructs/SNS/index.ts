/* ---------- External ---------- */
import { Topic } from 'aws-cdk-lib/aws-sns';
import { LambdaSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

/* ---------- Constructs ---------- */
import { SNSMessageLambda } from '_stacks/backend-stack/lambdas/sns';
import { Tags } from 'aws-cdk-lib';

/* ---------- Helpers ---------- */
import { add_inspector_tags_to_function } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
}

export class SNSConstruct extends Construct {
  public readonly cloudwatch_alarms_topic: Topic;

  public readonly lambda: SNSMessageLambda;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.cloudwatch_alarms_topic = new Topic(
      scope,
      `SNS-Alarms-Notifications-Topic-${props.environment}`,
      {
        topicName: `alarms-notifications-topic-${props.environment}`,
        displayName: `alarms-notifications-topic-${props.environment}`,
      },
    );

    /* ---------- Lambdas ---------- */
    this.lambda = new SNSMessageLambda(
      scope,
      `SNS-MessageLambda-Construct-${props.environment}`,
      {
        environment: props.environment,
      },
    );

    /* ---------- SNS Subscription ---------- */
    this.cloudwatch_alarms_topic.addSubscription(
      new LambdaSubscription(this.lambda.function),
    );

    /* ---------- Tags ---------- */
    Tags.of(this.cloudwatch_alarms_topic).add('Custom:Service', 'SNS');
    Tags.of(this.cloudwatch_alarms_topic).add(
      'Custom:Environment',
      props.environment,
    );

    if (props.environment !== 'STG')
      add_inspector_tags_to_function(this.lambda.function);
  }
}
