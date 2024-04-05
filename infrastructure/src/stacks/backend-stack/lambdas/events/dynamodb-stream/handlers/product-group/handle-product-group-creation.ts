/* ---------- External ---------- */
import { StreamRecord } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

/* ---------- Modules ---------- */
import { increase_brand_product_groups_count } from '_modules/brands/functions/update/increase-brand-product-groups-count';

export const handle_product_group_creation = async ({
  item,
}: {
  item: StreamRecord;
}) => {
  try {
    const { NewImage: image } = item;

    if (!image) return;

    const product_group = DynamoDB.Converter.unmarshall(image);

    const { partition_key, sort_key, owner_sub } = product_group;

    const brand_id = partition_key.replace('brand#', '');

    if (!brand_id || !owner_sub || !sort_key) return;

    await increase_brand_product_groups_count({
      brand_id,
      amount: 1,
    });
  } catch (err) {
    console.log('handle_product_group_creation error: ', err);
  }
};
