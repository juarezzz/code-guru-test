/* ---------- External ---------- */
import { Construct } from 'constructs';

/* ---------- Constructs ---------- */
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';

/* ---------- State Machines ---------- */
import { AdminClientsStateMachine } from '_stacks/backend-stack/constructs/StateMachine/AdminClients';

/* ---------- Interfaces ---------- */
interface Props {
  dynamodb_construct: DynamoDBConstruct;
  environment: string;
}

export interface StateMachines {
  admin_clients: AdminClientsStateMachine;
}

export class StateMachineConstruct extends Construct {
  public readonly state_machines: StateMachines;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.state_machines = {
      admin_clients: new AdminClientsStateMachine(
        scope,
        `AdminClients-State-Machine-${props.environment}`,
        {
          dynamodb_construct: props.dynamodb_construct,
          environment: props.environment,
        },
      ),
    };
  }
}
