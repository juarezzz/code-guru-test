/* ---------- External ---------- */
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  GetObjectCommand,
  S3Client,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
} from '@aws-sdk/client-s3';

interface TestResult {
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

const extract_number = (text: string, regex: RegExp): number | null => {
  const match = text.match(regex);
  return match && match[1] ? Number(match[1]) : null;
};

export const calculate_test_results = async (
  files: string[],
  commit_hash: string,
) => {
  const s3_client = new S3Client({});

  const pw_images_params: ListObjectsV2CommandInput = {
    Bucket: process.env.SOURCE_BUCKET_NAME,
    Prefix: `${process.env.ENVIRONMENT}/playwright/${commit_hash}/images/`,
  };

  const pw_images_response = await s3_client.send(
    new ListObjectsV2Command(pw_images_params),
  );

  const content_promises = (pw_images_response.Contents || [])
    .filter(content => content.Key?.endsWith('.png'))
    .map(content => content.Key)
    .map(async key => {
      const get_report_command = new GetObjectCommand({
        Bucket: process.env.SOURCE_BUCKET_NAME,
        Key: key,
      });

      const image_signed_url = await getSignedUrl(
        s3_client,
        get_report_command,
        {
          expiresIn: 60 * 60 * 24 * 7, // 1 week
        },
      );

      return {
        key,
        image_signed_url,
      };
    });

  const content_response = await Promise.all(content_promises);

  const promises = files.map(async object_key => {
    const portal = object_key.split('-')[0];

    const result: TestResult = {
      portal,
      url: null,
      tests_passed: null,
      total_tests: null,
      failed_tests: null,
      failed_test_screenshots: [],
    };

    const get_report_command = new GetObjectCommand({
      Bucket: process.env.SOURCE_BUCKET_NAME,
      Key: `${process.env.ENVIRONMENT}/playwright/${commit_hash}/results/${object_key}`,
    });

    const signed_url = await getSignedUrl(s3_client, get_report_command, {
      expiresIn: 60 * 60 * 24, // 1 day
    });

    result.url = signed_url;

    const get_summary_command = new GetObjectCommand({
      Bucket: process.env.SOURCE_BUCKET_NAME,
      Key: `${
        process.env.ENVIRONMENT
      }/playwright/${commit_hash}/results/${object_key.replace(
        /html|report/g,
        matched => (matched === 'html' ? 'txt' : 'summary'),
      )}`,
    });

    const { Body } = await s3_client.send(get_summary_command);

    const summary_text = await Body?.transformToString();

    const tests_passed = extract_number(
      summary_text as string,
      /Tests Passed: (\d+),/,
    );

    result.tests_passed = tests_passed;

    const total_tests = extract_number(
      summary_text as string,
      /Total Tests in Suite: (\d+),/,
    );

    result.total_tests = total_tests;

    const failed_tests = extract_number(
      summary_text as string,
      /Tests Failed: (\d+),/,
    );

    result.failed_tests = failed_tests;

    if (typeof failed_tests === 'number' && Boolean(failed_tests)) {
      const portal_error_images = content_response.filter(content =>
        content.key?.split('/')[4].startsWith(portal),
      );

      result.failed_test_screenshots = portal_error_images;
    }

    return result;
  });

  const response = await Promise.all(promises);

  return response;
};
