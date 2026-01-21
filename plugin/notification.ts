import type { Plugin } from "@opencode-ai/plugin"

export const NotificationPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  return {
    event: async ({ event }) => {
      // Send notification on session completion
      if (event.type === "question.asked") {
        await $`notify-send "Opencode" "There's a question for you" --expire-time=4000`
      } else if (event.type === "session.idle") {
        await $`notify-send "Opencode" "Session idle" --expire-time=4000`
      }
    },
  }
}
