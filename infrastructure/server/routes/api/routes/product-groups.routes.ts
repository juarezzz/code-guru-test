const product_groups = [
  {
    path: '/brand-product-groups/search',
    directory: 'brand-product-groups/SEARCH',
    method: 'GET',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/brand-product-groups',
    directory: 'brand-product-groups/GET',
    method: 'GET',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/brand-product-groups',
    directory: 'brand-product-groups/POST',
    method: 'POST',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/brand-product-groups',
    directory: 'brand-product-groups/PUT',
    method: 'PUT',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/brand-product-groups',
    directory: 'brand-product-groups/DELETE',
    method: 'DELETE',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/brand-product-groups/list',
    directory: 'brand-product-groups/LIST',
    method: 'GET',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/brand-products',
    directory: 'brand-products/POST',
    method: 'POST',
    module: 'stacks/polytag-brand-resources-stack',
  },
];

export { product_groups };
