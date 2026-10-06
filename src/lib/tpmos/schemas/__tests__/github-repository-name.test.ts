import { it, expect } from "vitest";
import { GitHubRepositoryNameSchema, CreateGitHubWebhookSchema } from "../github-webhook";
it("accepts repository names and canonicalizes full GitHub URLs", () => {
  for (const input of ["owner/repo", " owner/repo ", "https://github.com/owner/repo", "https://github.com/owner/repo/", "https://github.com/owner/repo?tab=readme-ov-file", "https://github.com/owner/repo.git", "github.com/owner/repo", "https://www.github.com/owner/repo"]) expect(GitHubRepositoryNameSchema.parse(input)).toBe("owner/repo");
});
it("rejects hostile hosts, credentials, nested paths and malformed names with readable guidance", () => {
  for (const input of ["repo", "owner / repo", "https://gitlab.com/owner/repo", "https://github.com.evil.example/owner/repo", "https://secret@github.com/owner/repo", "https://github.com/owner/repo/issues/1", "", null]) {
    const parsed = GitHubRepositoryNameSchema.safeParse(input); expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues[0].message).toMatch(/repository/i);
  }
});
it("validates the complete connection contract after URL normalization", () => {
  const input = { repository: "https://github.com/owner/repo", repositoryId: 42, teamId: "team", quarterId: "quarter" };
  expect(CreateGitHubWebhookSchema.parse(input).repository).toBe("owner/repo");
  for (const patch of [{ repositoryId: 0 }, { repositoryId: 2.5 }, { teamId: "" }, { quarterId: "" }]) expect(CreateGitHubWebhookSchema.safeParse({ ...input, ...patch }).success).toBe(false);
});
