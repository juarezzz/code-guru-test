/* -------------- External -------------- */
import { readFile } from 'fs/promises';
import { format } from 'date-fns';
import S3SyncClient from 's3-sync-client';
import { backupUsers } from 'cognito-backup-restore';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { Context, Callback, ScheduledEvent } from 'aws-lambda';
import {
  ListUserPoolsCommand,
  UserPoolDescriptionType,
} from '@aws-sdk/client-cognito-identity-provider';

/* -------------- Clients -------------- */
import { cognito_client } from '_clients/cognito';
import { s3_client } from '_clients/s3';

/* -------------- Constants -------------- */
const DUMPS_FOLDER = '/tmp';

/* -------------- Functions -------------- */
const get_all_userpools_for_environent = async (environment: string) => {
  const userpools: Required<UserPoolDescriptionType>[] = [];

  let next_token: string | undefined;

  do {
    const command = new ListUserPoolsCommand({
      NextToken: next_token,
      MaxResults: undefined,
    });

    const { UserPools, NextToken } = await cognito_client.send(command);
    if (UserPools)
      userpools.push(
        ...(UserPools.filter(
          ({ Name, Id }) =>
            Id &&
            Name &&
            Name.toLocaleLowerCase().includes(
              `-${environment.toLocaleLowerCase()}`,
            ),
        ) as Required<UserPoolDescriptionType>[]),
      );

    next_token = NextToken;
  } while (next_token);

  return userpools;
};

export const handler = async (
  event: ScheduledEvent,
  _: Context,
  callback: Callback,
): Promise<void> => {
  const lowercase_env_name = process.env.ENVIRONMENT?.toLowerCase();

  if (lowercase_env_name !== 'prod') return callback(null, event);

  const backup_bucket = `polytag-${lowercase_env_name}-backup-bucket`;

  /* ----------
   * Backing up S3 data
   * ---------- */
  const source_bucket_uri = `s3://polytag-${lowercase_env_name}-main-bucket`;

  const { sync } = new S3SyncClient({ client: s3_client });

  await sync(source_bucket_uri, `s3://${backup_bucket}/s3`, { del: true });

  /* ----------
   * Backing up Cognito data
   * ---------- */

  const cognito_isp = new CognitoIdentityServiceProvider();

  const userpools = await get_all_userpools_for_environent(lowercase_env_name);

  for (const { Name: userpool_name, Id: userpool_id } of userpools) {
    await backupUsers(cognito_isp, userpool_id, DUMPS_FOLDER);

    const cognito_dump_key = format(new Date(), 'yyyy-MM-dd');
    const cognito_dump_file = `${DUMPS_FOLDER}/${userpool_id}.json`;

    const put_cognito_dump_cmd = new PutObjectCommand({
      Bucket: backup_bucket,
      Key: `cognito/${userpool_name}/${cognito_dump_key}.json`,
      Body: await readFile(cognito_dump_file),
    });

    await s3_client.send(put_cognito_dump_cmd);
  }

  return callback(null, event);
};
