/* ---------- Policies ---------- */
import { brand_admin } from '_constants/policies/brand-admin';
import { brand_analyst } from '_constants/policies/brand-analyst';
import { brand_editor } from '_constants/policies/brand-editor';
import { polytag_admin } from '_constants/policies/polytag-admin';
import { polytag_super_admin } from '_constants/policies/polytag-super-admin';
import { third_party_admin } from '_constants/policies/third-party-admin';

/* ---------- Modules ---------- */
import { create_policy } from '_modules/policies/functions/create/create-policy';

export const handler = async (): Promise<void> => {
  try {
    const brand_admin_promise = create_policy({ policy: brand_admin });
    const brand_analyst_promise = create_policy({ policy: brand_analyst });
    const brand_editor_promise = create_policy({ policy: brand_editor });

    const polytag_super_admin_promise = create_policy({
      policy: polytag_super_admin,
    });
    const polytag_admin_promise = create_policy({ policy: polytag_admin });

    const third_party_admin_promise = create_policy({
      policy: third_party_admin,
    });

    await Promise.all([
      brand_admin_promise,
      brand_analyst_promise,
      brand_editor_promise,
      polytag_admin_promise,
      polytag_super_admin_promise,
      third_party_admin_promise,
    ]);
  } catch (error) {
    console.log(`error = ${JSON.stringify(error)}`);
  }
};
