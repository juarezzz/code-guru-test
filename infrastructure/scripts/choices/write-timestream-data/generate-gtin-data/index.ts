/* ---------- External ---------- */
import { v4 as uuidv4 } from 'uuid';

/* ---------- Types ---------- */
import { GTIN } from '__scripts/choices/write-timestream-data/@types';

export const generate_gtin_data = async (gtin: string) => {
  const campaign_id = uuidv4();
  const landing_page_id = uuidv4();
  const product_group_id = uuidv4();

  const gtin_data: GTIN = {
    campaign_id,
    landing_page_id,
    product_group_id,
    gtin,
  };

  return gtin_data;
};
