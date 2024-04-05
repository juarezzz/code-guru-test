/* ---------- External ---------- */
import { DigitalLink } from 'digital-link.js';

/* ---------- JSONs ---------- */
import { context } from '__cdk.json';

/* ---------- Types ---------- */
import { ValidateGTINInput } from '_helpers/utils/validate-gtin/@types';

/* ---------- Helpers ---------- */
import { unique_serial } from '_helpers/utils/unique-serial';

export const validate_gtin = ({ environment, gtin }: ValidateGTINInput) => {
  const domain = context[environment]?.redirect_url;

  if (!domain) return false;

  try {
    const link = DigitalLink({
      domain,
      identifier: {
        '01': gtin,
      },
      keyQualifiers: {
        '21': unique_serial(),
      },
    });

    link.toWebUriString();
  } catch (err) {
    return false;
  }

  return true;
};
