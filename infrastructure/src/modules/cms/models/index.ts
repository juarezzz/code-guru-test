import { Article } from './article';
import { Website } from './website';

interface CmsWebsiteInterface {
  partition_key: string;
  sort_key: string;
  datatype: 'cms-website';
  articles: Article[];
  website: Website;
  pages: string;
}

export class CmsWebsite implements CmsWebsiteInterface {
  partition_key: string;

  datatype: 'cms-website';

  updated_at: number;

  sort_key: string;

  articles: Article[];

  pages: string;

  website: Website;
}
