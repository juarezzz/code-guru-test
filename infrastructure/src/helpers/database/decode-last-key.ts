/* ---------- Types ---------- */
import { AWS } from '__@types';

/* ---------- Interfaces ---------- */
interface DecodeLastKeyInput {
  last_key: string | undefined;
}

export const decode_last_key = ({ last_key }: DecodeLastKeyInput) => {
  try {
    if (!last_key) return undefined;

    const decoded_key = decodeURIComponent(last_key);

    const buffer = Buffer.from(decoded_key, 'base64');

    const utf_value = buffer.toString('utf8');

    const parsed_value: Partial<AWS.DynamoDBLastKey> = JSON.parse(utf_value);

    return parsed_value;
  } catch {
    return undefined;
  }
};
