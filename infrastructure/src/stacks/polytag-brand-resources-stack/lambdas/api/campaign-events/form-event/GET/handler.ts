/* ---------- External ---------- */
import { format as date_format } from 'date-fns';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Duration } from 'aws-cdk-lib';

/* ---------- Helpers ---------- */
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Modules ---------- */
import { CampaignFormEvent } from '_modules/campaign-events/models';
import { get_form_events_by_campaign_id } from '_modules/campaign-events/functions/get/get-form-events-by-campaign-id';

/* ---------- Clients ---------- */
import { error_messages } from '_constants/error-messages';
import { s3_client } from '_clients/s3';

/* ---------- Constants ---------- */
import { roles } from '_constants/roles';
import { get_campaign_by_sort_key } from '_modules/campaigns/functions/get/get-campaign-by-sort-key';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

interface CreateResultFileInput {
  format: string;
  form_events: CampaignFormEvent[];
  campaign_name: string;
}

interface CreateResultFileOutput {
  title: string;
  file_raw: string;
}

/* ---------- Constants ---------- */
const FORMAT_EXTENSION_MAP: Record<string, string> = {
  csv: '.csv',
  xml: '.xml',
};

/* ---------- Functions ---------- */
const create_result_file = ({
  format,
  form_events,
  campaign_name,
}: CreateResultFileInput): CreateResultFileOutput => {
  const title = `polytag-${campaign_name
    .toLocaleLowerCase()
    .replace(/\s/g, '-')}-entries-${date_format(new Date(), 'dd-MM-yyyy')}${
    FORMAT_EXTENSION_MAP[format]
  }`;

  let file_raw;

  switch (format) {
    case 'csv': {
      const has_serials = form_events.some(ev => ev.serial);
      const checkbox_headers = form_events
        .filter(ev => !!ev.checkboxes)
        .sort((a, b) => b.created_at - a.created_at)[0]
        ?.checkboxes?.map(
          ({ label, mandatory }) =>
            `${label} (${mandatory ? 'mandatory' : 'optional'})`,
        );

      const headers = [
        'Timestamp',
        'Email',
        'Campaign',
        'Landing page',
        'Product scanned',
        'GTIN',
        ...(has_serials ? ['Serial'] : []),
        ...(checkbox_headers || []),
      ].join(', ');

      const rows = form_events.map(ev =>
        [
          date_format(ev.created_at, 'yyyy-MM-dd HH:mm'),
          ev.email,
          ev.campaign_name,
          ev.landing_page_name,
          ev.product_name,
          ev.gtin,
          ...(ev.serial ? [ev.serial] : []),
          ...(ev.checkboxes
            ? ev.checkboxes.map(({ checked }) => (checked ? 'Y' : ''))
            : []),
        ].join(', '),
      );

      file_raw = [headers, ...rows].join('\n');

      break;
    }

    case 'xml': {
      const xml_header = '<?xml version="1.0" encoding="UTF-8"?>';

      const xml_items = form_events
        .map(
          ev =>
            `<Item>
              <Timestamp>${date_format(ev.created_at, 'yyyy-MM-dd, HH:mm')}
              </Timestamp>
              <Email>${ev.email}</Email>
              <Campaign>${ev.campaign_name}</Campaign>
              <Landing Page>${ev.landing_page_name}</Landing Page>
              <Product scanned>${ev.product_name}</Product scanned>
              <GTIN>${ev.gtin}</GTIN>
              ${ev.serial ? `\n<Serial>${ev.serial}</Serial>` : ''}
              ${
                ev.checkboxes
                  ? ev.checkboxes.map(
                      ({ label, checked, mandatory }) =>
                        `\n<${label} (${
                          mandatory ? 'mandatory' : 'optional'
                        })>${checked ? 'Y' : ''}</${label} (${
                          mandatory ? 'mandatory' : 'optional'
                        })>`,
                    )
                  : ''
              }
            </Item>`,
        )
        .join('\n');

      file_raw = `${xml_header}\n<Items>\n${xml_items}\n</Items>`;

      break;
    }

    default:
      throw new Error(
        handle_http_error({
          message: error_messages['invalid-file'].message,
          status_code: 400,
          code: error_messages['invalid-file'].code,
        }),
      );
  }

  return { title, file_raw };
};

export const handler: APIGatewayProxyHandlerV2 = async (
  event: Event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters, headers } = event;

    if (!queryStringParameters)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
          code: error_messages['missing-required-query-string'].code,
        }),
      );

    const { campaign_id, format } = queryStringParameters;

    if (!campaign_id || !format)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
          code: error_messages['missing-required-query-string'].code,
        }),
      );

    const id_token = headers.Authorization || headers.authorization;

    const { 'custom:brand_id': brand_id, 'cognito:groups': cognito_groups } =
      get_authenticated_user({
        token: id_token,
      });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['brand-campaign-events']?.includes('GET'))
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    if (!brand_id)
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const campaign = await get_campaign_by_sort_key({
      brand_id,
      campaign_sort_key: `brand-campaign#${campaign_id}`,
    });

    if (!campaign)
      throw new Error(
        handle_http_error({
          code: error_messages['campaign-does-not-exist'].code,
          message: error_messages['campaign-does-not-exist'].message,
          status_code: 404,
        }),
      );

    let last_key;
    const events: CampaignFormEvent[] = [];

    do {
      const { form_events, last_evaluated_key } =
        await get_form_events_by_campaign_id({
          brand_id,
          campaign_id,
          last_evaluated_key: last_key,
        });

      events.push(...form_events);
      last_key = last_evaluated_key;
    } while (last_key);

    const { file_raw, title } = create_result_file({
      format,
      form_events: events,
      campaign_name: campaign.campaign_name,
    });

    const save_command = new PutObjectCommand({
      Body: file_raw,
      Bucket: process.env.BUCKET_NAME,
      Key: `campaign-events/${campaign_id}/${title}`,
    });

    await s3_client.send(save_command);

    const get_result_command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `campaign-events/${campaign_id}/${title}`,
    });

    const download_url = await getSignedUrl(s3_client, get_result_command, {
      expiresIn: Duration.days(2).toSeconds(),
    });

    return http_response({
      body: { download_url },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /campaign-events/form-event');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
