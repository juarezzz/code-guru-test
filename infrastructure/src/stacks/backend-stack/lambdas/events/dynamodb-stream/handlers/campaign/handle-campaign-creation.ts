/* ---------- External ---------- */
import { chunk } from 'lodash';
import { StreamRecord } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { format } from 'date-fns';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Campaign } from '_modules/campaigns/models';

/* ---------- Modules ---------- */
import { get_all_product_associations_to_product_group } from '_modules/products/functions/get/get-all-product-associations-to-product-group';
import { create_display_page } from '_modules/display-page/functions/create/create-display-page';
import { increase_brand_campaigns_count } from '_modules/brands/functions/update/increase-brand-campaigns-count';

/* ---------- Interfaces ---------- */
interface HandleCampaignCreationInput {
  item: StreamRecord;
}

/* ---------- Functions ---------- */
const handle_campaign_creation = async ({
  item,
}: HandleCampaignCreationInput) => {
  try {
    const { NewImage } = item;

    if (!NewImage) return;

    const record = unmarshall(
      NewImage as Record<string, AttributeValue>,
    ) as Campaign;

    const {
      partition_key,
      sort_key,
      campaign_landing_pages,
      campaign_product_groups,
    } = record;

    /* ----------
     * 1. If user added landing pages, we need
     * to associate them with the campaign
     * ---------- */
    if (campaign_landing_pages) {
      const insert_landing_pages_array = campaign_landing_pages.map(
        landing_page => ({
          PutRequest: {
            Item: {
              partition_key,
              datatype: 'brand-campaign-to-landing-page',
              sort_key: landing_page.landing_page_sort_key + sort_key,
            },
          },
        }),
      );

      const insert_landing_pages_array_batches = chunk(
        insert_landing_pages_array,
        25,
      );

      const insert_params = insert_landing_pages_array_batches.map(insert => {
        const params = {
          RequestItems: {
            [process.env.TABLE_NAME as string]: insert,
          },
        };

        const command = new BatchWriteCommand(params);

        return dynamodb_documentclient.send(command);
      });

      await Promise.all(insert_params);
    }

    /* ----------
     * 2. If user added product groups, we need
     * to associate them with the campaign
     * ---------- */
    if (campaign_product_groups) {
      const products_groups_array = campaign_product_groups.map(
        product_group => ({
          PutRequest: {
            Item: {
              datatype: 'brand-product-group-to-campaign',
              partition_key,
              sort_key: sort_key + product_group.product_group_sort_key,
            },
          },
        }),
      );

      const insert_products_groups_array_batches = chunk(
        products_groups_array,
        25,
      );

      const insert_params = insert_products_groups_array_batches.map(insert => {
        const params = {
          RequestItems: {
            [process.env.TABLE_NAME as string]: insert,
          },
        };

        const command = new BatchWriteCommand(params);

        return dynamodb_documentclient.send(command);
      });

      await Promise.all(insert_params);
    }

    /* ----------
     * 3. Create display pages for each product
     * and landing page added to the campaign
     * ---------- */
    const brand_id = partition_key.split('#')[1];
    const products_info: { gtin: string; product_group_sk: string }[] = [];

    await increase_brand_campaigns_count({
      brand_id,
      amount: 1,
    });

    const fetch_products_promises = campaign_product_groups.map(
      ({ product_group_sort_key }) => {
        const fetch_products_function = async () => {
          let last_key: Record<string, unknown> | undefined;

          do {
            const {
              last_evaluated_key,
              product_to_product_group_associations,
            } = await get_all_product_associations_to_product_group({
              brand_id,
              last_key,
              product_group_sort_key,
            });

            const infos = product_to_product_group_associations.map(
              association => {
                const sk_parts = association.sort_key.split('brand-product#');

                return {
                  gtin: sk_parts[1],
                  product_group_sk: sk_parts[0],
                };
              },
            );

            products_info.push(...infos);

            last_key = last_evaluated_key;
          } while (last_key);
        };

        return fetch_products_function();
      },
    );

    await Promise.all(fetch_products_promises);

    const create_display_pages_promises = products_info
      .map(({ gtin, product_group_sk }) =>
        campaign_landing_pages.map(
          ({ landing_page_sort_key, start_date, end_date }) =>
            create_display_page({
              product_id: gtin,
              brand_id: partition_key.replace('brand#', ''),
              product_group_id: product_group_sk.split('#')[1],
              campaign_id: sort_key.replace('brand-campaign#', ''),
              landing_page_id: landing_page_sort_key.split('#')[1],
              end_date: format(new Date(end_date), 'yyyy-MM-dd'),
              start_date: format(new Date(start_date), 'yyyy-MM-dd'),
            }),
        ),
      )
      .flat();

    const create_display_pages_batches = chunk(
      create_display_pages_promises,
      25,
    );

    await Promise.all(create_display_pages_batches);
  } catch (err) {
    console.error('error at handle_campaign_creation:');
    console.error(err);
  }
};

/* ---------- Exports ---------- */
export { handle_campaign_creation };
