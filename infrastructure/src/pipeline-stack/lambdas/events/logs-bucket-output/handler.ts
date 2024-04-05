/* ---------- External ---------- */
import { S3Handler } from 'aws-lambda';
import { Octokit } from 'octokit';
import { getUnixTime } from 'date-fns';

/* ---------- Helpers ---------- */
import { send_slack_notification } from '_helpers/slack/send-slack-notification';
import { handle_download_and_decompress_zip_file } from '_helpers/pipeline/handle-frontend-test-results';
import { calculate_test_results } from '_helpers/pipeline/calculate-test-results';
import { handle_pull_request_state } from '_helpers/pipeline/handle-pull-request-state';
import { get_test_block_message } from '_helpers/pipeline/get-test-block-message';

interface CategorizedFiles {
  summaries: Array<string>;
  reports: Array<string>;
}

const get_hash = (key: string) => key.split('/')[2];

const collaborators: Record<string, string> = {
  andonynt: 'Andony Nuñez',
  juarezzz: 'Juarez Junior',
  ygormartins: 'Ygor Martins',
  MunizMat: 'Matheus Muniz',
};

export const handler: S3Handler = async event => {
  /* ---------- Controller ---------- */
  try {
    const octokit = new Octokit({
      auth: process.env.TOKEN,
    });

    const [record] = event.Records;
    const { key } = record.s3.object;

    if (key.includes('release')) {
      const commit_hash = get_hash(key.replace('release-', ''));

      const { data: pr_data } = await octokit.request(
        'GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls',
        {
          owner: 'PolytagUK',
          repo: 'polytag-mvp',
          commit_sha: commit_hash,
        },
      );

      const { data: commit_data } = await octokit.request(
        'GET /repos/{owner}/{repo}/commits/{sha}',
        {
          owner: 'PolytagUK',
          repo: 'polytag-mvp',
          sha: commit_hash,
        },
      );

      const current_unix_time = getUnixTime(new Date());
      const pr_unix_time = getUnixTime(
        new Date(commit_data.commit.author.date),
      );

      const unzip_files = await handle_download_and_decompress_zip_file(
        key,
        commit_hash,
      );

      const categorized_files = unzip_files.reduce(
        (acc: CategorizedFiles, file) => {
          if (file.includes('report')) {
            acc.reports.push(file);
          } else {
            acc.summaries.push(file);
          }
          return acc;
        },
        { summaries: [], reports: [] },
      );

      const chrome_reports = await calculate_test_results(
        categorized_files.reports.filter(f => f.includes('chrome')),
        commit_hash,
      );

      const safari_reports = await calculate_test_results(
        categorized_files.reports.filter(f => f.includes('safari')),
        commit_hash,
      );

      const firefox_reports = await calculate_test_results(
        categorized_files.reports.filter(f => f.includes('firefox')),
        commit_hash,
      );

      // --------------- HTML File --------------- //

      await send_slack_notification({
        channel: '#test-reports',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: 'Cross Browser E2E Report',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Review the generated coverage report uploaded to S3.',
            },
          },

          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*<${pr_data[0].html_url}|${pr_data[0].title}>*\n*When:*\n<!date^${pr_unix_time}^{date_long} at {time}| >`,
            },
            accessory: {
              type: 'image',
              image_url:
                'https://i.pinimg.com/originals/ba/e7/68/bae7685f239ebf3c9a29747073c922d2.gif',
              alt_text: 'Release GIF',
            },
          },

          {
            type: 'divider',
          },

          {
            type: 'header',
            elements: [
              {
                type: 'image',
                image_url:
                  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Google_Chrome_icon_%28February_2022%29.svg/2048px-Google_Chrome_icon_%28February_2022%29.svg.png',
                alt_text: 'notifications warning icon',
              },
              {
                type: 'plain_text',
                text: 'Chrome',
              },
            ],
          },
          ...chrome_reports.map(
            ({ portal, url, failed_tests, tests_passed, total_tests }) => ({
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${portal} Portal ${
                  total_tests && tests_passed === total_tests ? '✅' : '❌'
                }*\nPassed: ${tests_passed} | Failed: ${failed_tests} | Total: ${total_tests}`,
              },
              accessory: {
                type: 'button',
                text: {
                  type: 'plain_text',
                  emoji: true,
                  text: 'Open',
                },
                style: 'primary',
                url,
              },
            }),
          ),

          {
            type: 'header',
            elements: [
              {
                type: 'image',
                image_url:
                  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Firefox_logo%2C_2019.svg/1971px-Firefox_logo%2C_2019.svg.png',
                alt_text: 'notifications warning icon',
              },
              {
                type: 'plain_text',
                text: 'Firefox',
              },
            ],
          },
          ...firefox_reports.map(
            ({ portal, url, failed_tests, tests_passed, total_tests }) => ({
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${portal} Portal ${
                  total_tests && tests_passed === total_tests ? '✅' : '❌'
                }*\nPassed: ${tests_passed} | Failed: ${failed_tests} | Total: ${total_tests}`,
              },
              accessory: {
                type: 'button',
                text: {
                  type: 'plain_text',
                  emoji: true,
                  text: 'Open',
                },
                style: 'primary',
                url,
              },
            }),
          ),

          {
            type: 'header',
            elements: [
              {
                type: 'image',
                image_url:
                  'https://upload.wikimedia.org/wikipedia/commons/6/61/WebKit_logo_%282015%29_2.png',
                alt_text: 'notifications warning icon',
              },
              {
                type: 'plain_text',
                text: 'Webkit',
              },
            ],
          },
          ...safari_reports.map(
            ({ portal, url, failed_tests, tests_passed, total_tests }) => ({
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${portal} Portal ${
                  total_tests && tests_passed === total_tests ? '✅' : '❌'
                }*\nPassed: ${tests_passed} | Failed: ${failed_tests} | Total: ${total_tests}`,
              },
              accessory: {
                type: 'button',
                text: {
                  type: 'plain_text',
                  emoji: true,
                  text: 'Open',
                },
                style: 'primary',
                url,
              },
            }),
          ),

          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `<!date^${current_unix_time}^{date_short} {time_secs}| >`,
              },
            ],
          },
        ],
      });

      // --------------- TXT File --------------- //
      await handle_pull_request_state({
        files: categorized_files.summaries,
        commit_hash,
      });
      return;
    }

    const commit_hash = get_hash(key);

    console.info({ commit_hash });

    const { data: pr_data } = await octokit.request(
      'GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls',
      {
        owner: 'PolytagUK',
        repo: 'polytag-mvp',
        commit_sha: commit_hash,
      },
    );

    const { data: commit_data } = await octokit.request(
      'GET /repos/{owner}/{repo}/commits/{sha}',
      {
        owner: 'PolytagUK',
        repo: 'polytag-mvp',
        sha: commit_hash,
      },
    );

    const current_unix_time = getUnixTime(new Date());
    const pr_unix_time = getUnixTime(new Date(commit_data.commit.author.date));

    const unzip_files = await handle_download_and_decompress_zip_file(
      key,
      commit_hash,
    );

    const files = unzip_files.reduce(
      (acc: CategorizedFiles, file) => {
        if (file.includes('report')) acc.reports.push(file);
        if (file.includes('summary')) acc.summaries.push(file);

        return acc;
      },
      { summaries: [], reports: [] },
    );

    // --------------- HTML File --------------- //

    const reports = await calculate_test_results(files.reports, commit_hash);

    console.info({ reports });

    await send_slack_notification({
      channel: '#test-reports',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'E2E Report - Staging',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Review the generated coverage report uploaded to S3.',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*<${pr_data[0].html_url}|${pr_data[0].title}>*`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Commit message: ${commit_data.commit.message}`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Author:*\n${collaborators[pr_data[0].user?.login || '']}`,
            },
            {
              type: 'mrkdwn',
              text: `*Pushed at:*\n<!date^${pr_unix_time}^{date_long} at {time}| >`,
            },
          ],
        },
        {
          type: 'divider',
        },
        ...reports
          .filter(x => x.total_tests !== null)
          .flatMap(get_test_block_message),
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `<!date^${current_unix_time}^{date_short} {time_secs}| >`,
            },
          ],
        },
      ],
    });

    // --------------- TXT File --------------- //

    await handle_pull_request_state({
      files: files.summaries,
      commit_hash,
    });
  } catch (error) {
    console.error(error);
  }
};
