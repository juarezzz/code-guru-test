import axios from 'axios';
import { info_log } from '__scripts/utils/logs';

export const confirm_labels = async (
  environment: string,
  gtin: string,
  serials: string[],
  token: string,
) => {
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

  const { data: response_printer_confirm } = await axios.put(
    `${url}/printer`,
    {
      gtin,
      serials,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  console.log(info_log(`Confirmed response:`));
  console.log(response_printer_confirm);
};
