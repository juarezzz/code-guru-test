/* ---------- External ---------- */
import { StreamRecord } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

/* ---------- Models ---------- */
import { Product } from '_modules/products/models';
import { ProductComponents } from '_modules/product-components/models';

/* ---------- Modules ---------- */
import { get_all_products } from '_modules/products/functions/get/get-all-products';
import { update_product_components } from '_modules/products/functions/update/update-product-components';

export const handle_product_components_creation = async ({
  item,
}: {
  item: StreamRecord;
}) => {
  try {
    const { NewImage } = item;

    if (!NewImage) return;

    const { components: new_components, partition_key } =
      DynamoDB.Converter.unmarshall(NewImage) as ProductComponents;

    const brand_id = partition_key.split('#')[1];

    let last_key: string | undefined;
    const brand_products: Product[] = [];

    do {
      const { products, last_evaluated_key } = await get_all_products({
        brand_id,
        last_key,
      });
      last_key = last_evaluated_key;
      brand_products.push(...products);
    } while (last_key);

    for (const { sort_key, components } of brand_products)
      await update_product_components({
        brand_id,
        product_sort_key: sort_key,
        current_components: components,
        new_components,
      });
  } catch (err) {
    console.log('handle_product_components_modify error: ', err);
  }
};
