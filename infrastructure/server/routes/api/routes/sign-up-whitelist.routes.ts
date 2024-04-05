const sign_up_whitelist = [
  {
    path: '/sign-up-whitelist',
    directory: 'sign-up-whitelist/POST',
    method: 'POST',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/sign-up-whitelist',
    directory: 'sign-up-whitelist/GET',
    method: 'GET',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/sign-up-whitelist',
    directory: 'sign-up-whitelist/DELETE',
    method: 'DELETE',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/sign-up-whitelist/list',
    directory: 'sign-up-whitelist/LIST',
    method: 'GET',
    module: 'stacks/polytag-brand-resources-stack',
  },
];

export { sign_up_whitelist };
