/* ---------- Models ---------- */
import { ProductToGroupAssociation } from '_modules/products/models/product-to-product-group-association';

/* ---------- Modules ---------- */
import { get_all_product_associations_to_product_group } from '_modules/products/functions/get/get-all-product-associations-to-product-group';

/* ---------- Interfaces ---------- */
interface GetProductGroupGTINsInput {
  gtins: string[];
  brand_id: string;
  product_group_sort_key: string;
}

/* ---------- Functions ---------- */
export const get_product_group_gtins = async ({
  gtins,
  brand_id,
  product_group_sort_key,
}: GetProductGroupGTINsInput) => {
  const associations: ProductToGroupAssociation[] = [];
  let last_key: Record<string, unknown> | undefined;

  do {
    const { last_evaluated_key, product_to_product_group_associations } =
      await get_all_product_associations_to_product_group({
        brand_id,
        product_group_sort_key,
        last_key,
      });

    associations.push(...product_to_product_group_associations);
    last_key = last_evaluated_key;
  } while (last_key);

  const formatted_gtins = associations.map(
    association => association.sort_key.split('brand-product#')[1],
  );

  gtins.push(...formatted_gtins);
};
