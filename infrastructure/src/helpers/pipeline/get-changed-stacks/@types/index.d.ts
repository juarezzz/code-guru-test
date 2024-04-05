/* -------------- Types -------------- */
import { GithubCommit } from '_pipeline-stack/lambdas/RestAPI/github/POST/@types';

/* -------------- Interfaces -------------- */
export interface GetChangedStacksInput {
  commits_list: GithubCommit[];
}

export interface GetChangedStacksOutput {
  backend: boolean;
  frontend: boolean;
  admin_web: boolean;
  analytics: boolean;
}
