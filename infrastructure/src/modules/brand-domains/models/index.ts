/* ---------- External ---------- */
interface BrandDomainInterface {
  created_at: number;
  domain: string;
  datatype: string;
  partition_key: string;
  sort_key: string;
  status: string;
}

export class BrandDomain implements BrandDomainInterface {
  created_at: number;

  domain: string;

  datatype: string;

  partition_key: string;

  sort_key: string;

  status: string;
}
