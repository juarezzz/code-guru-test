/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { chunk } from 'lodash';
import { Utils } from 'digital-link.js';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Clients ---------- */
import { gs1_client } from '_clients/gs1';

/* ---------- Modules ---------- */
import {
  GetExistingGCPOutput,
  get_existing_gcp,
} from '_modules/brand-gcps/functions/get/get-existing-gcp';

/* ---------- Interfaces ---------- */
interface GTINInformation {
  GTINTestResults: {
    GTIN: string;
    CertaintyValue: number;
    GCPCode: string;
    Status: string;
    IntegrityCheck: string;
    IntegrityCode: 0;
    GCPOwner: string;
    GS1Territory: string;
    BrandName: string;
    ProductDescription: string;
    ProductImageUrl: string;
    NetContent: string;
    CountryOfSaleCode: string;
  }[];

  Summary: {
    TotalGTINCount: number;
    TotalGS1UKGTINS: number;
    TotalGS1GlobalGTINS: number;
    TotalGTINsWithoutGCPOwner: number;
    TotalGTINErrorCount: number;
    ProcessingTimeSeconds: number;
    LRCallCount: number;
  };

  APIMessage: { StatusCode: number; Message: string };
}

interface GTINFormattedInformation {
  gcp: string;
  gtin: string;
  owned: boolean;
  company: string;
  approved: boolean;
  territory: string;
  available: boolean;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { headers, queryStringParameters } = event;

    const id_token = headers.Authorization || headers.authorization;

    const brand_id = get_authenticated_user({
      token: id_token,
    })?.['custom:brand_id'] as string | undefined;

    if (!queryStringParameters || !queryStringParameters.gtins)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
          code: error_messages['missing-required-query-string'].code,
        }),
      );

    const gtins_array: string[] = JSON.parse(queryStringParameters.gtins);

    if (!Array.isArray(gtins_array)) {
      throw new Error(
        handle_http_error({
          message: error_messages['invalid-gtin-array'].message,
          status_code: 400,
          code: error_messages['invalid-gtin-array'].code,
        }),
      );
    }

    const all_gtins_valid = gtins_array.every(gtin =>
      Utils.testRule(Utils.Rules.gtin, gtin),
    );

    if (!all_gtins_valid) {
      throw new Error(
        handle_http_error({
          message: error_messages['invalid-gtin-array'].message,
          status_code: 400,
          code: error_messages['invalid-gtin-array'].code,
        }),
      );
    }

    const { data } = await gs1_client.post<GTINInformation>('/', {
      gtins: gtins_array,
    });

    const unique_gcps_list = new Set<string>(
      data.GTINTestResults.map(({ GCPCode }) => GCPCode),
    );

    const unique_gcps_batches = chunk(Array.from(unique_gcps_list), 10);

    const registered_gcps_list: GetExistingGCPOutput[] = [];

    for (const gcp_batch of unique_gcps_batches) {
      const gcps_data = await Promise.all(
        gcp_batch.map(gcp => get_existing_gcp({ gcp })),
      );

      gcps_data.forEach(({ brand_gcp }) => {
        if (brand_gcp?.gcp) registered_gcps_list.push(brand_gcp);
      });
    }

    const formatted_payload: GTINFormattedInformation[] =
      data.GTINTestResults.map(gtin_entry => {
        const registered_gcp = registered_gcps_list.find(
          ({ gcp }) => gcp === gtin_entry.GCPCode,
        );

        const owned =
          (brand_id && registered_gcp?.brand_ids?.includes(brand_id)) || false;

        return {
          owned,
          gtin: gtin_entry.GTIN,
          gcp: gtin_entry.GCPCode,
          available: !registered_gcp,
          company: gtin_entry.GCPOwner,
          territory: gtin_entry.GS1Territory,
          approved: gtin_entry.CertaintyValue > 1,
        };
      });

    return http_response({
      body: { gs1_checker_response: formatted_payload },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /gs1-checker');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
