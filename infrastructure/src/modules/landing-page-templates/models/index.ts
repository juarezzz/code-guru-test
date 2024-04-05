/* ---------- Interfaces ---------- */
export interface LandingPageTemplateInterface {
  partition_key: string;
  sort_key: string;
  datatype: string;

  created_by: string;
  created_at: number;
  updated_at: number;

  landing_page_template_name: string;
  components: string;
  global_styles: string;
}

export class LandingPageTemplate implements LandingPageTemplateInterface {
  components: string;

  created_at: number;

  created_by: string;

  datatype: string;

  global_styles: string;

  landing_page_template_name: string;

  partition_key: string;

  sort_key: string;

  updated_at: number;
}
