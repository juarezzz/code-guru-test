const brand_analyst = {
  partition_key: 'brand-analyst',
  sort_key: 'policies',
  datatype: 'brand-policies',
  policy: {
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: [
          'arn:aws:execute-api:*:*:*/*/GET/products',
          'arn:aws:execute-api:*:*:*/*/GET/products/list',
          'arn:aws:execute-api:*:*:*/*/GET/products/search',
        ],
        SID: 'Products-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: [
          'arn:aws:execute-api:*:*:*/*/GET/campaigns',
          'arn:aws:execute-api:*:*:*/*/GET/campaigns/list',
        ],
        SID: 'Campaigns-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: ['arn:aws:execute-api:*:*:*/*/GET/brands'],
        SID: 'Brands-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: [
          'arn:aws:execute-api:*:*:*/*/GET/users',
          'arn:aws:execute-api:*:*:*/*/PUT/users',
        ],
        SID: 'Users-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: ['arn:aws:execute-api:*:*:*/*/GET/gs1-checker'],
        SID: 'GS1-Checker-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: [
          'arn:aws:execute-api:*:*:*/*/GET/landing-pages',
          'arn:aws:execute-api:*:*:*/*/GET/landing-pages/list',
          'arn:aws:execute-api:*:*:*/*/GET/landing-pages/search',
        ],
        SID: 'Landing-Pages-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: [
          'arn:aws:execute-api:*:*:*/*/GET/product-groups',
          'arn:aws:execute-api:*:*:*/*/GET/product-groups/list',
          'arn:aws:execute-api:*:*:*/*/GET/product-groups/search',
        ],
        SID: 'Product-Groups-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: [
          'arn:aws:execute-api:*:*:*/*/GET/image-library',
          'arn:aws:execute-api:*:*:*/*/GET/image-library/list',
        ],
        SID: 'Image-Library-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: ['arn:aws:execute-api:*:*:*/*/GET/domain-whitelist/list'],
        SID: 'Domain-Whitelist-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: ['arn:aws:execute-api:*:*:*/*/PUT/user-attributes'],
        SID: 'User-Attributes-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: ['arn:aws:execute-api:*:*:*/*/GET/landing-page-templates'],
        SID: 'Landing-Page-Templates-API',
      },
    ],
    Version: '2012-10-17',
  },
};

export { brand_analyst };
