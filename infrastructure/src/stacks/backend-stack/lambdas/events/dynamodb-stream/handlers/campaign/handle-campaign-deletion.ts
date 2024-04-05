/* ---------- External ---------- */
import { chunk } from 'lodash';
import { StreamRecord } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Campaign } from '_modules/campaigns/models';
import { DisplayPage } from '_modules/display-page/models';

/* ---------- Modules ---------- */
import { get_display_pages_by_gtin } from '_modules/display-page/functions/get/get-display-pages-by-gtin';
import { delete_display_page_by_sort_key } from '_modules/display-page/functions/delete/delete-display-page-by-sort-key';
import { get_all_product_associations_to_product_group } from '_modules/products/functions/get/get-all-product-associations-to-product-group';
import { increase_brand_campaigns_count } from '_modules/brands/functions/update/increase-brand-campaigns-count';
import { CampaignFormEvent } from '_modules/campaign-events/models';
import { get_form_events_by_campaign_id } from '_modules/campaign-events/functions/get/get-form-events-by-campaign-id';

/* ---------- Interfaces ---------- */
interface HandleCampaignDeletionInput {
  item: StreamRecord;
}

/* ---------- Functions ---------- */
const handle_campaign_deletion = async ({
  item,
}: HandleCampaignDeletionInput) => {
  try {
    const { OldImage } = item;

    if (!OldImage) return;

    const record = unmarshall(
      OldImage as Record<string, AttributeValue>,
    ) as Campaign;

    const {
      partition_key,
      sort_key,
      campaign_landing_pages,
      campaign_product_groups,
    } = record;

    const brand_id = partition_key.replace('brand#', '');
    const campaign_id = sort_key.replace('brand-campaign#', '');

    await increase_brand_campaigns_count({
      brand_id,
      amount: -1,
    });

    /* ----------
     * 1. If the campaign has associated landing pages,
     * remove them from the campaign
     * ---------- */
    if (campaign_landing_pages) {
      const delete_landing_pages_array = campaign_landing_pages.map(
        landing_page => ({
          DeleteRequest: {
            Key: {
              partition_key: `brand#${brand_id}`,
              sort_key: `${landing_page.landing_page_sort_key}${sort_key}`,
            },
          },
        }),
      );

      const delete_landing_pages_array_batches = chunk(
        delete_landing_pages_array,
        25,
      );

      const delete_params = delete_landing_pages_array_batches.map(
        delete_item => {
          const params = {
            RequestItems: {
              [process.env.TABLE_NAME as string]: delete_item,
            },
          };

          const command = new BatchWriteCommand(params);

          return dynamodb_documentclient.send(command);
        },
      );

      await Promise.all(delete_params);
    }

    /* ----------
     * 2. If the campaign has product groups
     * associated to it, dissociate them
     * ---------- */
    if (campaign_product_groups) {
      const delete_product_groups_array = campaign_product_groups.map(
        product_group => ({
          DeleteRequest: {
            Key: {
              partition_key: `brand#${brand_id}`,
              sort_key: `${sort_key}${product_group.product_group_sort_key}`,
            },
          },
        }),
      );

      const delete_product_groups_array_batches = chunk(
        delete_product_groups_array,
        25,
      );

      const delete_params = delete_product_groups_array_batches.map(
        delete_item => {
          const params = {
            RequestItems: {
              [process.env.TABLE_NAME as string]: delete_item,
            },
          };

          const command = new BatchWriteCommand(params);

          return dynamodb_documentclient.send(command);
        },
      );

      await Promise.all(delete_params);
    }

    /* ----------
     * 3. Delete each and every display
     * page associated to the campaign
     * ---------- */
    const product_gtins: string[] = [];

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

            const gtins = product_to_product_group_associations.map(
              association => association.sort_key.split('brand-product#')[1],
            );

            product_gtins.push(...gtins);

            last_key = last_evaluated_key;
          } while (last_key);
        };

        return fetch_products_function();
      },
    );

    await Promise.all(fetch_products_promises);

    const unique_gtins_list = Array.from(new Set(product_gtins));

    const campaign_display_pages: DisplayPage[] = [];

    const fetch_display_pages_promises = unique_gtins_list.map(product_gtin => {
      const fetch_display_pages_function = async () => {
        let last_key: Record<string, unknown> | undefined;

        do {
          const { last_evaluated_key, display_pages } =
            await get_display_pages_by_gtin({
              last_key,
              gtin: product_gtin,
            });

          campaign_display_pages.push(...display_pages);

          last_key = last_evaluated_key;
        } while (last_key);
      };

      return fetch_display_pages_function();
    });

    await Promise.all(fetch_display_pages_promises);

    const delete_display_pages_promises = campaign_display_pages.map(
      ({ sort_key: display_page_sort_key }) =>
        delete_display_page_by_sort_key({
          brand_id,
          display_page_sort_key,
        }),
    );

    const delete_display_pages_batches = chunk(
      delete_display_pages_promises,
      25,
    );

    await Promise.all(delete_display_pages_batches);

    /* ----------
     * 4. Delete all campaign events items
     * ---------- */
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

    for (const batch of chunk(events, 25)) {
      const batch_delete_params = {
        RequestItems: {
          [process.env.TABLE_NAME as string]: [
            ...batch.map(({ partition_key: pk, sort_key: sk }) => ({
              DeleteRequest: {
                Key: {
                  partition_key: pk,
                  sort_key: sk,
                },
              },
            })),
          ],
        },
      };

      const command = new BatchWriteCommand(batch_delete_params);

      await dynamodb_documentclient.send(command);
    }
  } catch (err) {
    console.error('error at handle_campaign_deletion:');
    console.error(err);
  }
};

/* ---------- Exports ---------- */
export { handle_campaign_deletion };
