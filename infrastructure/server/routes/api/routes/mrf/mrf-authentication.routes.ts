const mrf_authentication = [
  {
    path: '/mrf-authentication',
    directory: 'mrf-authentication/GET',
    method: 'GET',
    module: 'stacks/polytag-mrf-resources-stack',
  },
  {
    path: '/mrf-authentication',
    directory: 'mrf-authentication/POST',
    method: 'POST',
    module: 'stacks/polytag-mrf-resources-stack',
  },
];

export { mrf_authentication };
