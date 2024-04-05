import { CloudFrontRequestEvent, Context, Callback } from 'aws-lambda';

export const handler = async (
  event: CloudFrontRequestEvent,
  _: Context,
  callback: Callback,
) => {
  const { request } = event.Records[0].cf;

  if (request.method !== 'GET') {
    const response = {
      status: '405',
      statusDescription: 'Method Not Allowed',
      headers: {
        'cache-control': [
          {
            key: 'Cache-Control',
            value: 'max-age=1',
          },
        ],
        'content-type': [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
        'access-control-allow-origin': [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      body: JSON.stringify({}),
    };

    return callback(null, response);
  }

  const { clientIp, headers } = request;

  const ip = clientIp;

  const {
    'cloudfront-is-ios-viewer': ios_viewer,
    'cloudfront-is-android-viewer': android_viewer,
    'cloudfront-viewer-country-name': country_name,
    'cloudfront-viewer-country-region-name': country_region_name,
    'cloudfront-viewer-latitude': latitude,
    'cloudfront-viewer-longitude': longitude,
    'cloudfront-viewer-city': city,
    'cloudfront-viewer-time-zone': timezone,
    'cloudfront-viewer-postal-code': postal_code,
  } = headers;

  const data = {
    ip,
    ios_viewer: ios_viewer?.[0]?.value,
    android_viewer: android_viewer?.[0]?.value,
    country_name: country_name?.[0]?.value,
    country_region_name: country_region_name?.[0]?.value,
    latitude: latitude?.[0]?.value,
    longitude: longitude?.[0]?.value,
    city: city?.[0]?.value,
    timezone: timezone?.[0]?.value,
    postal_code: postal_code?.[0]?.value,
  };

  const response = {
    status: '200',
    statusDescription: 'OK',
    headers: {
      'cache-control': [
        {
          key: 'Cache-Control',
          value: 'max-age=1',
        },
      ],
      'content-type': [
        {
          key: 'Content-Type',
          value: 'application/json',
        },
      ],
      'access-control-allow-origin': [
        {
          key: 'Access-Control-Allow-Origin',
          value: '*',
        },
      ],
    },
    body: JSON.stringify({
      ...data,
    }),
  };

  return callback(null, response);
};
