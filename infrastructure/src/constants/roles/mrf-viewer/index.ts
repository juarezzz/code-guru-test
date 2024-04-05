type MrfViewerRoles = 'mrf-scans' | 'mrf-users';

type MrfViewer = Record<MrfViewerRoles, string[]>;

export const mrf_viewer: MrfViewer = {
  'mrf-scans': ['GET'],
  'mrf-users': ['GET'],
};
