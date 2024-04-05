const polytag_admin = {
  partition_key: 'polytag-admin',
  sort_key: 'policies',
  datatype: 'admin-policies',
  policy: {
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: ['arn:aws:execute-api:*:*:*/*/POST/admin-invite'],
        SID: 'Admin-Invite-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: ['arn:aws:execute-api:*:*:*/*/GET/admin-clients'],
        SID: 'Admin-Clients-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: ['arn:aws:execute-api:*:*:*/*/GET/admin-clients-status'],
        SID: 'Admin-Clients-Status-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: [
          'arn:aws:execute-api:*:*:*/*/GET/admin-users',
          'arn:aws:execute-api:*:*:*/*/DELETE/admin-users',
          'arn:aws:execute-api:*:*:*/*/PATCH/admin-users',
        ],
        SID: 'Admin-Users-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: [
          'arn:aws:execute-api:*:*:*/*/POST/admin-brands',
          'arn:aws:execute-api:*:*:*/*/DELETE/admin-brands',
        ],
        SID: 'Admin-Brands-API',
      },
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: [
          'arn:aws:execute-api:*:*:*/*/POST/admin-landing-page-templates',
          'arn:aws:execute-api:*:*:*/*/GET/admin-landing-page-templates',
          'arn:aws:execute-api:*:*:*/*/PUT/admin-landing-page-templates',
        ],
        SID: 'Admin-Landing-Page-Templates-API',
      },
    ],
    Version: '2012-10-17',
  },
};

export { polytag_admin };
