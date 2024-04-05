const admin_users = [
  {
    path: '/admin-users',
    directory: 'admin-users/GET',
    method: 'GET',
    module: 'stacks/polytag-admin-resources-stack',
  },

  {
    path: '/admin-users',
    directory: 'admin-users/PATCH',
    method: 'PATCH',
    module: 'stacks/polytag-admin-resources-stack',
  },

  {
    path: '/admin-users',
    directory: 'admin-users/DELETE',
    method: 'DELETE',
    module: 'stacks/polytag-admin-resources-stack',
  },

  {
    path: '/admin-users',
    directory: 'admin-users/PUT',
    method: 'PUT',
    module: 'stacks/polytag-admin-resources-stack',
  },
];

export { admin_users };
