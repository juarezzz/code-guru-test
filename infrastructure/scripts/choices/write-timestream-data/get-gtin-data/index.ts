import { GTIN } from '__scripts/choices/write-timestream-data/@types';

export const get_gtin_data = (gtin_data: GTIN[]) => {
  const index = Math.floor(Math.random() * gtin_data.length);
  const data = gtin_data[index];

  return data;
};
