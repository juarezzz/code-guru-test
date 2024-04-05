import { brand_admin } from '_constants/roles/brand-admin';
import { brand_editor } from '_constants/roles/brand-editor';
import { brand_analyst } from '_constants/roles/brand-analyst';
import { mrf_admin } from '_constants/roles/mrf-admin';
import { mrf_viewer } from '_constants/roles/mrf-viewer';
import { polytag_admin } from '_constants/roles/polytag-admin';
import { polytag_super_admin } from '_constants/roles/polytag-super-admin';
import { printer_admin } from '_constants/roles/printer-admin';
import { third_party_admin } from '_constants/roles/third-party/third-party-admin';
import { third_party_labels } from '_constants/roles/third-party/third-party-labels';

type Roles = Record<string, Record<string, string[]>>;

export const roles: Roles = {
  'brand-admin': brand_admin,
  'brand-editor': brand_editor,
  'brand-analyst': brand_analyst,
  'mrf-admin': mrf_admin,
  'mrf-viewer': mrf_viewer,
  'polytag-admin': polytag_admin,
  'polytag-super-admin': polytag_super_admin,
  'printer-admin': printer_admin,
  'third-party-admin': third_party_admin,
  'third-party-labels': third_party_labels,
};
