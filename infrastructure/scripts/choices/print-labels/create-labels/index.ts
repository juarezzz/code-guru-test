import axios from 'axios';
import { DigitalLink } from 'digital-link.js';

interface CreateLabels {
  environment: string;
  gtin: string;
  token: string;
  size: number;
}

export const create_labels = async ({ environment, gtin, size, token }: CreateLabels) => {
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

  const { data: response_printer_create } = await axios.post(
    `${url}/printer`,
    {
      gtin,
      size,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const serials: string[] = [];

  response_printer_create.labels.forEach((label: string) => {
    console.log(label);

    const serial = DigitalLink(label).getKeyQualifier('21');

    if (!serial) return;

    serials.push(serial);
  });

  return {
    serials,
  };
};
