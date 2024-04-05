const third_party_admin = {
  partition_key: 'third-party-admin',
  sort_key: 'policies',
  datatype: 'third-party-policies',
  policy: {
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: [
          'arn:aws:execute-api:*:*:*/*/GET/third-party-labels',
          'arn:aws:execute-api:*:*:*/*/PUT/third-party-labels',
        ],
        SID: 'Third-Party-Labels-API',
      },
    ],
    Version: '2012-10-17',
  },
};

export { third_party_admin };
