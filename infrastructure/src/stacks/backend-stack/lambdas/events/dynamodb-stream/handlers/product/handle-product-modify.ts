/* ---------- External ---------- */
import { StreamRecord } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

/* ---------- Models ---------- */
import { Product } from '_modules/products/models';

/* ---------- Modules ---------- */
import { associate_product_to_product_group } from '_modules/products/functions/update/associate-product-to-product-group';
import { dissociate_product_from_product_group } from '_modules/products/functions/update/dissociate-product-from-product-group';

export const handle_product_modify = async ({
  item,
}: {
  item: StreamRecord;
}) => {
  try {
    const { NewImage, OldImage } = item;

    if (!NewImage || !OldImage) return;

    const unmarshalled_old = DynamoDB.Converter.unmarshall(OldImage) as Product;
    const unmarshalled_new = DynamoDB.Converter.unmarshall(NewImage) as Product;

    const brand_id = unmarshalled_old.partition_key.replace('brand#', '');

    if (
      unmarshalled_old.product_group_sort_key !==
      unmarshalled_new.product_group_sort_key
    ) {
      if (unmarshalled_old.product_group_sort_key) {
        await dissociate_product_from_product_group({
          brand_id,
          product_group_sort_key: unmarshalled_old.product_group_sort_key,
          product_sort_key: unmarshalled_new.sort_key,
        });
      }

      if (unmarshalled_new.product_group_sort_key) {
        await associate_product_to_product_group({
          brand_id,
          product_group_sort_key: unmarshalled_new.product_group_sort_key,
          product_sort_key: unmarshalled_new.sort_key,
        });
      }
    }
  } catch (err) {
    console.log('handle_product_modify error: ', err);
  }
};
