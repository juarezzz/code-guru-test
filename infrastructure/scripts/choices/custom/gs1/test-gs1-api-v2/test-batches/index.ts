/* ---------- Constants ---------- */
import { performance } from 'perf_hooks';

/* ---------- Constants ---------- */
import { gtins } from '__scripts/choices/custom/gs1/test-gs1-api-v2/gtins.json';

/* ---------- Utils ---------- */
import { get_random_elements } from '__scripts/utils/get-random-elements';

/* ---------- Logs ---------- */
import { write_file } from '__scripts/utils/write-file';

import { gs1_api } from '../services';

interface Data {
  GTIN: string;
  CertaintyValue: number;
  GCPCode: string;
  Status: string;
  IntegrityCheck: string;
  IntegrityCode: number;
  GCPOwner: string;
  GS1Territory: string;
  CountryOfSaleCode: string;
  NetContent: string;
  ProductImageUrl: string;
  ProductDescription: string;
  BrandName: string;
}

interface Analytics {
  certainty_value: {
    0: number;
    1: number;
    2: number;
    3: number;
  };
  gcp: number;
  status: number;
  integrity_check: Record<string, number>;
  gcp_owner: number;
  gs1_territory: number;
  brand_name: number;
  product_description: number;
  product_image_url: number;
  net_content: number;
  country_of_sale_code: number;
}

const analysis_data = async ({ data, analytics }: { data: Data; analytics: Analytics }) => {
  if (data.BrandName !== '') analytics.brand_name += 1;

  if (data.CertaintyValue === 0) analytics.certainty_value[0] += 1;
  else if (data.CertaintyValue === 1) analytics.certainty_value[1] += 1;
  else if (data.CertaintyValue === 2) analytics.certainty_value[2] += 1;
  else if (data.CertaintyValue === 3) analytics.certainty_value[3] += 1;

  if (data.CountryOfSaleCode !== '') analytics.country_of_sale_code += 1;

  if (data.GCPOwner !== '') analytics.gcp_owner += 1;

  if (data.GCPCode !== '') analytics.gcp += 1;

  if (data.GS1Territory !== '') analytics.gs1_territory += 1;

  if (data.IntegrityCheck !== '') {
    if (data.IntegrityCheck in analytics.integrity_check) {
      analytics.integrity_check[data.IntegrityCheck] += 1;
    } else {
      analytics.integrity_check[data.IntegrityCheck] = 1;
    }
  }

  if (data.NetContent !== '') analytics.net_content += 1;

  if (data.ProductDescription !== '') analytics.product_description += 1;

  if (data.ProductImageUrl !== '') analytics.product_image_url += 1;

  if (data.Status !== '') analytics.status += 1;
};

/* ---------- Main Function ---------- */
export const test_batches = async () => {
  console.group();

  const gtins_to_test_100 = get_random_elements(gtins, 100);
  const gtins_to_test_500 = get_random_elements(gtins, 500);
  const gtins_to_test_1000 = get_random_elements(gtins, 1000);

  /* ----------
   * Testing batch of 100
   * ---------- */
  try {
    const analytics_100 = {
      response_time: '0ms',
      certainty_value: {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
      },
      gcp: 0,
      status: 0,
      integrity_check: {},
      gcp_owner: 0,
      gs1_territory: 0,
      brand_name: 0,
      product_description: 0,
      product_image_url: 0,
      net_content: 0,
      country_of_sale_code: 0,
    };

    const start_time = performance.now();

    const { data: data_100 } = await gs1_api.post(
      '/',
      {
        gtins: new Array(...new Set(gtins_to_test_100)),
      },
      {
        headers: {
          Authorization: 'Bearer <key>',
        },
      },
    );

    const end_time = performance.now();

    analytics_100.response_time = `${Math.round(end_time - start_time)}ms`;

    const { GTINTestResults } = data_100;

    GTINTestResults.forEach((data: Data) => {
      analysis_data({ data, analytics: analytics_100 });
    });

    const date = new Date().toISOString().substring(11, 19);

    await write_file({
      file_name: `test-batches-100___${date.replace(':', '-').replace(':', '-')}.json`,
      data: analytics_100,
      folder: 'test-gs1-api-v2',
      uuid: false,
    });
  } catch (error) {
    const date = new Date().toISOString().substring(11, 19);

    await write_file({
      file_name: `test-batches-100___${date.replace(':', '-').replace(':', '-')}.json`,
      data: { error: JSON.stringify(error) },
      folder: 'test-gs1-api-v2',
      uuid: false,
    });
  }

  /* ----------
   * Testing batch of 500
   * ---------- */
  try {
    const analytics_500 = {
      response_time: '0ms',
      certainty_value: {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
      },
      gcp: 0,
      status: 0,
      integrity_check: {},
      gcp_owner: 0,
      gs1_territory: 0,
      brand_name: 0,
      product_description: 0,
      product_image_url: 0,
      net_content: 0,
      country_of_sale_code: 0,
    };

    const start_time = performance.now();

    const { data: data_500 } = await gs1_api.post(
      '/',
      {
        gtins: new Array(...new Set(gtins_to_test_500)),
      },
      {
        headers: {
          Authorization: 'Bearer <key>',
        },
      },
    );

    const end_time = performance.now();

    analytics_500.response_time = `${Math.round(end_time - start_time)}ms`;

    const { GTINTestResults } = data_500;

    GTINTestResults.forEach((data: Data) => {
      analysis_data({ data, analytics: analytics_500 });
    });

    const date = new Date().toISOString().substring(11, 19);

    await write_file({
      file_name: `test-batches-500___${date.replace(':', '-').replace(':', '-')}.json`,
      data: analytics_500,
      folder: 'test-gs1-api-v2',
      uuid: false,
    });
  } catch (error) {
    const date = new Date().toISOString().substring(11, 19);

    await write_file({
      file_name: `test-batches-500${date.replace(':', '-').replace(':', '-')}.json`,
      data: { error: JSON.stringify(error) },
      folder: 'test-gs1-api-v2',
      uuid: false,
    });
  }

  /* ----------
   * Testing batch of 1000
   * ---------- */
  try {
    const analytics_1000 = {
      response_time: '0ms',
      certainty_value: {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
      },
      gcp: 0,
      status: 0,
      integrity_check: {},
      gcp_owner: 0,
      gs1_territory: 0,
      brand_name: 0,
      product_description: 0,
      product_image_url: 0,
      net_content: 0,
      country_of_sale_code: 0,
    };

    const start_time = performance.now();

    const { data: data_1000 } = await gs1_api.post(
      '/',
      {
        gtins: new Array(...new Set(gtins_to_test_1000)),
      },
      {
        headers: {
          Authorization: 'Bearer <key>',
        },
      },
    );

    const end_time = performance.now();

    analytics_1000.response_time = `${Math.round(end_time - start_time)}ms`;

    const { GTINTestResults } = data_1000;

    GTINTestResults.forEach((data: Data) => {
      analysis_data({ data, analytics: analytics_1000 });
    });

    const date = new Date().toISOString().substring(11, 19);

    await write_file({
      file_name: `test-batches-1000___${date.replace(':', '-').replace(':', '-')}.json`,
      data: analytics_1000,
      folder: 'test-gs1-api-v2',
      uuid: false,
    });
  } catch (error) {
    const date = new Date().toISOString().substring(11, 19);

    await write_file({
      file_name: `test-batches-1000${date.replace(':', '-').replace(':', '-')}.json`,
      data: { error: JSON.stringify(error) },
      folder: 'test-gs1-api-v2',
      uuid: false,
    });
  }

  console.groupEnd();
};
