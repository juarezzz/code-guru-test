/* -------------- External -------------- */
import {
  CodePipelineClient,
  PipelineVariable,
  StartPipelineExecutionCommand,
  StartPipelineExecutionCommandInput,
} from '@aws-sdk/client-codepipeline';

interface StartPipelineInput {
  pipeline_name: string;
  variables?: PipelineVariable[];
}

export const start_pipeline = async ({
  pipeline_name,
  variables,
}: StartPipelineInput) => {
  const client = new CodePipelineClient({});

  const params: StartPipelineExecutionCommandInput = {
    name: pipeline_name,
    variables,
  };

  const command = new StartPipelineExecutionCommand(params);

  return client.send(command);
};
