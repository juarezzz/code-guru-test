/* ---------- External ---------- */
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Modules ---------- */
import { PrinterUserInvite } from '_modules/users/models/printer-invite';

/* ---------- Types ---------- */
interface CreatePrinterUserInviteInput {
  email: string;
  sub: string;
  printer_id: string;
}

/* ---------- Function ---------- */
const create_printer_user_invite = async ({
  email,
  sub,
  printer_id,
}: CreatePrinterUserInviteInput) => {
  const invite_item: PrinterUserInvite = {
    partition_key: 'admin',
    sort_key: `printer-user-invite#${email}`,
    email,
    datatype: 'printer-user-invite',
    created_by: sub,
    created_at: Date.now(),
    updated_at: Date.now(),
    printer_id,
  };

  const put_params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: invite_item,
  };

  const command = new PutCommand(put_params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { create_printer_user_invite };
