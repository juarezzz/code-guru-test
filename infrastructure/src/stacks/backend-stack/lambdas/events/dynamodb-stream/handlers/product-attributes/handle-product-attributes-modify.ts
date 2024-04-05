/* ---------- External ---------- */
import { StreamRecord } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

/* ---------- Models ---------- */
import { Product } from '_modules/products/models';
import { ProductAttributes } from '_modules/product-attributes/models';

/* ---------- Modules ---------- */
import { get_all_products } from '_modules/products/functions/get/get-all-products';
import { update_product_attributes } from '_modules/products/functions/update/update-product-attributes';

export const handle_product_attributes_modify = async ({
  item,
}: {
  item: StreamRecord;
}) => {
  try {
    const { NewImage } = item;

    if (!NewImage) return;

    const { attributes: new_attributes, partition_key } =
      DynamoDB.Converter.unmarshall(NewImage) as ProductAttributes;

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

    for (const { sort_key, attributes } of brand_products)
      await update_product_attributes({
        brand_id,
        product_sort_key: sort_key,
        current_attributes: attributes,
        new_attributes,
      });
  } catch (err) {
    console.log('handle_product_attributes_modify error: ', err);
  }
};
