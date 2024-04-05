/* ---------- Functions ---------- */
import { create_product_group } from '_modules/product-groups/functions/create/create-product-group';
import { get_product_group_by_name } from '_modules/product-groups/functions/get/get-product-group-by-name';
import { get_product_group_by_sort_key } from '_modules/product-groups/functions/get/get-product-group-by-sort-key';
import { get_all_product_groups } from '_modules/product-groups/functions/get/get-all-product-groups';
import { delete_product_group } from '_modules/product-groups/functions/delete/delete-product-group';
import { get_all_product_groups_by_name } from '_modules/product-groups/functions/get/get-all-product-groups-by-name';
import { deassign_product_group_from_campaign } from '_modules/product-groups/functions/assign/deassign-product-group-from-campaign';
import { increment_products_count } from '_modules/product-groups/functions/increment/increment-products-count';
import { update_product_group_fields } from '_modules/product-groups/functions/update/update-product-group-fields';

/* ---------- Functions Blocks ---------- */
const assign = {
  deassign_product_group_from_campaign,
};

const create = {
  create_product_group,
};

const delete_functions = {
  delete_product_group,
};

const get = {
  get_all_product_groups,
  get_product_group_by_name,
  get_product_group_by_sort_key,
  get_all_product_groups_by_name,
};

const update = {
  update_product_group_fields,
};

const increment = {
  increment_products_count,
};

/* ---------- Module export ---------- */
export const functions = {
  assign,
  create,
  delete: delete_functions,
  get,
  update,
  increment,
};
