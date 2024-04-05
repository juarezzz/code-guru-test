/* ---------- External ---------- */
import * as Yup from 'yup';

/* ---------- Constants ---------- */
const ALLOWED_EMAIL_DOMAINS = ['polytag.co.uk', 'polytag.io', 'westpoint.io'];

/* ---------- Shapes ---------- */
const contact_form_field_schema = Yup.object({
  value: Yup.string().when('required', {
    is: true,
    then: Yup.string().required('Missing field value.'),
    otherwise: Yup.string().optional(),
  }),

  type: Yup.string()
    .optional()
    .oneOf(['text', 'tel', 'email', 'textarea'], 'Invalid field type'),

  placheolder: Yup.string().optional(),

  label: Yup.string().required('Missing label value.'),

  required: Yup.boolean().optional().default(false),
});

export const contact_form_schema = Yup.object({
  persona: Yup.string()
    .required('persona is a required field.')
    .min(1)
    .max(255),

  slack_channel_id: Yup.string()
    .required('Missing slack_channel_id.')
    .min(1)
    .max(255),

  receivers: Yup.array()
    .default([])
    .min(1, 'At least one receiver must be configured')
    .max(25, 'Receivers count cannot exceed 25')
    .of(
      Yup.string()
        .required('Missing receiver email address.')
        .email('Invalid email address.')
        .matches(
          new RegExp(`(.*)(@)(${ALLOWED_EMAIL_DOMAINS.join('|')})$`),
          'Forbidden email domain',
        ),
    ),

  fields: Yup.array()
    .default([])
    .max(50, "fields section can't exceed 50")
    .of(contact_form_field_schema),
});
