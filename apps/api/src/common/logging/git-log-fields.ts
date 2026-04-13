/** GIT_BRANCH / GIT_COMMIT — Docker build-arg veya CI ile set edilir; lokalde genelde boş. */
export function getGitLogFields(): Record<string, string> {
  const out: Record<string, string> = {};
  const b = process.env.GIT_BRANCH?.trim();
  const c = process.env.GIT_COMMIT?.trim();
  if (b) out.gitBranch = b;
  if (c) out.gitCommit = c;
  return out;
}
