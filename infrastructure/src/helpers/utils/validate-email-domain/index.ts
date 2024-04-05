/* ---------- Helpers ---------- */
import { binary_search } from '_helpers/utils/binary-search';

/* ---------- Constants ---------- */
import free_email_domains from '_constants/blacklisted-domains/free-email-providers.json';
import competitors_list from '_constants/blacklisted-domains/competitors.json';

const validate_email_domain = (domain: string): boolean => {
  const is_free_domain = binary_search(free_email_domains, domain);

  const is_competitor_email = competitors_list.some(d => domain.includes(d));

  return is_free_domain || is_competitor_email;
};

export { validate_email_domain };
