/**
 * AI Hook A1 — Epic description + Definition of Done drafting.
 * Version 1. Changes require a DEC-XXXX entry.
 */

import type { AIMessage } from "../provider";

const SYSTEM = `You are an experienced engineering program manager helping draft quarterly planning epics.

Given an epic title, generate:
1. A concise description (2-4 sentences) explaining what the work involves and why it matters.
2. A specific, measurable Definition of Done (3-5 bullet points) that an engineer could verify.

Rules:
- Be specific and actionable, not vague
- DoD items must be verifiable (not "make it better" — instead "latency < 200ms at p99")
- Include success criteria, not just task completion
- Avoid jargon unless it's standard engineering terminology
- Keep total response under 200 words

Format your response as JSON:
{"description": "...", "definitionOfDone": "- item 1\\n- item 2\\n- item 3"}`;

const EXAMPLES = [
  {
    title: "Migrate auth service to OAuth 2.0",
    description:
      "Replace the legacy session-token authentication system with industry-standard OAuth 2.0. This unblocks SSO integration for enterprise customers and resolves the session fixation vulnerability identified in the Q4 security audit.",
    definitionOfDone:
      "- All services authenticate via OAuth 2.0 tokens (no legacy session tokens in production)\n- SSO login flow works end-to-end for at least one identity provider (Google or Okta)\n- Legacy session migration script runs without data loss on staging\n- Auth latency remains under 100ms at p99\n- Security team signs off on the implementation",
  },
  {
    title: "Add real-time notifications for order status",
    description:
      "Implement push notifications (web and mobile) that inform customers when their order status changes. Currently customers must manually refresh the order page. This is the #1 requested feature in customer feedback surveys.",
    definitionOfDone:
      "- Customers receive push notifications for: order confirmed, shipped, delivered\n- Notification delivery latency < 5 seconds from status change\n- Opt-out preference respected; default is opted-in\n- Works on Chrome, Safari, Firefox (web) and iOS/Android (mobile)\n- Notification volume monitored in Datadog with alert on > 1% delivery failure",
  },
];

export function buildDraftEpicMessages(title: string, teamContext?: string): AIMessage[] {
  const exampleText = EXAMPLES.map(
    (ex) =>
      `Title: "${ex.title}"\nResponse: ${JSON.stringify({ description: ex.description, definitionOfDone: ex.definitionOfDone })}`
  ).join("\n\n");

  let userContent = `Title: "${title}"`;
  if (teamContext) {
    userContent += `\nTeam context: ${teamContext}`;
  }

  return [
    { role: "system", content: SYSTEM },
    { role: "user", content: `Here are examples of good epic drafts:\n\n${exampleText}\n\nNow draft this epic:\n\n${userContent}` },
  ];
}
