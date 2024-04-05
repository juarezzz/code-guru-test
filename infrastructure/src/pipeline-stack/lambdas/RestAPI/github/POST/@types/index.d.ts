/* ---------- Interfaces ---------- */
export interface GithubCommit {
  id: string;
  tree_id: string;
  distinct: boolean;
  message: string;
  timestamp: string;
  url: string;
  author: {
    name: string;
    email: string;
    username: string;
  };
  committer: {
    name: string;
    email: string;
    username: string;
  };
  modified: string[];
  added: string[];
  removed: string[];
}

export interface GithubPullRequest {
  url: string;
  number: number;
  draft: boolean;
  commits: number;
  title: string;
  base: {
    ref: string;
  };
  head: {
    ref: string;
    sha: string;
  };
}

export interface GithubEventBody {
  action: string;
  number: number;
  head_commit: GithubCommit;
  commits: GithubCommit[];
  ref: string;
  pull_request: GithubPullRequest;
}
