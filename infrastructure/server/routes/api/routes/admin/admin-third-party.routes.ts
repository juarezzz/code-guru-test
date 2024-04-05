const admin_third_party = [
  {
    path: '/admin-third-party',
    directory: 'admin-third-party/GET',
    method: 'GET',
    module: 'stacks/polytag-admin-resources-stack',
  },
  {
    path: '/admin-third-party',
    directory: 'admin-third-party/POST',
    method: 'POST',
    module: 'stacks/polytag-admin-resources-stack',
  },
  {
    path: '/admin-third-party',
    directory: 'admin-third-party/DELETE',
    method: 'DELETE',
    module: 'stacks/polytag-admin-resources-stack',
  },
  {
    path: '/admin-third-party-users',
    directory: 'admin-third-party-users/GET',
    method: 'GET',
    module: 'stacks/polytag-admin-resources-stack',
  },
  {
    path: '/admin-third-party-users',
    directory: 'admin-third-party-users/DELETE',
    method: 'DELETE',
    module: 'stacks/polytag-admin-resources-stack',
  },
  {
    path: '/admin-third-party-users',
    directory: 'admin-third-party-users/POST',
    method: 'POST',
    module: 'stacks/polytag-admin-resources-stack',
  },
  {
    path: '/admin-third-party-users',
    directory: 'admin-third-party-users/PATCH',
    method: 'PATCH',
    module: 'stacks/polytag-admin-resources-stack',
  },

  {
    path: '/admin-third-party-user-groups',
    directory: 'admin-third-party-user-groups/GET',
    method: 'GET',
    module: 'stacks/polytag-admin-resources-stack',
  },
];

export { admin_third_party };
