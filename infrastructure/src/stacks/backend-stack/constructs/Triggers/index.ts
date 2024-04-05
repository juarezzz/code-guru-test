/* ---------- External ---------- */
import { Trigger } from 'aws-cdk-lib/triggers';
import { Construct } from 'constructs';

/* ---------- Constructs ---------- */
import { LambdasConstruct } from '_stacks/backend-stack/constructs/Lambdas';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  lambdas_construct: LambdasConstruct;
  deployment_dependencies: Construct[];
}

export class TriggersConstruct extends Construct {
  public readonly trigger: Trigger;

  public readonly api_deployment_trigger: Trigger;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ----------
     * Triggers initializations
     * ---------- */

    this.trigger = new Trigger(scope, `Trigger-Policies-${props.environment}`, {
      handler: props.lambdas_construct.lambdas.triggers.policies.function,
    });

    this.api_deployment_trigger = new Trigger(
      scope,
      `Trigger-Api-Deployment-${props.environment}`,
      {
        handler:
          props.lambdas_construct.lambdas.triggers.api_deployment.function,
        executeAfter: props.deployment_dependencies,
        executeOnHandlerChange: true,
      },
    );
  }
}
