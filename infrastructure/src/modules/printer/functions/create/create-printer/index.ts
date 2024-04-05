/* ---------- External ---------- */
import { v4 as uuidv4 } from 'uuid';
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Printer } from '_modules/printer/models';

/* ---------- Interfaces ---------- */
interface CreatePrinter {
  printer_name: string;
  sub: string;
  partition_key?: string;
}

const create_printer = async ({
  printer_name,
  sub,
  partition_key,
}: CreatePrinter) => {
  const printer: Printer = {
    created_at: new Date().getTime(),
    created_by: sub,
    datatype: 'printer',
    partition_key: partition_key || `printer#${uuidv4()}`,
    printer_name,
    search: `printer-name#${printer_name
      .replace(/\s/g, '_')
      .toLocaleLowerCase()}`,
    sort_key: 'printer',
    updated_at: new Date().getTime(),
  };

  const params: PutCommandInput = {
    Item: printer,
    TableName: process.env.TABLE_NAME,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return { printer };
};

/* ---------- Export ---------- */
export { create_printer };
