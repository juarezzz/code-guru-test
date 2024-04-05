/* ---------- External ---------- */
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { PrinterCustomer } from '_modules/printer/models/printer-customer';

/* ---------- Interfaces ---------- */
interface CreatePrinterBrandAssociationInput {
  brand_id: string;
  printer_id: string;
  brand_name: string;
}

/* ---------- Function ---------- */
const create_printer_brand_association = async ({
  brand_id,
  printer_id,
  brand_name,
}: CreatePrinterBrandAssociationInput) => {
  const brand_association: PrinterCustomer = {
    brand_name,
    datatype: 'printer-customer',
    created_at: new Date().getTime(),
    updated_at: new Date().getTime(),
    partition_key: `printer#${printer_id}`,
    sort_key: `printer-customer#${brand_id}`,
  };

  const params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: brand_association,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return { brand_association };
};

/* ---------- Export ---------- */
export { create_printer_brand_association };
