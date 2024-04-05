const image_library = [
  {
    path: '/image-library',
    directory: 'image-library/GET',
    method: 'GET',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/image-library/list',
    directory: 'image-library/LIST',
    method: 'GET',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/image-library',
    directory: 'image-library/DELETE',
    method: 'DELETE',
    module: 'stacks/polytag-brand-resources-stack',
  },
];

export { image_library };
