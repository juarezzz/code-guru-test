/* ---------- Models ---------- */
import { DisplayPage } from '_modules/display-page/models';

/* ---------- Interfaces ---------- */
interface Coordinate {
  latitude: string;
  longitude: string;
}

export interface GenerateRandomUserInput {
  product_details: DisplayPage;
}

export interface LocationData {
  country: string;
  city: string;
  region: string;
  ip_list: string[];
  postal_codes: string[];
  coordinates: Coordinate[];
}

export interface LocationInterface {
  country: string;
  city: string;
  region: string;
  ip: string;
  postal_code: string;
  latitude: string;
  longitude: string;
}

export interface NavigatorData {
  app_version: string;
  navigator: string;
  platform: string;
  vendor: string;
  product: string;
  device_languages: string[];
  app_name: string;
  user_agent: string;
  product_sub: string;
  resolutions: string[];
}

export interface NavigatorInterface {
  app_version: string;
  navigator: string;
  platform: string;
  vendor: string;
  product: string;
  languages: string[];
  language: string;
  app_name: string;
  user_agent: string;
  product_sub: string;
  resolution: string;
}

export interface User {
  uuid: string;

  initial: {
    city: string;
    country: string;
    ip: string;
    latitude: string;
    longitude: string;
    postal_code: string;
    data_type: string;
    time_zone: string;
    time_spent_away: string;
    measure_name: string;
    phone_os: string;
  };

  navigator: {
    data_type: string;
    phone_current_language: string;
    languages: string;
    user_agent: string;
    screen_size: string;
    measure_name: string;
    hardware_concurrency: string;
    max_touch_points: string;
    time_spent_away: string;

    gtin: string;
    campaign_id: string;
    landing_page_id: string;
    product_group_id: string;
  };
}
