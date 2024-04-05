/* ---------- External ---------- */
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Octokit } from 'octokit';

interface Params {
  files: string[];
  commit_hash: string;
}

export const handle_pull_request_state = async ({
  files,
  commit_hash,
}: Params) => {
  const s3_client = new S3Client({});

  const octokit = new Octokit({
    auth: process.env.TOKEN,
  });

  const summaries = files.map(async object_key => {
    const get_summary_command = new GetObjectCommand({
      Bucket: process.env.SOURCE_BUCKET_NAME,
      Key: `${process.env.ENVIRONMENT}/playwright/${commit_hash}/results/${object_key}`,
    });

    const { Body } = await s3_client.send(get_summary_command);

    const summary_text = await Body?.transformToString();

    const regex = /Test run was failure free\? (true|false),/;
    const match = summary_text?.match(regex);

    return match?.[1].toLowerCase();
  });

  const summaries_response = await Promise.all(summaries);

  const summaries_filtered = summaries_response.filter(
    summary => summary !== undefined,
  );

  if (summaries_filtered?.every(summary => summary === 'true')) {
    await octokit.request('POST /repos/{owner}/{repo}/statuses/{sha}', {
      owner: 'PolytagUK',
      repo: 'polytag-mvp',
      sha: commit_hash,
      state: 'success',
      description: 'The end to end run succeeded!',
      context: 'Playwright E2E',
    });

    return;
  }

  await octokit.request('POST /repos/{owner}/{repo}/statuses/{sha}', {
    owner: 'PolytagUK',
    repo: 'polytag-mvp',
    sha: commit_hash,
    state: 'failure',
    description: 'The end to end run failed!',
    context: 'Playwright E2E',
  });
};
