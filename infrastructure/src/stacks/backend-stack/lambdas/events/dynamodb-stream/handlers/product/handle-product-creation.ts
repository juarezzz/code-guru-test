/* ---------- External ---------- */
import { StreamRecord } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

/* ---------- Models ---------- */
import { Product } from '_modules/products/models';

/* ---------- Modules ---------- */
import { increase_brand_products_count } from '_modules/brands/functions/update/increase-brand-products-count';
import { associate_product_to_product_group } from '_modules/products/functions/update/associate-product-to-product-group';

export const handle_product_creation = async ({
  item,
}: {
  item: StreamRecord;
}) => {
  try {
    const { NewImage } = item;

    if (!NewImage) return;

    const product = DynamoDB.Converter.unmarshall(NewImage) as Product;

    const { partition_key, sort_key, product_group_sort_key } = product;

    const brand_id = partition_key.replace('brand#', '');
    const product_sort_key = sort_key;

    if (!brand_id || !product_group_sort_key || !product_sort_key) return;

    /* ----------
     * Assign the product to the product group
     * ---------- */
    await Promise.all([
      associate_product_to_product_group({
        brand_id,
        product_sort_key,
        product_group_sort_key,
      }),

      increase_brand_products_count({
        brand_id,
        amount: 1,
      }),
    ]);
  } catch (err) {
    console.log('handle_product_creation error: ', err);
  }
};
