export type LandingPageComponentType =
  | 'button'
  | 'heading'
  | 'image'
  | 'overall'
  | 'paragraph'
  | 'section'
  | 'video';

interface LandingPageInterface {
  campaigns_count: number;
  components: string;
  created_at: number;
  created_by: string;
  datatype: string;
  global_styles: string;
  landing_page_name: string;
  partition_key: string;
  search: string;
  sort_key: string;
  updated_at: number;
}

export class LandingPage implements LandingPageInterface {
  campaigns_count: number;

  components: string;

  created_at: number;

  created_by: string;

  datatype: string;

  global_styles: string;

  landing_page_name: string;

  partition_key: string;

  search: string;

  sort_key: string;

  updated_at: number;
}
