/* ---------- Interfaces ---------- */
interface CapitalCity {
  city: string;
  country: string;
  country_code: string;
}

/* ---------- Constants ---------- */
const capital_cities: CapitalCity[] = [
  { city: 'London', country: 'United Kingdom', country_code: 'GB' },
  { city: 'Washington, D.C.', country: 'United States', country_code: 'US' },
  { city: 'Ottawa', country: 'Canada', country_code: 'CA' },
  { city: 'Camberra', country: 'Australia', country_code: 'AU' },
  { city: 'Berlin', country: 'Germany', country_code: 'DE' },
  { city: 'Paris', country: 'France', country_code: 'FR' },
  { city: 'Rome', country: 'Italy', country_code: 'IT' },
  { city: 'Madrid', country: 'Spain', country_code: 'ES' },
  { city: 'Amsterdam', country: 'Netherlands', country_code: 'NL' },
  { city: 'Brussels', country: 'Belgium', country_code: 'BE' },
  { city: 'Vienna', country: 'Austria', country_code: 'AT' },
  { city: 'Zurich', country: 'Switzerland', country_code: 'CH' },
  { city: 'Stockholm', country: 'Sweden', country_code: 'SE' },
  { city: 'Oslo', country: 'Norway', country_code: 'NO' },
  { city: 'Copenhagen', country: 'Denmark', country_code: 'DK' },
  { city: 'Helsinki', country: 'Finland', country_code: 'FI' },
  { city: 'Dublin', country: 'Ireland', country_code: 'IE' },
  { city: 'Warsaw', country: 'Poland', country_code: 'PL' },
  { city: 'Prague', country: 'Czech Republic', country_code: 'CZ' },
  { city: 'Bratislava', country: 'Slovakia', country_code: 'SK' },
  { city: 'Budapest', country: 'Hungary', country_code: 'HU' },
  { city: 'Vilnius', country: 'Lithuania', country_code: 'LT' },
  { city: 'Riga', country: 'Latvia', country_code: 'LV' },
  { city: 'Tirana', country: 'Albania', country_code: 'AL' },
  { city: 'Brasilia', country: 'Brazil', country_code: 'BR' },
];

/* ---------- Export ---------- */
export { capital_cities };
