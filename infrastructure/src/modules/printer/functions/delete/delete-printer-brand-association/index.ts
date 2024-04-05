/* ---------- External ---------- */
import { DeleteCommand, DeleteCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { PrinterCustomer } from '_modules/printer/models/printer-customer';

/* ---------- Interfaces ---------- */
interface DeletePrinterBrandAssociationInput {
  brand_id: string;
  printer_id: string;
}

/* ---------- Function ---------- */
const delete_printer_brand_association = async ({
  brand_id,
  printer_id,
}: DeletePrinterBrandAssociationInput) => {
  const params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `printer#${printer_id}`,
      sort_key: `printer-customer#${brand_id}`,
    },
    ReturnValues: 'ALL_OLD',
  };

  const command = new DeleteCommand(params);

  const { Attributes } = await dynamodb_documentclient.send(command);

  return { brand_association: Attributes as PrinterCustomer };
};

/* ---------- Export ---------- */
export { delete_printer_brand_association };
