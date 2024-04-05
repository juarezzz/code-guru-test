/* ---------- External ---------- */
import { Chance } from 'chance';
import { v4 as uuidV4 } from 'uuid';

/* ---------- Dummy Data ---------- */
import { locations } from '_helpers/analytics/generate-random-user/dummy-data/locations';
import { navigators } from '_helpers/analytics/generate-random-user/dummy-data/navigators';

/* ---------- Types ---------- */
import {
  User,
  LocationInterface,
  NavigatorInterface,
  GenerateRandomUserInput,
} from '_helpers/analytics/generate-random-user/@types';

/* ---------- Functions ---------- */
const get_random_location = (): LocationInterface => {
  /* ----------
   * Picks a random location from the dummy data
   * and randomizes some values from it
   * ---------- */

  const chance = new Chance();

  const location = chance.pickone(locations);
  const ip = chance.pickone(location.ip_list);
  const postal_code = chance.pickone(location.postal_codes);
  const { latitude, longitude } = chance.pickone(location.coordinates);

  return {
    ip,
    latitude,
    longitude,
    postal_code,
    city: location.city,
    region: location.region,
    country: location.country,
  };
};

const get_random_navigator = (): NavigatorInterface => {
  /* ----------
   * Picks a random navigator from the dummy data
   * and randomizes the screen resolution
   * ---------- */

  const chance = new Chance();

  const navigator = chance.pickone(navigators);
  const resolution = chance.pickone(navigator.resolutions);

  return {
    resolution,
    vendor: navigator.vendor,
    product: navigator.product,
    platform: navigator.platform,
    app_name: navigator.app_name,
    navigator: navigator.navigator,
    user_agent: navigator.user_agent,
    product_sub: navigator.product_sub,
    app_version: navigator.app_version,
    languages: navigator.device_languages,
    language: navigator.device_languages[0],
  };
};

export const generate_random_user = ({
  product_details,
}: GenerateRandomUserInput): User => {
  const chance = new Chance();

  /* ----------
   * Generates random user data from
   * the dummt data values and product info
   * ---------- */

  const uuid = uuidV4();
  const location = get_random_location();
  const navigator = get_random_navigator();
  const operating_system = navigator.vendor.toLowerCase().includes('apple')
    ? 'ios'
    : 'android';

  return {
    uuid,

    initial: {
      ip: location.ip,
      city: location.city,
      time_spent_away: '0',
      data_type: 'label_scan',
      country: location.country,
      time_zone: 'Europe/London',
      phone_os: operating_system,
      latitude: location.latitude,
      longitude: location.longitude,
      measure_name: 'label_measure',
      postal_code: location.postal_code,
    },

    navigator: {
      time_spent_away: '0',
      measure_name: 'label_measure',
      gtin: product_details.product_id,
      user_agent: navigator.user_agent,
      screen_size: navigator.resolution,
      data_type: 'label_scan_navigator',
      campaign_id: product_details.campaign_id,
      phone_current_language: navigator.language,
      languages: JSON.stringify(navigator.languages),
      landing_page_id: product_details.landing_page_id,
      product_group_id: product_details.product_group_id,
      max_touch_points: chance.integer({ min: 1, max: 10 }).toString(),
      hardware_concurrency: chance.integer({ min: 1, max: 8 }).toString(),
    },
  };
};
