/* -------------- External -------------- */
import { Octokit } from 'octokit';

const get_unique_files_from_pr = async (pr_number: number) => {
  const owner = 'PolytagUK';
  const repo = 'polytag-mvp';

  const octokit = new Octokit({
    auth: process.env.TOKEN,
  });

  const response = await octokit.request(
    'GET /repos/{owner}/{repo}/pulls/{pull_number}/files',
    {
      owner,
      repo,
      pull_number: pr_number,
    },
  );

  const all_files = response.data.map(file => file.filename);

  let backend_modified = false;
  let frontend_modified = false;
  let admin_web_modified = false;
  let rc_web_modified = false;
  let printer_web_modified = false;

  // Use a Set to remove duplicates
  const unique_files = Array.from(new Set(all_files));

  unique_files.forEach(modified_file => {
    /* ----------
     * Checking for web changes
     * ---------- */
    if (modified_file.startsWith('web/')) frontend_modified = true;

    /* ----------
     * Checking for infra/backend changes
     * ---------- */
    if (modified_file.startsWith('infrastructure/')) backend_modified = true;

    /* ----------
     * Checking for RC portal web changes
     * ---------- */
    if (modified_file.startsWith('web-rc-portal/')) rc_web_modified = true;

    /* ----------
     * Checking for printer portal web changes
     * ---------- */
    if (modified_file.startsWith('web-printer-portal/'))
      printer_web_modified = true;

    /* ----------
     * Checking for admin web changes
     * ---------- */
    if (modified_file.startsWith('web-admin/')) admin_web_modified = true;
  });

  return [
    {
      name: 'backend_modified',
      value: String(backend_modified),
    },
    {
      name: 'frontend_modified',
      value: String(frontend_modified),
    },
    {
      name: 'admin_web_modified',
      value: String(admin_web_modified),
    },
    {
      name: 'rc_web_modified',
      value: String(rc_web_modified),
    },
    {
      name: 'printer_web_modified',
      value: String(printer_web_modified),
    },
  ];
};

export { get_unique_files_from_pr };
