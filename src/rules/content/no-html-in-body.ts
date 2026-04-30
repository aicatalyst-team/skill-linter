import type { Rule } from "../../engine/types.js";

function hasHtmlNode(node: unknown): boolean {
  const n = node as { type: string; children?: unknown[] };
  if (n.type === "html") return true;
  if (Array.isArray(n.children)) {
    return n.children.some(hasHtmlNode);
  }
  return false;
}

export const noHtmlInBody: Rule = {
  meta: {
    id: "content/no-html-in-body",
    type: "suggestion",
    defaultSeverity: "info",
    fixable: false,
    description: "Body should not contain raw HTML tags",
    category: "content",
    messages: {
      htmlFound: "Body contains raw HTML — HTML may not render in agent contexts",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0 || skill.body.trim() === "") return;

    if (hasHtmlNode(skill.mdast)) {
      context.report({
        messageId: "htmlFound",
        location: { startLine: skill.bodyStartLine },
      });
    }
  },
};
