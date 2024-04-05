import axios from 'axios';
import base64 from 'base-64';

interface RequestToken {
  environment: string;
  username: string;
  password: string;
}

export const request_token = async ({
  environment,
  username,
  password,
}: RequestToken) => {
  let url = '';

  switch (environment) {
    case 'DEV':
      url = 'https://apid.polyt.ag';
      break;
    case 'STG':
      url = 'https://apis.polyt.ag';
      break;
    case 'PROD':
      url = 'https://api.polyt.ag';
      break;
    default:
      break;
  }

  const { data } = await axios.get(`${url}/brand-authentication`, {
    headers: {
      Authorization: `Basic ${base64.encode(`${username}:${password}`)}`,
    },
  });

  const { id_token } = data;

  return { id_token };
};
