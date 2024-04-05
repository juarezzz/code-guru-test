/* ---------- External ---------- */
import {
  DisableCommand,
  DisableCommandInput,
  Finding,
  ListFindingsCommand,
  ListFindingsCommandInput,
} from '@aws-sdk/client-inspector2';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { format } from 'date-fns';

/* ---------- Clients ---------- */
import { inspector_client } from '_clients/inspector';
import { s3_client } from '_clients/s3';

/* ---------- Utils ---------- */
import { create_error_message } from '_helpers/general/create-error-message';

/* ---------- Messages ---------- */
import { send_inspector_result_message } from './messages/send-inspector-result-message';
import { send_no_findings_error_message } from './messages/send-no-findings-message';
import { send_internal_error_message } from './messages/send-internal-error-message';

/* ---------- Interfaces ---------- */
export type CustomFinding = Pick<
  Finding,
  | 'description'
  | 'title'
  | 'resources'
  | 'codeVulnerabilityDetails'
  | 'severity'
  | 'fixAvailable'
  | 'packageVulnerabilityDetails'
  | 'type'
>;

/* ---------- Messages ---------- */
export const handler = async () => {
  try {
    let next_token: string | undefined;

    const all_findings: Finding[] = [];
    do {
      const params: ListFindingsCommandInput = { nextToken: next_token };

      const list_finding_command = new ListFindingsCommand(params);

      const { nextToken, findings } = await inspector_client.send(
        list_finding_command,
      );

      next_token = nextToken;

      if (findings) all_findings.push(...findings);
    } while (next_token);

    const params: DisableCommandInput = {
      resourceTypes: ['LAMBDA', 'LAMBDA_CODE'],
    };

    const unique_findings = all_findings.reduce((acc, finding) => {
      const {
        title,
        fixAvailable,
        packageVulnerabilityDetails,
        codeVulnerabilityDetails,
        severity,
        type,
        resources,
        description,
      } = finding;

      if (!title || !resources) return acc;

      if (!acc[title]) {
        acc[title] = {
          title,
          description,
          fixAvailable,
          packageVulnerabilityDetails,
          codeVulnerabilityDetails,
          severity,
          type,
          resources,
        };

        return acc;
      }

      acc[title].resources?.push(...resources);

      return acc;
    }, {} as Record<string, CustomFinding>);

    const json_file = JSON.stringify(unique_findings);

    const key = `findings-${format(new Date(), 'dd-MM-yyyy')}.json`;

    const save_to_s3_command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      Body: json_file,
    });

    await s3_client.send(save_to_s3_command);

    const disable_command = new DisableCommand(params);

    await inspector_client.send(disable_command);

    const get_report_command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
    });

    const signed_url = await getSignedUrl(s3_client, get_report_command, {
      expiresIn: 60 * 60 * 24 * 7,
    });

    if (all_findings.length)
      await send_inspector_result_message({
        findings: unique_findings,
        url: signed_url,
      });
    else await send_no_findings_error_message();
  } catch (error) {
    console.error(error);

    /* ----------
     * Sending error message to Slack
     * ---------- */
    await send_internal_error_message({
      internal_error_message: create_error_message(JSON.stringify(error)),
    });
  }
};
