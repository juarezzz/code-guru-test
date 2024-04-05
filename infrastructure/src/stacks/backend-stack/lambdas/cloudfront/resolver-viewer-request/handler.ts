/* eslint-disable no-var */
/* eslint-disable vars-on-top */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-unused-vars */
function handler(event: { request: any }) {
  var request = event.request;
  var domain = request.headers.host.value;
  var newurl = '';

  if (domain.startsWith('d.')) newurl = 'https://d.polyt.ag';
  else if (domain.startsWith('s.')) newurl = 'https://s.polyt.ag';
  else if (domain.startsWith('p.')) newurl = 'https://p.polyt.ag';
  else if (domain.startsWith('t.')) newurl = 'https://t.polyt.ag';
  else newurl = 'https://polyt.ag';

  var uri = request.uri;
  var response = {};

  if (uri === '/' || !uri || uri === '/favicon.ico') {
    response = {
      statusCode: 302,
      statusDescription: 'Not found.',
      headers: { location: { value: ''.concat(newurl, '/not-found') } },
    };
    return response;
  }

  response = {
    statusCode: 302,
    statusDescription: 'Redirected!',
    headers: { location: { value: ''.concat(newurl, '/d').concat(uri) } },
  };

  return response;
}
