/* -------------- External -------------- */
import { Octokit } from 'octokit';
import { Readable } from 'stream';
import { PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import {
  CodePipelineClient,
  StartPipelineExecutionCommand,
  StartPipelineExecutionCommandInput,
} from '@aws-sdk/client-codepipeline';
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* -------------- Helpers -------------- */
import { httpError } from '_helpers/errors/httpError';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Schemas ---------- */
import { body_schema } from '_pipeline-stack/lambdas/RestAPI/start-pipe/PUT/schemas';

/* ---------- Clients ---------- */
import { s3_client } from '_clients/s3';

/* ---------- Interfaces ---------- */
export type Pipelines =
  | 'backend'
  | 'diagnostics'
  | 'frontend'
  | 'admin_web'
  | 'rc_web'
  | 'printer_web';

export interface StartPipePUTBody {
  branch: string;
  pipelines: Array<Pipelines>;
}

/* -------------- Functions -------------- */
export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    if (process.env.ENVIRONMENT !== 'DEV')
      throw new Error(
        httpError({ message: 'Forbidden environment', status_code: 403 }),
      );

    const { body, headers } = event;

    const basic_token = headers.Authorization || headers.authorization;

    if (!basic_token)
      throw new Error(
        httpError({
          message: 'Authorization header is missing.',
          status_code: 401,
        }),
      );

    const base64 = basic_token.split(' ')[1];

    if (base64 !== process.env.WHITELIST)
      throw new Error(
        httpError({
          message: 'Authorization header is invalid.',
          status_code: 401,
        }),
      );

    if (!body)
      throw new Error(
        httpError({ message: 'Missing request body', status_code: 400 }),
      );

    const typed_body: StartPipePUTBody = JSON.parse(body);

    await body_schema.validate(typed_body);

    let project_source: Readable;

    const octokit = new Octokit({
      auth: process.env.TOKEN,
    });

    /* ----------
     * 1. Downloading the project from the source branch
     * ---------- */

    try {
      const { data } = await octokit.request(
        'GET /repos/{owner}/{repo}/zipball/{ref}',
        {
          owner: 'PolytagUK',
          repo: 'polytag-mvp',
          ref: typed_body.branch,
        },
      );

      project_source = data as Readable;
    } catch {
      throw new Error(
        httpError({ message: 'Branch not found', status_code: 404 }),
      );
    }

    /* ----------
     * 2. Storing it in our source bucket
     * ---------- */

    const put_command_project_input: PutObjectCommandInput = {
      Bucket: process.env.BUCKET_NAME,
      Key: `${process.env.ENVIRONMENT.toLowerCase()}/zip/project.zip`,
      Body: project_source,
    };

    const put_command_project = new PutObjectCommand(put_command_project_input);
    await s3_client.send(put_command_project);

    /* ----------
     * 3. Create pipeline params and starting the pipes
     * according to the instructions received in the payload
     * ---------- */

    const codepipeline_client = new CodePipelineClient({});

    const params_backend: StartPipelineExecutionCommandInput = {
      name: `Polytag-BackendDeploy-${process.env.ENVIRONMENT?.toUpperCase()}`,
    };

    const params_diagnostics: StartPipelineExecutionCommandInput = {
      name: `Polytag-DiagnosticsDeploy-${process.env.ENVIRONMENT?.toUpperCase()}`,
    };

    const params_frontend: StartPipelineExecutionCommandInput = {
      name: `Polytag-FrontendDeploy-${process.env.ENVIRONMENT?.toUpperCase()}`,
    };

    const params_rc_frontend: StartPipelineExecutionCommandInput = {
      name: `Polytag-RCFrontendDeploy-${process.env.ENVIRONMENT?.toUpperCase()}`,
    };

    const params_printer_frontend: StartPipelineExecutionCommandInput = {
      name: `Polytag-PrinterFrontendDeploy-${process.env.ENVIRONMENT?.toUpperCase()}`,
    };

    const params_admin_frontend: StartPipelineExecutionCommandInput = {
      name: `Polytag-AdminFrontendDeploy-${process.env.ENVIRONMENT?.toUpperCase()}`,
    };

    const command_backend = new StartPipelineExecutionCommand(params_backend);

    const command_diagnostics = new StartPipelineExecutionCommand(
      params_diagnostics,
    );

    const command_frontend = new StartPipelineExecutionCommand(params_frontend);

    const command_rc_frontend = new StartPipelineExecutionCommand(
      params_rc_frontend,
    );

    const command_printer_frontend = new StartPipelineExecutionCommand(
      params_printer_frontend,
    );

    const command_admin_frontend = new StartPipelineExecutionCommand(
      params_admin_frontend,
    );

    const promises_list = [];

    if (typed_body.pipelines.includes('backend'))
      promises_list.push(codepipeline_client.send(command_backend));

    if (typed_body.pipelines.includes('diagnostics'))
      promises_list.push(codepipeline_client.send(command_diagnostics));

    if (typed_body.pipelines.includes('frontend'))
      promises_list.push(codepipeline_client.send(command_frontend));

    if (typed_body.pipelines.includes('rc_web'))
      promises_list.push(codepipeline_client.send(command_rc_frontend));

    if (typed_body.pipelines.includes('printer_web'))
      promises_list.push(codepipeline_client.send(command_printer_frontend));

    if (typed_body.pipelines.includes('admin_web'))
      promises_list.push(codepipeline_client.send(command_admin_frontend));

    await Promise.all(promises_list);

    return http_response({
      status_code: 202,
      body: { message: 'Pipeline(s) successfully initiated' },
    });
  } catch (error) {
    return handle_http_error_response({ error });
  }
};
