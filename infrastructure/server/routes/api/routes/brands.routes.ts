const brands = [
  {
    path: '/brand-brands',
    directory: 'brand-brands/POST',
    method: 'POST',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/brand-brands',
    directory: 'brand-brands/PUT',
    method: 'PUT',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/brand-brands',
    directory: 'brand-brands/DELETE',
    method: 'DELETE',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/brand-brands',
    directory: 'brand-brands/GET',
    method: 'GET',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/brand-brands/list',
    directory: 'brands/LIST',
    method: 'GET',
    module: 'stacks/polytag-brand-resources-stack',
  },
];

export { brands };
