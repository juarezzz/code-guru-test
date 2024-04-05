/* ---------- Types ---------- */
import { AWS } from '__@types';

/* ---------- Interfaces ---------- */
interface EncodeLastKeyInput {
  preserve?: Array<keyof AWS.DynamoDBLastKey>;
  last_evaluated_key: Record<string, unknown> | undefined;
}

export const encode_last_key = ({
  preserve,
  last_evaluated_key,
}: EncodeLastKeyInput) => {
  try {
    const typed_last_key = last_evaluated_key as unknown as
      | AWS.DynamoDBLastKey
      | undefined;

    if (!typed_last_key) return undefined;

    let new_key_object: Partial<AWS.DynamoDBLastKey> = {};

    if (preserve) {
      const missing_data = preserve.some(key => {
        if (!key) return false;

        const value = typed_last_key[key as keyof AWS.DynamoDBLastKey];

        if (typeof value === 'undefined') return true;

        new_key_object[key as keyof AWS.DynamoDBLastKey] = value;

        return false;
      });

      if (missing_data) return undefined;
    } else {
      new_key_object = { ...typed_last_key };
    }

    const buffer = Buffer.from(JSON.stringify(new_key_object));

    const base64_value = buffer.toString('base64');

    return encodeURIComponent(base64_value);
  } catch {
    return undefined;
  }
};
