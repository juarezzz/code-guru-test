/* ---------- External ---------- */
interface ContactFormFieldInterface {
  value: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: 'text' | 'tel' | 'email' | 'textarea';
}

export class ContactFormField implements ContactFormFieldInterface {
  value: string;

  label: string;

  required?: boolean;

  placeholder?: string;

  type?: 'text' | 'tel' | 'email' | 'textarea';
}
