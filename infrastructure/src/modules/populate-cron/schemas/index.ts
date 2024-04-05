/* ---------- External ---------- */
import * as Yup from 'yup';
import Lazy from 'yup/lib/Lazy';
import { Utils } from 'digital-link.js';

/* ---------- Constants ---------- */
const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

const monthly_cron_param_setting = Yup.array(Yup.number().min(0).max(100000))
  .min(2)
  .max(2)
  .required();

const gtin_entry_validation = Yup.lazy(entry => {
  if (!entry) return Yup.object().optional().default({});

  const gtin_rule = Utils.Rules.gtin;

  const validations = Object.keys(entry).reduce((validation_obj, key) => {
    if (!Utils.testRule(gtin_rule, key))
      throw new Error(`'${key}' is not a valid GTIN`);

    validation_obj[key] = Yup.object({
      qr_prints_range: monthly_cron_param_setting,
      qr_scans_range: monthly_cron_param_setting,
      uv_scans_range: monthly_cron_param_setting,
    });

    return validation_obj;
  }, {} as { [key: string]: Yup.AnyObjectSchema });

  return Yup.object(validations).optional().default({});
});

const monthly_entry_validation = Yup.lazy(entry => {
  if (!entry) return Yup.object().optional().default({});

  const validations = Object.keys(entry).reduce((validation_obj, key) => {
    if (!MONTH_NAMES.includes(key)) {
      throw new Error(
        `Invalid key '${key}' in property monthly_values. Only valid, lowercase month names are accepted.`,
      );
    }

    validation_obj[key] = gtin_entry_validation;

    return validation_obj;
  }, {} as { [key: string]: Lazy<Yup.AnyObjectSchema> });

  return Yup.object(validations).optional().default({});
});

export const update_populate_cron_settings = Yup.object({
  enabled: Yup.boolean().optional().default(true),
  monthly_values: monthly_entry_validation,
  mrf_id: Yup.string().required('A mrf id must be provided'),
});

export const schemas = {
  update_populate_cron_settings,
};
