/* ---------- External ---------- */
import { StreamRecord } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

/* ---------- Modules ---------- */
import { increase_brand_products_count } from '_modules/brands/functions/update/increase-brand-products-count';
import { dissociate_product_from_product_group } from '_modules/products/functions/update/dissociate-product-from-product-group';

/* ---------- Models ---------- */
import { Product } from '_modules/products/models';

export const handle_product_deletion = async ({
  item,
}: {
  item: StreamRecord;
}) => {
  try {
    const { OldImage } = item;

    if (!OldImage) return;

    const record = DynamoDB.Converter.unmarshall(OldImage) as Product;

    const { partition_key, sort_key, product_group_sort_key } = record;

    if (!partition_key || !sort_key || !product_group_sort_key) return;

    const brand_id = partition_key.replace('brand#', '');

    if (!brand_id) return;

    /* ----------
     * Unassign the product from the product group
     * ---------- */
    await Promise.all([
      dissociate_product_from_product_group({
        brand_id,
        product_group_sort_key,
        product_sort_key: sort_key,
      }),

      increase_brand_products_count({
        brand_id,
        amount: -1,
      }),
    ]);
  } catch (err) {
    console.log('handle_product_deletion error: ', err);
  }
};
