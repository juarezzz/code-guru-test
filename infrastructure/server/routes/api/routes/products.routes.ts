const products = [
  {
    path: '/products',
    directory: 'products/POST',
    method: 'POST',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/brand-products',
    directory: 'brand-products/GET',
    method: 'GET',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/brand-products',
    directory: 'brand-products/POST',
    method: 'POST',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/brand-products',
    directory: 'brand-products/PUT',
    method: 'PUT',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/products/search',
    directory: 'products/SEARCH',
    method: 'GET',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/products',
    directory: 'products/DELETE',
    method: 'DELETE',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/products',
    directory: 'products/PUT',
    method: 'PUT',
    module: 'stacks/polytag-brand-resources-stack',
  },
];

export { products };
