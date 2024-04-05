const admin_mrf_users = [
  {
    path: '/admin-mrf-users',
    directory: 'admin-mrf-users/GET',
    method: 'GET',
    module: 'stacks/polytag-admin-resources-stack',
  },
  {
    path: '/admin-mrf-users',
    directory: 'admin-mrf-users/POST',
    method: 'POST',
    module: 'stacks/polytag-admin-resources-stack',
  },
  {
    path: '/admin-mrf-users',
    directory: 'admin-mrf-users/DELETE',
    method: 'DELETE',
    module: 'stacks/polytag-admin-resources-stack',
  },
];

export { admin_mrf_users };
