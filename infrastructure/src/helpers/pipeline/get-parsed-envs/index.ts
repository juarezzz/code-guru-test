/* ---------- External ---------- */
import { config, DotenvParseOutput } from 'dotenv';
import { BuildEnvironmentVariable } from 'aws-cdk-lib/aws-codebuild';

/* ---------- Constants ---------- */
const INFRA_VARS_FOLDER = './env/.env';
const WEB_VARS_FOLDER = './../web/env/.env.test';
const WEB_ADMIN_VARS_FOLDER = './../web-admin/env/.env.test';
const RC_PORTAL_VARS_FOLDER = './../web-rc-portal/env/.env.test';
const PRINTER_PORTAL_VARS_FOLDER = './../web-printer-portal/env/.env.test';

/* ---------- Interfaces ---------- */
export type CodePipelineVariables = { [key: string]: BuildEnvironmentVariable };

export type Folders =
  | 'infra'
  | 'web'
  | 'web-admin'
  | 'web-rc-portal'
  | 'web-printer-portal'
  | 'all';

export type Portals =
  | 'web'
  | 'web-admin'
  | 'web-printer-portal'
  | 'web-rc-portal';

export interface GetParsedEnvsInput {
  folders?: Array<Folders>;
  envs_key_list?: string[];
}

/* ---------- Functions ---------- */
export const get_parsed_envs = ({
  envs_key_list,
  folders = ['all'],
}: GetParsedEnvsInput): CodePipelineVariables => {
  const all_folders = folders.includes('all');
  let variables: DotenvParseOutput = {};

  if (folders?.includes('infra') || all_folders) {
    variables = {
      ...variables,
      ...(config({ path: INFRA_VARS_FOLDER }).parsed || {}),
    };
  }

  if (folders?.includes('web') || all_folders) {
    variables = {
      ...variables,
      ...(config({ path: WEB_VARS_FOLDER }).parsed || {}),
    };
  }

  if (folders?.includes('web-admin') || all_folders) {
    variables = {
      ...variables,
      ...(config({ path: WEB_ADMIN_VARS_FOLDER }).parsed || {}),
    };
  }

  if (folders?.includes('web-rc-portal') || all_folders) {
    variables = {
      ...variables,
      ...(config({ path: RC_PORTAL_VARS_FOLDER }).parsed || {}),
    };
  }

  if (folders?.includes('web-printer-portal') || all_folders) {
    variables = {
      ...variables,
      ...(config({ path: PRINTER_PORTAL_VARS_FOLDER }).parsed || {}),
    };
  }

  const envs_list = Object.entries(variables || {});

  const parsed_envs = envs_list.reduce(
    (result: CodePipelineVariables, [key, value]) => {
      if (!envs_key_list || envs_key_list.includes(key))
        result[key] = { value };

      return result;
    },
    {},
  );

  return parsed_envs;
};
