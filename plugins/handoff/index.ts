import { Plugin } from "@opencode/plugin"

// /compact becomes a handoff. OpenCode appends its own summary-instruction
// message to the compaction request after hooks run; this hook rewrites that
// message at the wire so the model sees ONE final instruction (ours) and its
// response becomes the handoff document. Everything before that message is
// byte-identical to the normal request, so the provider prompt cache stays
// hot. With compaction.keep.tokens = 0 in opencode.json, the post-compact
// session starts from the handoff document alone. If OpenCode's instruction
// ever changes shape and stops matching SUMMARY_MARKERS, the request passes
// through untouched and stock compaction runs instead.

export const HANDOFF_INSTRUCTIONS = `Your context is filling up. Output the complete handoff document as your response text ONLY, and I'll restart the session with that context. The next agent starts with nothing but this document, so make it self-contained and concrete. Use exactly these sections:

## Objective
## Decisions
## Done
## Files
## Blockers
## Next Steps

Write facts: exact file paths, commands, errors, and next actions. If the next agent would need to re-derive something you already learned, write the result, not the derivation. Do not add a preamble, do not comment on the transcript itself, do not apologize for summarizing. The document is the entire continuation of the session.`

// Distinctive sentence from each compaction-prompt variant OpenCode ships
// (initial checkpoint and summary update); lifted from the running build.
export const SUMMARY_MARKERS = [
  "You MUST summarize the conversation above",
  "Update the existing checkpoint in the conversation above",
]

const isSummaryPrompt = (text: string): boolean =>
  SUMMARY_MARKERS.some((marker) => text.includes(marker))

// Rewrite the appended summary instruction. Supports plain-string and
// single-text-part content shapes; anything else returns null so the caller
// bails instead of corrupting the request.
export function swapMessageText(message: any, text: string): any | null {
  for (const key of ["content", "text", "input"] as const) {
    const value = message[key]
    if (typeof value === "string") return { ...message, [key]: text }
    if (Array.isArray(value)) {
      const first = value[0]
      if (value.length === 1 && first?.type === "text" && typeof first.text === "string") {
        return { ...message, [key]: [{ type: "text", text }] }
      }
      if (value.length === 1 && first && typeof first.content === "string") {
        return { ...message, [key]: [{ ...first, content: text }] }
      }
      return null
    }
  }
  return null
}

// Locate the appended summary-prompt message in a request body and rewrite it
// with the handoff instructions. Returns the modified body, or null when this
// body is not a compaction request we recognize.
export function rewriteBody(body: any): any | null {
  const key = body?.messages ? "messages" : body?.input ? "input" : null
  if (key === null) return null
  const container: any[] | null = body[key]
  if (!Array.isArray(container) || container.length === 0) return null

  if (!isSummaryPrompt(JSON.stringify(container.at(-1)))) return null

  const replacement = swapMessageText(container.at(-1), HANDOFF_INSTRUCTIONS)
  if (replacement === null) return null
  return { ...body, [key]: [...container.slice(0, -1), replacement] }
}

export default Plugin.define({
  id: "handoff",
  setup(ctx) {
    ctx.session.hook("http.request", async (event) => {
      if (event.kind !== "compaction") return
      // Bodies are one-shot streams: clone before reading, then hand back a
      // fresh Request carrying the rewritten body.
      let body: any
      try {
        body = JSON.parse(await event.request.clone().text())
      } catch {
        return // not JSON; leave the request alone
      }
      const rewritten = rewriteBody(body)
      if (rewritten === null) return
      event.request = new Request(event.request.url, {
        method: event.request.method,
        headers: event.request.headers,
        body: JSON.stringify(rewritten),
      })
    })
  },
})
