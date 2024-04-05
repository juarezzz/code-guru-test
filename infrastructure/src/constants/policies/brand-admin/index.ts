const brand_admin = {
  partition_key: 'brand-admin',
  sort_key: 'policies',
  datatype: 'brand-policies',
  policy: {
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: ['arn:aws:execute-api:*:*:*/*/*/*'],
        SID: 'API',
      },
    ],
    Version: '2012-10-17',
  },
};

export { brand_admin };
