import { capital_cities } from '_constants/capital-cities';

/* ---------- Interfaces ---------- */
interface FindCountryCityInput {
  country?: string;
  country_code?: string;
}

interface FindCountryCityOutput {
  city?: string;
}

/* ---------- Function ---------- */
const find_country_city = ({
  country,
  country_code,
}: FindCountryCityInput): FindCountryCityOutput => {
  if (!country && !country_code) return { city: undefined };

  const matching_location = capital_cities.find(
    location =>
      location.country_code.toLowerCase() === country_code?.toLowerCase() ||
      location.country.toLowerCase() === country?.toLocaleLowerCase(),
  );

  return { city: matching_location?.city };
};

/* ---------- Export ---------- */
export { find_country_city };
