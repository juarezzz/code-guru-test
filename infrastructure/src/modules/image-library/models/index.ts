interface ImageInterface {
  created_at: number;
  created_by: string;
  datatype: string;
  partition_key: string;
  search: string;
  size: number;
  sort_key: string;
  url: string;
}

export class Image implements ImageInterface {
  created_at: number;

  created_by: string;

  datatype: string;

  partition_key: string;

  search: string;

  size: number;

  sort_key: string;

  url: string;
}
