/* ---------- Interfaces ---------- */
interface ProductToGroupAssociationInterface {
  partition_key: string;
  sort_key: string;
  datatype: string;
}

export class ProductToGroupAssociation
  implements ProductToGroupAssociationInterface
{
  partition_key: string;

  sort_key: string;

  datatype: string;
}
