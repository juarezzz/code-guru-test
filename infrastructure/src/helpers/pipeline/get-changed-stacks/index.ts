/* -------------- Types -------------- */
import { GithubCommit } from '_pipeline-stack/lambdas/RestAPI/github/POST/@types';

/* -------------- Interfaces -------------- */
export interface GetChangedStacksInput {
  commits_list: GithubCommit[];
}

export interface GetChangedStacksOutput {
  printer_web: boolean;
  rc_web: boolean;
  backend: boolean;
  frontend: boolean;
  admin_web: boolean;
}

/* ---------- Constants ---------- */
const INFRA_FOLDERS = ['infrastructure/'];

const WEB_FOLDERS = ['web/', 'infrastructure/src/web-stack/'];

const ADMIN_WEB_FOLDERS = [
  'web-admin/',
  'infrastructure/src/stacks/web-admin-stack/',
];

const RC_WEB_FOLDERS = [
  'web-rc-portal/',
  'infrastructure/src/stacks/web-rc-portal-stack/',
];

const PRINTER_WEB_FOLDERS = [
  'web-printer-portal/',
  'infrastructure/src/stacks/web-printer-stack/',
];

/* ---------- Functions ---------- */
export const get_changed_stacks = ({
  commits_list,
}: GetChangedStacksInput): GetChangedStacksOutput => {
  let backend = false;
  let frontend = false;
  let admin_web = false;
  let rc_web = false;
  let printer_web = false;

  /* ----------
   * Listing all changed files
   * ---------- */
  const modified_files_list = new Set(
    commits_list.reduce(
      (result: string[], current) => [
        ...result,
        ...current.modified,
        ...current.added,
        ...current.removed,
      ],
      [],
    ),
  );

  console.log('MODIFIED:', modified_files_list);

  modified_files_list.forEach(modified_file => {
    /* ----------
     * Checking for web changes
     * ---------- */
    if (WEB_FOLDERS.some(folder => modified_file.startsWith(folder))) {
      frontend = true;
    }

    /* ----------
     * Checking for infra/backend changes
     * ---------- */
    if (INFRA_FOLDERS.some(folder => modified_file.startsWith(folder))) {
      backend = true;
    }

    /* ----------
     * Checking for RC portal web changes
     * ---------- */
    if (RC_WEB_FOLDERS.some(folder => modified_file.startsWith(folder))) {
      rc_web = true;
    }

    /* ----------
     * Checking for printer portal web changes
     * ---------- */
    if (PRINTER_WEB_FOLDERS.some(folder => modified_file.startsWith(folder))) {
      printer_web = true;
    }

    /* ----------
     * Checking for admin web changes
     * ---------- */
    if (ADMIN_WEB_FOLDERS.some(folder => modified_file.startsWith(folder))) {
      admin_web = true;
    }
  });

  return {
    rc_web,
    backend,
    frontend,
    admin_web,
    printer_web,
  };
};
