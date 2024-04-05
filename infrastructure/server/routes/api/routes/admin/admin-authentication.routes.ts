const admin_authentication = [
  {
    path: '/admin-authentication',
    directory: 'admin-authentication/GET',
    method: 'GET',
    module: 'stacks/polytag-admin-resources-stack',
  },
  {
    path: '/admin-authentication',
    directory: 'admin-authentication/POST',
    method: 'POST',
    module: 'stacks/polytag-admin-resources-stack',
  },

  {
    path: '/admin-verification',
    directory: 'admin-verification/GET',
    method: 'GET',
    module: 'stacks/polytag-admin-resources-stack',
  },
  {
    path: '/admin-verification',
    directory: 'admin-verification/POST',
    method: 'POST',
    module: 'stacks/polytag-admin-resources-stack',
  },
];

export { admin_authentication };
