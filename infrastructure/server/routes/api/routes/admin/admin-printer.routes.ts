const admin_printer = [
  {
    path: '/admin-printer',
    directory: 'admin-printer/GET',
    method: 'GET',
    module: 'stacks/polytag-admin-resources-stack',
  },
  {
    path: '/admin-printer',
    directory: 'admin-printer/POST',
    method: 'POST',
    module: 'stacks/polytag-admin-resources-stack',
  },
  {
    path: '/admin-printer',
    directory: 'admin-printer/DELETE',
    method: 'DELETE',
    module: 'stacks/polytag-admin-resources-stack',
  },
  {
    path: '/admin-printer-users',
    directory: 'admin-printer-users/GET',
    method: 'GET',
    module: 'stacks/polytag-admin-resources-stack',
  },
  {
    path: '/admin-printer-users',
    directory: 'admin-printer-users/POST',
    method: 'POST',
    module: 'stacks/polytag-admin-resources-stack',
  },
  {
    path: '/admin-printer-users',
    directory: 'admin-printer-users/DELETE',
    method: 'DELETE',
    module: 'stacks/polytag-admin-resources-stack',
  },
];

export { admin_printer };
