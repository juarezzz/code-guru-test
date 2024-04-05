/* ---------- External ---------- */
import {
  AttributeType,
  UpdateUserAttributesCommand,
  UpdateUserAttributesCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';

/* ---------- Interfaces ---------- */
interface UpdatePolytagAdminAttributesInput {
  access_token: string;
  full_name: string;
}

/* ---------- Function ---------- */
const update_polytag_admin_attributes = async ({
  access_token,
  full_name,
}: UpdatePolytagAdminAttributesInput) => {
  const attributes: AttributeType[] = [
    { Name: 'custom:full_name', Value: full_name },
  ];

  const params: UpdateUserAttributesCommandInput = {
    AccessToken: access_token,
    UserAttributes: attributes,
  };

  const command = new UpdateUserAttributesCommand(params);

  await cognito_client.send(command);
};

/* ---------- Export ---------- */
export { update_polytag_admin_attributes };
