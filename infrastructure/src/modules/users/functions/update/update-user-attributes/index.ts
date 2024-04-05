/* ---------- External ---------- */
import {
  AttributeType,
  UpdateUserAttributesCommand,
  UpdateUserAttributesCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';

/* ---------- Types ---------- */
interface UpdateUserAttributes {
  access_token: string;
  attributes: AttributeType[];
}

/* ---------- Function ---------- */
const update_user_attributes = async ({
  access_token,
  attributes,
}: UpdateUserAttributes) => {
  const params: UpdateUserAttributesCommandInput = {
    AccessToken: access_token,
    UserAttributes: attributes,
  };

  const command = new UpdateUserAttributesCommand(params);

  await cognito_client.send(command);
};

/* ---------- Export ---------- */
export { update_user_attributes };
