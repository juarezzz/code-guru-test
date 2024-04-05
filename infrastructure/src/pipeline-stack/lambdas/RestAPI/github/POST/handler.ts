/* -------------- External -------------- */
import { Readable } from 'stream';
import { Octokit } from 'octokit';
import {
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { EnableCommand, EnableCommandInput } from '@aws-sdk/client-inspector2';
import { addMinutes, format } from 'date-fns';
import {
  CreateScheduleCommand,
  CreateScheduleCommandInput,
} from '@aws-sdk/client-scheduler';

/* -------------- Helpers -------------- */
import { http_response } from '_helpers/responses/http-response';
import { start_pipeline } from '_helpers/pipeline/start-pipeline';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_changed_stacks } from '_helpers/pipeline/get-changed-stacks';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { get_unique_files_from_pr } from '_helpers/pipeline/get-unique-files-from-pr';

/* -------------- Clients -------------- */
import { inspector_client } from '_clients/inspector';
import { scheduler_client } from '_clients/event-scheduler';

/* -------------- Types -------------- */
import { GithubEventBody } from '_pipeline-stack/lambdas/RestAPI/github/POST/@types';

/* -------------- Constants -------------- */
const INSPECTOR_RUNNING_TIME = 20; // In Minutes

const PULL_REQUEST_ACTIONS = ['opened', 'reopened', 'synchronize'];

const BRANCH_MAPPING: { [env: string]: string } = {
  development: 'STG',
  main: 'PROD',
};

/* -------------- Functions -------------- */
export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const s3_client = new S3Client({});

    const octokit = new Octokit({
      auth: process.env.TOKEN,
    });

    if (!event.body) {
      throw new Error(
        handle_http_error({ status_code: 400, message: 'No body found' }),
      );
    }

    let body: GithubEventBody;

    try {
      body = JSON.parse(event.body);
    } catch {
      throw new Error(
        handle_http_error({ status_code: 400, message: 'Unparsable body' }),
      );
    }

    const event_type = event.headers['X-GitHub-Event'];

    /* ----------
     * Handling new pushes to the target
     * branch and triggering the pipelines
     * ---------- */

    if (
      event_type === 'push' &&
      ['refs/heads/development', 'refs/heads/main'].includes(body.ref)
    ) {
      /* ----------
       * 1. Fetching the application's source from the repo
       * ---------- */

      const target_branch = body.ref.split('/').slice(2).join('/');

      const { data } = await octokit.request(
        'GET /repos/{owner}/{repo}/zipball/{ref}',
        {
          owner: 'PolytagUK',
          repo: 'polytag-mvp',
          ref: target_branch,
        },
      );

      /* ----------
       * 2. Storing it in our bucket
       * ---------- */

      const put_command_project_input: PutObjectCommandInput = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${process.env.ENVIRONMENT}/zip/project.zip`,
        Body: data as Readable,
      };

      const put_command_project = new PutObjectCommand(
        put_command_project_input,
      );

      await s3_client.send(put_command_project);

      /* ----------
       * 3. Dynamically choosing what stacks to
       * deploy by analyzing the changed files
       * ---------- */

      const changed_stacks = get_changed_stacks({
        commits_list: [...body.commits, body.head_commit],
      });

      const promises_list = [];

      const target_environment = BRANCH_MAPPING[target_branch] ?? 'STG';

      console.info({ target_branch, target_environment });

      const target_environment_variable = {
        name: 'target_environment',
        value: target_environment,
      };

      if (changed_stacks.backend) {
        promises_list.push(
          start_pipeline({
            pipeline_name: `Polytag-BackendDeploy-${process.env.ENVIRONMENT?.toUpperCase()}`,
            variables: [target_environment_variable],
          }),

          start_pipeline({
            pipeline_name: `Polytag-DiagnosticsDeploy-${process.env.ENVIRONMENT?.toUpperCase()}`,
            variables: [target_environment_variable],
          }),
        );
      }

      if (changed_stacks.frontend)
        promises_list.push(
          start_pipeline({
            pipeline_name: `Polytag-FrontendDeploy-${process.env.ENVIRONMENT?.toUpperCase()}`,
            variables: [target_environment_variable],
          }),
        );

      if (changed_stacks.rc_web)
        promises_list.push(
          start_pipeline({
            pipeline_name: `Polytag-RCFrontendDeploy-${process.env.ENVIRONMENT?.toUpperCase()}`,
            variables: [target_environment_variable],
          }),
        );

      if (changed_stacks.printer_web)
        promises_list.push(
          start_pipeline({
            pipeline_name: `Polytag-PrinterFrontendDeploy-${process.env.ENVIRONMENT?.toUpperCase()}`,
            variables: [target_environment_variable],
          }),
        );

      if (changed_stacks.admin_web)
        promises_list.push(
          start_pipeline({
            pipeline_name: `Polytag-AdminFrontendDeploy-${process.env.ENVIRONMENT?.toUpperCase()}`,
            variables: [target_environment_variable],
          }),
        );

      /* ----------
       * 4. Triggering the pipelines execution
       * ---------- */

      await Promise.all(promises_list);

      return http_response({
        status_code: 200,
        body: { message: 'Successfully started pipeline' },
      });
    }

    const { pull_request, number } = body;

    if (!pull_request)
      return http_response({
        status_code: 200,
        body: { message: 'No action required' },
      });

    /* ----------
     * Handling Draft PRs and skipping E2E tests
     * ---------- */

    if (pull_request.draft) {
      await octokit.request('POST /repos/{owner}/{repo}/statuses/{sha}', {
        owner: 'PolytagUK',
        repo: 'polytag-mvp',
        sha: pull_request.head.sha,
        state: 'pending',
        description: 'The end to end tests were skipped!',
        context: 'Playwright E2E',
      });

      return http_response({
        status_code: 200,
        body: { message: 'E2E tests skipped in Draft PR.' },
      });
    }

    /* ----------
     * Handling new pull requests and running E2E tests
     * ---------- */

    if (
      PULL_REQUEST_ACTIONS.includes(body.action.toLowerCase()) &&
      body.pull_request.base.ref === 'development'
    ) {
      const report_variables = await get_unique_files_from_pr(number);

      console.info({ report_variables });

      const commit_hash = pull_request.head.sha;

      /* ----------
       * 1. Fetching the application's source from the repo
       * ---------- */

      const { data } = await octokit.request(
        'GET /repos/{owner}/{repo}/zipball/{ref}',
        {
          owner: 'PolytagUK',
          repo: 'polytag-mvp',
          ref: pull_request.head.ref,
        },
      );

      /* ----------
       * 2. Storing it in our bucket
       * ---------- */

      const put_command_input_frontend: PutObjectCommandInput = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${process.env.ENVIRONMENT}/zip/frontend-test.zip`,
        Body: data as Readable,
        Metadata: { sha: commit_hash },
      };

      const put_command_frontend = new PutObjectCommand(
        put_command_input_frontend,
      );

      await s3_client.send(put_command_frontend);

      /* ----------
       * 3. Triggering the FrontendTest Pipeline
       * ---------- */

      await start_pipeline({
        pipeline_name: `Polytag-FrontendTest-${process.env.ENVIRONMENT?.toUpperCase()}`,
        variables: report_variables,
      });

      return http_response({
        status_code: 200,
        body: { message: 'FrontendTest Pipeline started running E2E tests' },
      });
    }

    /* ----------
     * Handling new pull requests to main branch
     * ---------- */
    if (
      pull_request.head.ref === 'development' &&
      pull_request.base.ref === 'main'
    ) {
      const commit_hash = pull_request.head.sha;

      /* ----------
       * 1. Fetching the application's source from the repo
       * ---------- */

      const { data } = await octokit.request(
        'GET /repos/{owner}/{repo}/zipball/{ref}',
        {
          owner: 'PolytagUK',
          repo: 'polytag-mvp',
          ref: pull_request.head.ref,
        },
      );

      /* ----------
       * 2. Storing it in our bucket
       * ---------- */

      const put_command_input_frontend: PutObjectCommandInput = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${process.env.ENVIRONMENT}/zip/frontend-release.zip`,
        Body: data as Readable,
        Metadata: { sha: commit_hash },
      };

      const put_command_frontend = new PutObjectCommand(
        put_command_input_frontend,
      );

      await s3_client.send(put_command_frontend);

      /* ----------
       * 3. Triggering the CrossBrowserTest Pipeline
       * ---------- */

      await start_pipeline({
        pipeline_name: `Polytag-CrossBrowserTest-${process.env.ENVIRONMENT?.toUpperCase()}`,
      });

      /* ----------
       * 4. Triggering the AWS Inspector to review lambdas code and dependecies
       * ---------- */

      const params: EnableCommandInput = {
        resourceTypes: ['LAMBDA_CODE'],
      };

      const enable_command = new EnableCommand(params);

      await inspector_client.send(enable_command);

      /* ----------
       * 5. Creating scheduled event to stop the inspector and report any issues found
       * ---------- */

      const schedule_params: CreateScheduleCommandInput = {
        Name: `Inspector-Result-Scheduled-Event-${process.env.ENVIRONMENT}`,
        ScheduleExpression: `at(${format(
          addMinutes(new Date(), INSPECTOR_RUNNING_TIME),
          "yyyy-MM-dd'T'HH:mm:ss",
        )})`,
        Target: {
          Arn: process.env.INSPECTOR_LAMBDA_ARN,
          RoleArn: process.env.SCHEDULER_ROLE_ARN,
        },
        FlexibleTimeWindow: { Mode: 'OFF' },
        ActionAfterCompletion: 'DELETE',
      };

      const create_scheduled_event_command = new CreateScheduleCommand(
        schedule_params,
      );

      await scheduler_client.send(create_scheduled_event_command);

      return http_response({
        status_code: 200,
        body: {
          message: 'CrossBrowserTest Pipeline started running E2E tests',
        },
      });
    }

    return http_response({
      status_code: 200,
      body: { message: 'No action required' },
    });
  } catch (error) {
    console.error('Error at Github event handler:', error);

    return handle_http_error_response({ error });
  }
};
