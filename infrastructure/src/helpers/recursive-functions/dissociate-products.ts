/* ---------- Modules ---------- */
import { update_product } from '_modules/products/functions/update/update-product';
import { get_all_product_associations_to_product_group } from '_modules/products/functions/get/get-all-product-associations-to-product-group';
import { dissociate_product_from_product_group } from '_modules/products/functions/update/dissociate-product-from-product-group';

/* ---------- Interfaces ---------- */
interface DissociateProductsInput {
  partition_key: string;
  product_group_sort_key: string;
}

/* ---------- Functions ---------- */
export const dissociate_products = async ({
  partition_key,
  product_group_sort_key,
}: DissociateProductsInput) => {
  const brand_id = partition_key.replace('brand#', '');

  let last_key: Record<string, unknown> | undefined;

  do {
    const { last_evaluated_key, product_to_product_group_associations } =
      await get_all_product_associations_to_product_group({
        brand_id,
        product_group_sort_key,
        last_key,
      });

    for (const item of product_to_product_group_associations) {
      const { sort_key } = item;

      const product_sort_key = `brand-product#${
        sort_key.split('brand-product#')[1]
      }`;

      const product_group_sort_key = sort_key.split('brand-product#')[0];

      await dissociate_product_from_product_group({
        brand_id,
        product_sort_key,
        product_group_sort_key,
      });

      await update_product({
        brand_id,
        product_sort_key,
      });
    }

    last_key = last_evaluated_key;
  } while (last_key);
};
