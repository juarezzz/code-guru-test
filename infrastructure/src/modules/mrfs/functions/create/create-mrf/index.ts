/* ---------- External ---------- */
import { v4 as uuidv4 } from 'uuid';
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Types ---------- */
import { CreateMrfInput } from '_modules/mrfs/functions/create/create-mrf/@types';

/* ---------- Models ---------- */
import { Mrf } from '_modules/mrfs/models';

const create_mrf = async ({
  mrf_name,
  sub,
  longitude,
  latitude,
  pk,
}: CreateMrfInput) => {
  const mrf: Mrf = {
    datatype: 'mrf',
    created_at: new Date().getTime(),
    created_by: sub,
    mrf_name,
    partition_key: pk || `mrf#${uuidv4()}`,
    sort_key: 'mrf',
    updated_at: new Date().getTime(),
    location: {
      longitude,
      latitude,
    },
  };

  const params: PutCommandInput = {
    Item: mrf,
    TableName: process.env.TABLE_NAME,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return mrf;
};

/* ---------- Export ---------- */
export { create_mrf };
