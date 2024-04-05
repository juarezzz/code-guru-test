const polytag_super_admin = {
  partition_key: 'polytag-super-admin',
  sort_key: 'policies',
  datatype: 'admin-policies',
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

export { polytag_super_admin };
