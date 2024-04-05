import axios from 'axios';
import { DigitalLink } from 'digital-link.js';

export const request_labels = async (environment: string, gtin: string, token: string) => {
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
      size: 1,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const serials: string[] = [];

  response_printer_create.labels.forEach((label: string) => {
    const serial = DigitalLink(label).getKeyQualifier('21');

    if (!serial) return;

    serials.push(serial);
  });

  return {
    to_confirm: {
      gtin,
      serials,
    },
    labels: response_printer_create.labels,
  };
};
