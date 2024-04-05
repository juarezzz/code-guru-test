/* ---------- External ---------- */
import { SFNClient } from '@aws-sdk/client-sfn';

/* ---------- Config ---------- */
// import { accessKeyId, region, secretAccessKey } from '__server/config.json';

/* ---------- Client ---------- */
export const step_functions_client = new SFNClient({});
// export const step_functions_client = new SFNClient({
//   region,
//   credentials: {
//     accessKeyId,
//     secretAccessKey,
//   },
// });
