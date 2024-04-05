/* ---------- External ---------- */
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface CreatePrinterCustomerInput {
  partition_key: string;
  brand_name: string;
  sort_key: string;
}

const create_printer_customer = async ({
  brand_name,
  sort_key,
  partition_key,
}: CreatePrinterCustomerInput) => {
  const printer_customer = {
    partition_key,
    sort_key,
    brand_name,
    created_at: new Date().getTime(),
    datatype: 'printer-customer',
    updated_at: new Date().getTime(),
  };

  const printer_customer_params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: printer_customer,
  };

  const printer_customer_command = new PutCommand(printer_customer_params);

  await dynamodb_documentclient.send(printer_customer_command);
};

export { create_printer_customer };
