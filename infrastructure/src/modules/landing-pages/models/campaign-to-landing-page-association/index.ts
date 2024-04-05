interface CampaignToLandingPageAssociationInterface {
  partition_key: string;
  sort_key: string;
  datatype: string;
  start_date: string;
  timetolive: string;
}

export class CampaignToLandingPageAssociation
  implements CampaignToLandingPageAssociationInterface
{
  partition_key: string;

  sort_key: string;

  datatype: string;

  start_date: string;

  timetolive: string;
}
