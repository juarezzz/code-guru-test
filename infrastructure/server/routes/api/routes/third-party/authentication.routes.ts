const authentication = [
  {
    path: '/third-party-authentication',
    directory: 'third-party-authentication/GET',
    method: 'GET',
    module: 'stacks/polytag-third-party-resources-stack',
  },
  {
    path: '/third-party-authentication',
    directory: 'third-party-authentication/POST',
    method: 'POST',
    module: 'stacks/polytag-third-party-resources-stack',
  },
];

export { authentication };
