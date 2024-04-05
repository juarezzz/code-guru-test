const brand_editor = {
  partition_key: 'brand-editor',
  sort_key: 'policies',
  datatype: 'brand-policies',
  policy: {
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: [
          'arn:aws:execute-api:*:*:*/*/GET/products',
          'arn:aws:execute-api:*:*:*/*/POST/products',
          'arn:aws:execute-api:*:*:*/*/PUT/products',
          'arn:aws:execute-api:*:*:*/*/DELETE/products',
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
          'arn:aws:execute-api:*:*:*/*/POST/campaigns',
          'arn:aws:execute-api:*:*:*/*/PUT/campaigns',
          'arn:aws:execute-api:*:*:*/*/DELETE/campaigns',
        ],
        SID: 'Campaigns-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: [
          'arn:aws:execute-api:*:*:*/*/GET/brands',
          'arn:aws:execute-api:*:*:*/*/POST/brands',
          'arn:aws:execute-api:*:*:*/*/PUT/brands',
          'arn:aws:execute-api:*:*:*/*/DELETE/brands',
        ],
        SID: 'Brands-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: ['arn:aws:execute-api:*:*:*/*/POST/mrfs'],
        SID: 'Mrfs-API',
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
          'arn:aws:execute-api:*:*:*/*/POST/landing-pages',
          'arn:aws:execute-api:*:*:*/*/PUT/landing-pages',
          'arn:aws:execute-api:*:*:*/*/DELETE/landing-pages',
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
          'arn:aws:execute-api:*:*:*/*/POST/product-groups',
          'arn:aws:execute-api:*:*:*/*/DELETE/product-groups',
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
          'arn:aws:execute-api:*:*:*/*/DELETE/image-library',
          'arn:aws:execute-api:*:*:*/*/GET/image-library/list',
        ],
        SID: 'Image-Library-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: ['arn:aws:execute-api:*:*:*/*/GET/domain-whitelist'],
        SID: 'Domain-Whitelist-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: ['arn:aws:execute-api:*:*:*/*/POST/invite'],
        SID: 'Invite-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: ['arn:aws:execute-api:*:*:*/*/POST/batch-upload'],
        SID: 'Batch-Upload-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: [
          'arn:aws:execute-api:*:*:*/*/POST/printer',
          'arn:aws:execute-api:*:*:*/*/PUT/printer',
        ],
        SID: 'Printer-API',
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

export { brand_editor };
