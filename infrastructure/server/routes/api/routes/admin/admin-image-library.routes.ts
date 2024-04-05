const admin_image_library = [
  {
    path: '/admin-image-library',
    directory: 'admin-image-library/GET',
    method: 'GET',
    module: 'stacks/polytag-admin-resources-stack',
  },
  {
    path: '/admin-image-library',
    directory: 'admin-image-library/POST',
    method: 'POST',
    module: 'stacks/polytag-admin-resources-stack',
  },
  {
    path: '/admin-image-library',
    directory: 'admin-image-library/DELETE',
    method: 'DELETE',
    module: 'stacks/polytag-admin-resources-stack',
  },
];

export { admin_image_library };
