export const error_messages = {
  // 400
  unauthorized: {
    code: '403',
    message: 'You are not authorized to access this resource.',
  },

  // 500
  'internal-server-error': {
    code: '500',
    message: 'Internal server error. Please, try again.',
  },

  'failed-to-run-state-machine': {
    code: '501',
    message: 'Failed to run state machine. Please, try again.',
  },

  // 600
  'missing-required-body': {
    code: '600',
    message: 'The request is missing required body information.',
  },
  'missing-required-query-string': {
    code: '601',
    message: 'The request is missing required query string parameters.',
  },

  'unauthorized-email-address': {
    code: '605',
    message:
      'The provided email address is not authorized to access polytag. Please, contact polytag support.',
  },

  'missing-access-token': {
    code: '606',
    message: 'Missing access token in the request headers.',
  },

  'invalid-size': {
    code: '607',
    message: 'Invalid number of codes.',
  },

  // 701
  'product-group-does-not-exist': {
    code: '701',
    message: 'The provided product group does not exist.',
  },
  // 702
  'product-group-already-assigned': {
    code: '702',
    message: 'The provided product group is already assigned to a campaign.',
  },
  // 703
  'campaign-does-not-exist': {
    code: '703',
    message: 'The provided campaign does not exist.',
  },
  // 704
  'landing-page-does-not-exist': {
    code: '704',
    message: 'The provided landing page does not exist.',
  },
  'display-page-does-not-exist': {
    code: '705',
    message: 'The provided display page does not exist.',
  },
  'product-does-not-exist': {
    code: '706',
    message: 'The provided product does not exist.',
  },
  'forbidden-endpoint-environment': {
    code: '707',
    message: 'This endpoint cannot be used in this environment',
  },
  'brand-does-not-exist': {
    code: '708',
    message: 'The provided brand does not exist.',
  },
  'forbidden-email-domain': {
    code: '709',
    message: 'A forbidden email domain was provided.',
  },
  'unrecognized-data-format': {
    code: '710',
    message:
      'The requested data format was not recognized or is not supported.',
  },
  'product-group-already-exists': {
    code: '711',
    message: 'This organisation already has a product group with given name.',
  },
  'unsupported-view-type': {
    code: '712',
    message: 'The requested view type is not supported for this metric.',
  },
  'invalid-gtin-array': {
    code: '713',
    message: "The supplied GTIN array isn't valid.",
  },
  'gcp-already-registered': {
    code: '714',
    message: 'The supplied GCP has already been registered by other brand.',
  },
  'duplicate-attributes-id': {
    code: '715',
    message: 'Products cannot have two attributes with the same name or id.',
  },
  'duplicate-components-id': {
    code: '716',
    message: 'Products cannot have two components with the same name or id.',
  },
  'invalid-gtin': {
    code: '717',
    message: "The supplied GTIN isn't valid",
  },
  'invalid-file': {
    code: '718',
    message: 'This file extension is not supported',
  },
  'duplicate-image-name': {
    code: '719',
    message: 'An image with this name already exists',
  },
  'invalid-email': {
    code: '720',
    message: 'Invalid email',
  },
  'already-registered': {
    code: '721',
    message: 'This email address is already linked to an existing account',
  },
  'landing-page-start-equals-end': {
    code: '722',
    message:
      'The landing page start date cannot be greater or equal to the end date.',
  },
  'landing-page-date-overlap': {
    code: '723',
    message: 'The landing pages duration period cannot overlap.',
  },
  'invite-not-received': {
    code: '724',
    message: 'E-mail address did not receive an invitation.',
  },
  'mrf-does-not-exist': {
    code: '725',
    message: 'The provided mrf does not exist.',
  },
  'number-of-labels-over-limit': {
    code: '726',
    message: 'Only a maximum of 50,000 labels can be requested at a time',
  },
  'product-groups-over-limit': {
    code: '727',
    message: 'Product group number exceeds the limit for a single operation',
  },
  'products-over-limit': {
    code: '728',
    message: 'Products number exceeds the limit for a single operation',
  },
  'email-already-invited': {
    code: '729',
    message: 'The email(s) already received an invitation',
  },
  'gtin-already-in-use': {
    code: '730',
    message: 'This GTIN has already been registered in your brand',
  },
  'email-already-in-campaign-event': {
    code: '731',
    message: 'This email was already registered in this event',
  },
  'serial-already-in-campaign-event': {
    code: '732',
    message: 'This serial was already registered in this event',
  },
  'serial-does-not-exist': {
    code: '733',
    message: 'The provided serial is not registered',
  },
  'product-does-not-belong-to-campaign': {
    code: '734',
    message: 'Product is not assigned to this campaign',
  },
  'user-does-not-exist': {
    code: '735',
    message: 'The provided user does not exist.',
  },

  // 3rd party errors reference. Not actually used in code
  '001': {
    code: '001',
    message: 'Missing required query string parameters.',
  },
  '002': {
    code: '002',
    message: 'Missing required body information.',
  },
  '003': {
    code: '003',
    message: 'Third party label not found for provided GTIN and serial.',
  },
  '004': {
    code: '004',
    message:
      'Third party label for provided GTIN and serial is already claimed.',
  },
  '005': {
    code: '005',
    message: 'Third party provider not found.',
  },
  '006': {
    code: '006',
    message:
      'Third party label for provided GTIN and serial is not redeemed yet.',
  },
  '007': {
    code: '007',
    message: 'The operation is not supported.',
  },
};
