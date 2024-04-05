export type SelectPrompt = {
  value: string;
};

export type NumberPrompt = {
  value: number;
};

export type StringPrompt = {
  value: string;
};

export interface User {
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
    gtin: string;
    hardware_concurrency: string;
    max_touch_points: string;
    time_spent_away: string;

    campaign_id: string;
    landing_page_id: string;
    product_group_id: string;
  };

  uuid: string;
}

export interface Report {
  users: number;
  labels: {
    total: number;
    scanned: number;
    not_scanned: number;
  };
  start_date: string;
  end_date: string;
}

export interface GTIN {
  campaign_id: string;
  landing_page_id: string;
  product_group_id: string;
  gtin: string;
}

export interface PingData {
  type: string;
  measure_name: string;
  time: string;
  'measure_value::varchar': string;
}
