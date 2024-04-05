/* ---------- External ---------- */
import { Chance } from 'chance';
import { v4 as uuidv4 } from 'uuid';

/* ---------- Utils ---------- */
import { generate_random_int } from '__scripts/utils/generate-random-int';

/* ---------- Types ---------- */
import { User, GTIN } from '__scripts/choices/write-timestream-data/@types';

const chance = new Chance();

export const generate_user = async (gtin_data: GTIN[]) => {
  const gtin_index = generate_random_int(0, gtin_data.length - 1);

  const user: User = {
    initial: {
      city: chance.city(),
      country: chance.country(),
      ip: chance.ip(),
      latitude: chance.latitude().toString(),
      longitude: chance.longitude().toString(),
      measure_name: 'label_measure',
      phone_os: chance.pickone(['ios', 'android']),
      postal_code: chance.zip(),
      time_spent_away: '0',
      time_zone: chance.timezone().text,
      data_type: 'label_scan',
    },
    navigator: {
      campaign_id: gtin_data[gtin_index].campaign_id,
      gtin: gtin_data[gtin_index].gtin,
      hardware_concurrency: chance.integer({ min: 1, max: 8 }).toString(),
      landing_page_id: gtin_data[gtin_index].landing_page_id,
      languages: JSON.stringify(
        chance.pickset(['en', 'fr', 'es', 'de', 'it', 'pt', 'ru'], generate_random_int(1, 7)),
      ),
      max_touch_points: chance.integer({ min: 1, max: 10 }).toString(),
      measure_name: 'label_measure',
      phone_current_language: chance.pickone(['en', 'fr', 'es', 'de', 'it', 'pt', 'ru']),
      product_group_id: gtin_data[gtin_index].product_group_id,
      screen_size: chance.pickone(['400x600', '600x800', '800x1200', '1200x1600']),
      data_type: 'label_scan_navigator',
      time_spent_away: '0',
      user_agent: chance.pickone([
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 10; SM-A415F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 12; SAMSUNG SM-A526B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/18.0 Chrome/99.0.4844.88 Mobile Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/103.0.5060.63 Mobile/15E148 Safari/604.1',
      ]),
    },
    uuid: uuidv4(),
  };

  return user;
};
