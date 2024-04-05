/* ----------- Helpers ----------- */
import { remove_leading_zeros } from '_helpers/utils/remove_leading_zeros';

/* ---------- Interfaces ---------- */
interface CheckIfGCPContainsGtinInput {
  gcp: string;
  gtin: string;
}

/* ---------- Functions ---------- */
export const check_if_gcp_contains_gtin = ({
  gcp,
  gtin,
}: CheckIfGCPContainsGtinInput): boolean => {
  if (gtin.length === 14) {
    const sliced = gtin.slice(1);

    return sliced.startsWith(gcp);
  }

  return remove_leading_zeros(gtin).startsWith(remove_leading_zeros(gcp));
};
