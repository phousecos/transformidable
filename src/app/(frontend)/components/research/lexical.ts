// Minimal, allowlist-based Lexical -> HTML renderer for the research
// frontend. Text nodes are author-controlled but still treated as untrusted:
// the output feeds dangerouslySetInnerHTML, so every `<`, `&`, and quote is
// escaped and only known node types / heading tags are emitted.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const ALLOWED_HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"])

function nodeToHtml(node: any): string {
  if (!node) return ""
  if (node.type === "text" || (!node.type && typeof node.text === "string")) {
    let text = escapeHtml(node.text ?? "")
    const fmt = typeof node.format === "number" ? node.format : 0
    if (fmt & 1) text = `<strong>${text}</strong>`
    if (fmt & 2) text = `<em>${text}</em>`
    return text
  }
  const children = (node.children ?? []).map(nodeToHtml).join("")
  switch (node.type) {
    case "root": return children
    case "paragraph": return children ? `<p>${children}</p>` : `<p><br /></p>`
    case "heading": {
      // Body copy sits under the page's own <h1>, so an authored h1 is
      // demoted to h2 to keep one h1 per page (WCAG 1.3.1 / 2.4.6).
      const tag = ALLOWED_HEADING_TAGS.has(node.tag) && node.tag !== "h1" ? node.tag : "h2"
      return `<${tag}>${children}</${tag}>`
    }
    case "quote": return `<blockquote>${children}</blockquote>`
    case "list": return node.listType === "number" ? `<ol>${children}</ol>` : `<ul>${children}</ul>`
    case "listitem": return `<li>${children}</li>`
    case "linebreak": return "<br />"
    default: return children
  }
}

export function renderLexical(body: any): string {
  if (typeof body === "string") return body
  if (body?.root) return nodeToHtml(body.root)
  return ""
}
