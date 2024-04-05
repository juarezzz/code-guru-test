/* ---------- Modules ---------- */
import { get_all_products } from '_modules/products/functions/get/get-all-products';

/* ---------- Interfaces ---------- */
interface GetAllGtinsInput {
  key?: string;
  gtins: string[];
  brand_id: string;
}

export const get_all_gtins = async ({
  key,
  brand_id,
  gtins,
}: GetAllGtinsInput) => {
  const { products: products_list, last_evaluated_key } =
    await get_all_products({
      brand_id,
      last_key: key,
    });

  products_list.forEach(product => gtins.push(product.gtin));

  if (last_evaluated_key)
    get_all_gtins({ key: last_evaluated_key, brand_id, gtins });
};
