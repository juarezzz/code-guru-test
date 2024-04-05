/* ---------- External ---------- */
import { v4 as uuidv4 } from 'uuid';
import {
  StartExecutionCommand,
  StartExecutionCommandInput,
} from '@aws-sdk/client-sfn';

/* ---------- Clients ---------- */
import { step_functions_client } from '_clients/step_functions';

/* ---------- Types ---------- */
interface StartStateMachineExecution {
  input: string;
}

/* ---------- Function ---------- */
const start_state_machine_execution = async ({
  input,
}: StartStateMachineExecution) => {
  const arn = process.env.STATEMACHINE_ARN;

  const params: StartExecutionCommandInput = {
    input,
    name: uuidv4(),
    stateMachineArn: arn,
  };

  const command = new StartExecutionCommand(params);

  await step_functions_client.send(command);
};

/* ---------- Export ---------- */
export { start_state_machine_execution };
