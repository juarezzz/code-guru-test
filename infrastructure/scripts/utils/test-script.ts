import { test_gs1_api_v2_script } from '__scripts/choices/custom/gs1/test-gs1-api-v2';

export const test_scripts = async () => {
  await test_gs1_api_v2_script({ environment: 'LOCAL' });
};
