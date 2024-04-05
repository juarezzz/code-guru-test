/* ---------- External ---------- */
interface StatementProps {
  Action: string;
  Effect: string;
  Resource: string[];
  SID: string;
}

interface PolicyProps {
  Statement: StatementProps[];
  Version: string;
}

interface PolicyInterface {
  partition_key: string;
  sort_key: string;
  datatype: string;
  policy: PolicyProps;
}

export class Policy implements PolicyInterface {
  partition_key: string;

  sort_key: string;

  datatype: string;

  policy: PolicyProps;
}
