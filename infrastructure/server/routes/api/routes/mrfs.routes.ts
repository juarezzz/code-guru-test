const mrfs = [
  {
    path: '/mrfs',
    directory: 'mrfs/GET',
    method: 'GET',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/mrfs',
    directory: 'mrfs/POST',
    method: 'POST',
    module: 'stacks/polytag-brand-resources-stack',
  },

  {
    path: '/mrf-forgot-password',
    directory: 'mrf-forgot-password/GET',
    method: 'GET',
    module: 'stacks/polytag-mrf-resources-stack',
  },
  {
    path: '/mrf-forgot-password',
    directory: 'mrf-forgot-password/PUT',
    method: 'PUT',
    module: 'stacks/polytag-mrf-resources-stack',
  },
];

export { mrfs };
