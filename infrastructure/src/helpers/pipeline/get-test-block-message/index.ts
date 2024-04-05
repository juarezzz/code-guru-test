import { startCase, toLower } from 'lodash';

interface GetBlockMessageInput {
  portal: string;
  url: string | null;
  tests_passed: number | null;
  total_tests: number | null;
  failed_tests: number | null;
  failed_test_screenshots: {
    key: string | undefined;
    image_signed_url: string;
  }[];
}

export const get_test_block_message = ({
  portal,
  url,
  tests_passed,
  total_tests,
  failed_tests,
  failed_test_screenshots,
}: GetBlockMessageInput) => {
  if (failed_test_screenshots.length || tests_passed !== total_tests) {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${startCase(
            toLower(portal),
          )} Portal ❌*\nPassed: ${tests_passed} | Failed: ${failed_tests} | Total: ${total_tests}`,
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
      },
      ...failed_test_screenshots.map(file => ({
        type: 'image',
        title: {
          type: 'plain_text',
          text: file.key,
        },
        block_id: file.key,
        image_url: file.image_signed_url,
        alt_text: 'Image failed',
      })),
    ];
  }

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${startCase(
          toLower(portal),
        )} Portal ✅*\nPassed: ${tests_passed} | Failed: ${failed_tests} | Total: ${total_tests}`,
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
    },
  ];
};
