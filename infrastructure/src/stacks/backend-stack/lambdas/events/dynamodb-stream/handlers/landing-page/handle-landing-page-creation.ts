/* ---------- External ---------- */
import { StreamRecord } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

/* ---------- Modules ---------- */
import { increase_brand_landing_pages_count } from '_modules/brands/functions/update/increase-brand-landing-pages-count';

export const handle_landing_page_creation = async ({
  item,
}: {
  item: StreamRecord;
}) => {
  try {
    const { NewImage } = item;

    if (!NewImage) return;

    const landing_page = DynamoDB.Converter.unmarshall(NewImage);

    const { partition_key, sort_key } = landing_page;

    const brand_id = partition_key.replace('brand#', '');

    if (!brand_id || !sort_key) return;

    await increase_brand_landing_pages_count({
      brand_id,
      amount: 1,
    });
  } catch (err) {
    console.log('handle_landing_page_creation error: ', err);
  }
};
