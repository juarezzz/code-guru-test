import { CloudFrontRequestEvent } from 'aws-lambda';

export const handler = async (event: CloudFrontRequestEvent) => {
  const { request } = event.Records[0].cf;

  if (!request.body) return request;

  const body_data = request.body.data;

  const encoded_data = Buffer.from(body_data, 'base64')
    .toString('utf-8')
    .split('data=')[1];

  const parsed_body = JSON.parse(
    Buffer.from(encoded_data, 'base64')
      .toString('utf-8')
      .replace(/[\r\n].*/s, ''),
  );

  const updated_event = {
    ...parsed_body,
    properties: { ...parsed_body.properties, ip: request.clientIp },
  };

  const new_data = Buffer.from(JSON.stringify(updated_event), 'utf-8').toString(
    'base64',
  );

  const new_body = Buffer.from(`data=${new_data}`, 'utf-8').toString('base64');

  const updated_request = {
    ...request,
    body: { ...request.body, action: 'replace', data: new_body },
  };

  return updated_request;
};
