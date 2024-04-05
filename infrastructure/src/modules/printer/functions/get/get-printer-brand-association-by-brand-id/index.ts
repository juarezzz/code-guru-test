/* ---------- External ---------- */
import { GetCommand, GetCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { PrinterCustomer } from '_modules/printer/models/printer-customer';

/* ---------- Interfaces ---------- */
export interface GetPrinterBrandAssociationByBrandIdInput {
  brand_id: string;
  printer_id: string;
}

/* ---------- Function ---------- */
const get_printer_brand_association_by_brand_id = async ({
  brand_id,
  printer_id,
}: GetPrinterBrandAssociationByBrandIdInput) => {
  const params: GetCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `printer#${printer_id}`,
      sort_key: `printer-customer#${brand_id}`,
    },
  };

  const command = new GetCommand(params);

  const { Item } = await dynamodb_documentclient.send(command);

  return {
    brand_assocation: Item as PrinterCustomer | undefined,
  };
};

/* ---------- Export ---------- */
export { get_printer_brand_association_by_brand_id };
