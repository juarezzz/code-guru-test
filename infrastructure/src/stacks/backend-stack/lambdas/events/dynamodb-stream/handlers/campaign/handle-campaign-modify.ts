/* ---------- External ---------- */
import { chunk, isEqual } from 'lodash';
import { StreamRecord } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Helpers ---------- */
import { get_object_arrays_difference } from '_helpers/utils/get-object-arrays-difference';

/* ---------- Models ---------- */
import { DisplayPage } from '_modules/display-page/models';
import {
  Campaign,
  CampaignLandingPage,
  CampaignProductGroup,
} from '_modules/campaigns/models';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Modules ---------- */
import { create_display_page } from '_modules/display-page/functions/create/create-display-page';
import { get_display_pages_by_gtin } from '_modules/display-page/functions/get/get-display-pages-by-gtin';
import { update_product_group_fields } from '_modules/product-groups/functions/update/update-product-group-fields';
import { delete_display_page_by_sort_key } from '_modules/display-page/functions/delete/delete-display-page-by-sort-key';
import { get_all_product_associations_to_product_group } from '_modules/products/functions/get/get-all-product-associations-to-product-group';

/* ---------- Interfaces ---------- */
interface HandleCampaignModifyInput {
  item: StreamRecord;
}

interface HandleCampaignProductGroupsChangeInput {
  brand_id: string;
  campaign_sort_key: string;
  old_groups: CampaignProductGroup[];
  new_groups: CampaignProductGroup[];
  new_pages: CampaignLandingPage[];
}

interface HandleCampaignLandingPagesChangeInput {
  brand_id: string;
  campaign_sort_key: string;
  old_pages: CampaignLandingPage[];
  new_pages: CampaignLandingPage[];
  old_groups: CampaignProductGroup[];
  new_groups: CampaignProductGroup[];
}

interface HandleCampaignDetailsChangeInput {
  brand_id: string;
  old_details: Campaign;
  new_details: Campaign;
  campaign_sort_key: string;
}

/* ---------- Functions ---------- */
const handle_campaign_product_groups_change = async ({
  brand_id,
  new_pages,
  old_groups,
  new_groups,
  campaign_sort_key,
}: HandleCampaignProductGroupsChangeInput) => {
  if (isEqual(old_groups, new_groups)) return;

  const groups_to_remove = get_object_arrays_difference<CampaignProductGroup>({
    base_array: old_groups,
    change_array: new_groups,
    relevant_properties: ['product_group_sort_key'],
  });

  const groups_to_add = get_object_arrays_difference<CampaignProductGroup>({
    base_array: new_groups,
    change_array: old_groups,
    relevant_properties: ['product_group_sort_key'],
  });

  if (groups_to_remove.length) {
    /* ----------
     * Querying and deleting all landing pages
     * ---------- */
    const product_gtins: string[] = [];

    const fetch_products_promises = groups_to_remove.map(
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
     * Deleting all group associations to the campaign
     * ---------- */
    const unique_product_group_sks = Array.from(
      new Set(
        groups_to_remove.map(
          ({ product_group_sort_key }) => product_group_sort_key,
        ),
      ),
    );

    const delete_product_groups_associations = unique_product_group_sks.map(
      old_product_group_sk => ({
        DeleteRequest: {
          Key: {
            partition_key: `brand#${brand_id}`,
            sort_key: `${campaign_sort_key}${old_product_group_sk}`,
          },
        },
      }),
    );

    const delete_product_groups_associations_batches = chunk(
      delete_product_groups_associations,
      25,
    );

    const delete_product_groups_associations_promises =
      delete_product_groups_associations_batches.map(delete_item => {
        const params = {
          RequestItems: {
            [process.env.TABLE_NAME as string]: delete_item,
          },
        };

        const command = new BatchWriteCommand(params);

        return dynamodb_documentclient.send(command);
      });

    await Promise.all(delete_product_groups_associations_promises);
  }

  if (groups_to_add.length) {
    /* ----------
     * Creating new display pages
     * ---------- */
    const products_info: { gtin: string; product_group_sk: string }[] = [];

    const fetch_products_promises = groups_to_add.map(
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
        new_pages.map(({ landing_page_sort_key, start_date, end_date }) =>
          create_display_page({
            brand_id,
            end_date,
            start_date,
            product_id: gtin,
            product_group_id: product_group_sk.split('#')[1],
            landing_page_id: landing_page_sort_key.split('#')[1],
            campaign_id: campaign_sort_key.replace('brand-campaign#', ''),
          }),
        ),
      )
      .flat();

    const create_display_pages_batches = chunk(
      create_display_pages_promises,
      25,
    );

    await Promise.all(create_display_pages_batches);

    /* ----------
     * Associating new groups to the campaign
     * ---------- */
    const unique_product_group_sks = Array.from(
      new Set(
        groups_to_add.map(
          ({ product_group_sort_key }) => product_group_sort_key,
        ),
      ),
    );

    const products_groups_array = unique_product_group_sks.map(
      new_product_group_sk => ({
        PutRequest: {
          Item: {
            datatype: 'brand-product-group-to-campaign',
            partition_key: `brand#${brand_id}`,
            sort_key: `${campaign_sort_key}${new_product_group_sk}`,
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
};

const handle_campaign_landing_pages_change = async ({
  brand_id,
  old_pages,
  new_pages,
  old_groups,
  new_groups,
  campaign_sort_key,
}: HandleCampaignLandingPagesChangeInput) => {
  if (isEqual(old_pages, new_pages)) return;

  const pages_to_remove = get_object_arrays_difference<CampaignLandingPage>({
    base_array: old_pages,
    change_array: new_pages,
  });

  const pages_to_add = get_object_arrays_difference<CampaignLandingPage>({
    base_array: new_pages,
    change_array: old_pages,
  });

  if (pages_to_remove.length) {
    /* ----------
     * Querying and deleting all display pages
     * ---------- */
    const products_info: { gtin: string; product_group_sk: string }[] = [];

    const unique_landing_pages_sks = Array.from(
      new Set(
        pages_to_remove.map(
          ({ landing_page_sort_key }) => landing_page_sort_key,
        ),
      ),
    );

    const fetch_products_promises = old_groups.map(
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

    const delete_display_pages_promises = products_info
      .map(({ gtin }) =>
        pages_to_remove.map(({ end_date, start_date }) => {
          const start_date_obj = new Date(`${start_date}T00:00:00.000Z`);
          const end_date_obj = new Date(`${end_date}T23:59:59.999Z`);

          const start_date_string = start_date_obj.toISOString().split('T')[0];
          const end_date_string = end_date_obj.toISOString().split('T')[0];

          const date_identifier = `${
            start_date_string?.replace(/\D/g, '') || ''
          }${end_date_string?.replace(/\D/g, '') || ''}`;

          return delete_display_page_by_sort_key({
            brand_id,
            display_page_sort_key: `brand-display-page#${gtin}#${date_identifier}`,
          });
        }),
      )
      .flat();

    const delete_display_pages_batches = chunk(
      delete_display_pages_promises,
      25,
    );

    for (const promises_chunk of delete_display_pages_batches) {
      await Promise.all(promises_chunk);
    }

    /* ----------
     * Querying and deleting all landing
     * page associations to the campaign
     * ---------- */
    const delete_landing_pages_params = unique_landing_pages_sks.map(
      old_landing_page_sk => ({
        DeleteRequest: {
          Key: {
            partition_key: `brand#${brand_id}`,
            sort_key: `${old_landing_page_sk}${campaign_sort_key}`,
          },
        },
      }),
    );

    const delete_landing_pages_params_batches = chunk(
      delete_landing_pages_params,
      25,
    );

    const delete_params = delete_landing_pages_params_batches.map(
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

  if (pages_to_add.length) {
    /* ----------
     * Creating new display pages
     * ---------- */
    const products_info: { gtin: string; product_group_sk: string }[] = [];

    const fetch_products_promises = new_groups.map(
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
        pages_to_add.map(({ landing_page_sort_key, start_date, end_date }) =>
          create_display_page({
            brand_id,
            end_date,
            start_date,
            product_id: gtin,
            product_group_id: product_group_sk.split('#')[1],
            landing_page_id: landing_page_sort_key.split('#')[1],
            campaign_id: campaign_sort_key.replace('brand-campaign#', ''),
          }),
        ),
      )
      .flat();

    const create_display_pages_batches = chunk(
      create_display_pages_promises,
      25,
    );

    await Promise.all(create_display_pages_batches);

    /* ----------
     * Associating new landing
     * pages to the campaign
     * ---------- */
    const unique_landing_pages_sks = Array.from(
      new Set(
        pages_to_add.map(({ landing_page_sort_key }) => landing_page_sort_key),
      ),
    );

    const create_landing_pages_associations_params =
      unique_landing_pages_sks.map(new_landing_page_sk => ({
        PutRequest: {
          Item: {
            datatype: 'brand-campaign-to-landing-page',
            partition_key: `brand#${brand_id}`,
            sort_key: `${new_landing_page_sk}${campaign_sort_key}`,
          },
        },
      }));

    const create_landing_pages_associations_batches = chunk(
      create_landing_pages_associations_params,
      25,
    );

    const insert_params = create_landing_pages_associations_batches.map(
      insert => {
        const params = {
          RequestItems: {
            [process.env.TABLE_NAME as string]: insert,
          },
        };

        const command = new BatchWriteCommand(params);

        return dynamodb_documentclient.send(command);
      },
    );

    await Promise.all(insert_params);
  }
};

const handle_campaign_details_change = async ({
  brand_id,
  old_details,
  new_details,
  campaign_sort_key,
}: HandleCampaignDetailsChangeInput) => {
  if (old_details.campaign_name === new_details.campaign_name) return;

  const change_promises = new_details.campaign_product_groups.map(
    ({ product_group_sort_key }) => {
      return update_product_group_fields({
        brand_id,
        product_group_sort_key,
        assigned_campaign_name: new_details.campaign_name,
        assigned_campaign_sort_key: campaign_sort_key,
      });
    },
  );

  await Promise.all(change_promises);
};

const handle_campaign_modify = async ({ item }: HandleCampaignModifyInput) => {
  try {
    const { OldImage, NewImage } = item;

    if (!OldImage || !NewImage) return;

    const old_record = unmarshall(
      OldImage as Record<string, AttributeValue>,
    ) as Campaign;

    const new_record = unmarshall(
      NewImage as Record<string, AttributeValue>,
    ) as Campaign;

    const campaign_sort_key = old_record.sort_key;
    const brand_id = old_record.partition_key.split('#')[1];

    /* ----------
     * 1. Based on the new groups associated to the
     * campaign, delete and create display pages
     * and group associations to the campaign
     * ---------- */
    await handle_campaign_product_groups_change({
      brand_id,
      campaign_sort_key,
      new_pages: new_record.campaign_landing_pages,
      old_groups: old_record.campaign_product_groups,
      new_groups: new_record.campaign_product_groups,
    });

    /* ----------
     * 2. Based on the new pages associated to the
     * campaign, delete and create display pages
     * and landing page associations to the campaign
     * ---------- */
    await handle_campaign_landing_pages_change({
      brand_id,
      campaign_sort_key,
      old_pages: old_record.campaign_landing_pages,
      new_pages: new_record.campaign_landing_pages,
      old_groups: old_record.campaign_product_groups,
      new_groups: new_record.campaign_product_groups,
    });

    /* ----------
     * 3. Change information about the campaign
     * throughout the product groups it's assigned to
     * ---------- */
    await handle_campaign_details_change({
      brand_id,
      campaign_sort_key,
      old_details: old_record,
      new_details: new_record,
    });
  } catch (err) {
    console.error('error at handle_campaign_modify:');
    console.error(err);
  }
};

/* ---------- Exports ---------- */
export { handle_campaign_modify };
