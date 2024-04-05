const printer = [
  {
    path: '/printer',
    directory: 'printer/POST',
    method: 'POST',
    module: 'stacks/polytag-brand-resources-stack',
  },
  {
    path: '/printer',
    directory: 'printer/PUT',
    method: 'PUT',
    module: 'stacks/polytag-brand-resources-stack',
  },

  {
    path: '/printer-authentication',
    directory: 'printer-authentication/GET',
    method: 'GET',
    module: 'stacks/polytag-printer-resources-stack',
  },

  {
    path: '/printer-authentication',
    directory: 'printer-authentication/POST',
    method: 'POST',
    module: 'stacks/polytag-printer-resources-stack',
  },

  {
    path: '/printer-verification',
    directory: 'printer-verification/GET',
    method: 'GET',
    module: 'stacks/polytag-printer-resources-stack',
  },
  {
    path: '/printer-verification',
    directory: 'printer-verification/POST',
    method: 'POST',
    module: 'stacks/polytag-printer-resources-stack',
  },

  {
    path: '/printer-forgot-password',
    directory: 'printer-forgot-password/GET',
    method: 'GET',
    module: 'stacks/polytag-printer-resources-stack',
  },
  {
    path: '/printer-forgot-password',
    directory: 'printer-forgot-password/PUT',
    method: 'PUT',
    module: 'stacks/polytag-printer-resources-stack',
  },

  {
    path: '/printer-customers',
    directory: 'printer-customers/GET',
    method: 'GET',
    module: 'stacks/polytag-printer-resources-stack',
  },

  {
    path: '/printer-customer-products',
    directory: 'printer-customer-products/GET',
    method: 'GET',
    module: 'stacks/polytag-printer-resources-stack',
  },

  {
    path: '/printer-serialised-codes',
    directory: 'printer-serialised-codes/POST',
    method: 'POST',
    module: 'stacks/polytag-printer-resources-stack',
  },
];

export { printer };
