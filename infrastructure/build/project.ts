#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unused-vars */
/* ---------- External ---------- */
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { config } from 'dotenv';

/* ---------- Helpers ---------- */
import { handleEnvironmentByChoice } from '_helpers/handlers/handleEnvironmentByChoice';

/* ---------- Builders ---------- */
import { buildAndDeployPipelineStack } from '__build/stacks/pipeline-stack';
import { buildAndDeployPoliciesStack } from '__build/stacks/policies-stack';
import { build_and_deploy_backend_stack } from '__build/stacks/backend-stack';
import { build_and_deploy_web_stack } from '__build/stacks/web-stack';
import { buildAndDeployWebAdminStack } from '__build/stacks/web-admin-stack';
import { build_and_deploy_web_rc_portal_stack } from '__build/stacks/web-rc-portal-stack';
import { build_and_deploy_web_printer_stack } from '__build/stacks/web-printer-stack';
import { build_and_deploy_diagnostics_stack } from '__build/stacks/diagnostics-stack';

/* ---------- Initial configuration ---------- */
// config();

const app = new App();

const choice = app.node.tryGetContext('choice');
const profile = app.node.tryGetContext('profile');
const param_pipeline = app.node.tryGetContext('pipeline');

let pipeline = false;

if (!choice) throw new Error('You need to choose a stack to build and deploy.');

if (param_pipeline?.toLowerCase() === 'true') pipeline = true;

const { environment } = handleEnvironmentByChoice(choice);

/* ----------
 *  Based on the choice, we build and deploy the stack.
 * ---------- */
const buildAndDeploy = async () => {
  if (choice.startsWith('BACK')) {
    build_and_deploy_backend_stack({ app, environment });
  }

  if (choice.startsWith('DIAGNOSTICS')) {
    build_and_deploy_diagnostics_stack({ app, environment });
  }

  if (choice.startsWith('WEB')) {
    build_and_deploy_web_stack({
      app,
      profile,
      environment,
    });
  }

  if (choice.startsWith('RCPORTALWEB')) {
    build_and_deploy_web_rc_portal_stack({
      app,
      environment,
    });
  }

  if (choice.startsWith('PRINTERWEB')) {
    build_and_deploy_web_printer_stack({
      app,
      environment,
    });
  }

  if (choice.startsWith('ADMINWEB')) {
    buildAndDeployWebAdminStack({
      app,
      environment,
    });
  }

  if (choice.startsWith('PIPE'))
    buildAndDeployPipelineStack({ app, environment });

  if (choice.startsWith('POLICIES')) buildAndDeployPoliciesStack(app);
};

buildAndDeploy();
