/* ---------- External ---------- */
import chalk from 'chalk';
import { config } from 'dotenv';
import { readFile } from 'fs/promises';
import { backupUsers } from 'cognito-backup-restore';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { AdminCreateUserRequest } from 'aws-sdk/clients/cognitoidentityserviceprovider';

/* ---------- Types ---------- */
import { Clients } from '__scripts/@types';
import { CognitoUserDump, EnvironmentEnum } from './@types';

/* ---------- Logs helpers ---------- */
const info_log = chalk.bold.blueBright;
const note_log = chalk.bold.yellowBright;
const warning_log = chalk.bold.redBright;

/* -------------- Constants -------------- */
const TEMP_FOLDER = '/tmp';

/* ---------- Functions ---------- */
const restoreUsers = async (
  cognito_idp: CognitoIdentityServiceProvider,
  userpool_id: string,
  users: CognitoUserDump[],
  temp_password: string,
) => {
  for (const user of users) {
    try {
      const user_email = user.Attributes.find(attribute => attribute.Name === 'email')?.Value;

      if (user.UserStatus !== 'CONFIRMED' || !user_email) continue;

      const filtered_attributes = user.Attributes.filter(attribute => attribute.Name !== 'sub');

      const create_user_input: AdminCreateUserRequest = {
        Username: user_email,
        UserPoolId: userpool_id,
        UserAttributes: filtered_attributes,
        TemporaryPassword: temp_password,
      };

      await cognito_idp.adminCreateUser(create_user_input).promise();

      const add_user_operation = cognito_idp
        .adminAddUserToGroup({
          GroupName: 'brand-admin',
          Username: user_email,
          UserPoolId: userpool_id,
        })
        .promise();

      const set_pwd_operation = cognito_idp
        .adminSetUserPassword({
          Password: temp_password,
          Username: user_email,
          UserPoolId: userpool_id,
          Permanent: true,
        })
        .promise();

      await Promise.all([add_user_operation, set_pwd_operation]);
    } catch (_error) {
      continue;
    }
  }
};

export const handleCopyCognito = async (
  from: EnvironmentEnum,
  to: EnvironmentEnum,
  clients: Clients,
) => {
  try {
    config();

    const source_userpool = `Userpool-${from}`;
    const target_userpool = `Userpool-${to}`;
    const temp_password = process.env.COGNITO_TEMP_PWD;

    console.log(
      info_log(`\nCloning data between the ${source_userpool} and ${target_userpool} UserPools...`),
    );

    console.log(info_log('\nFetching information from both source and target UserPools...'));

    const userpools_list = await clients.cognito_client.listUserPools({ MaxResults: 60 }).promise();

    const source_userpool_info = userpools_list.UserPools?.find(
      current_userpool => current_userpool.Name === source_userpool,
    );

    const target_userpool_info = userpools_list.UserPools?.find(
      current_userpool => current_userpool.Name === target_userpool,
    );

    if (!target_userpool_info || !source_userpool_info) {
      console.log(warning_log("Couldn't find one or more UserPools"));
      return;
    }

    console.log(info_log('\nGetting users from the source UserPool...'));

    await backupUsers(clients.cognito_client, source_userpool_info?.Id || '', TEMP_FOLDER);

    console.log(info_log(`\nStarted copying backuped data to the userpool ${target_userpool}...`));

    const users_params_buffer = await readFile(`${TEMP_FOLDER}/${source_userpool_info?.Id}.json`);

    const user_params = JSON.parse(users_params_buffer.toString()) as CognitoUserDump[];

    await restoreUsers(
      clients.cognito_client,
      target_userpool_info?.Id || '',
      user_params,
      temp_password || '',
    );

    console.log(note_log('\nSuccessfully copied the userpool!'));
  } catch (error) {
    console.log(warning_log('An error happened while cloning the userpool.'));
    console.log(warning_log(error));
  }
};
