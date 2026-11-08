---
name: comment-planner
description: Suggests comments on PRs, issues, and support threads. Use before posting a comment, review note, or reply to a stranger.
---

Commit-planner covers commit messages and PR bodies. This covers the comment itself: a review note, an issue reply, a support ticket. Draft it, then wait for me to say post.

## Smallest version that makes one point

My edits are almost always deletions. Start from the shortest thing that carries the point, then add only what the reader cannot get anywhere else. Name the symptom, not the mechanism.

BAD:
> One closing `'')` sits at column 0 here, but it should line up with the rest of the list. That is what `Lint / treefmt` trips on. Everything else looks solid: all three packages build and the binary reports 1.19.3. Thanks for the backport!

GOOD:
> Cherry-picking [36810696](https://github.com/NixOS/nixpkgs/commit/36810696b9b19e169316ae80225b65b154feb877) probably hit a merge conflict, the author resolved it with a formatting error.

Three lines is a whole comment:

```
style(opencode-desktop): fix the indent treefmt wanted

https://github.com/NixOS/nixpkgs/actions/runs/42344700555/job/128319915897?pr=584289#step:4:437

Thanks for the backport, it's in good shape.
```

An issue reply is the same shape. State what the thing does, give the snippet, name when to remove it:

> Until this merges, this overlay unblocks local builds. Remove it after.

## What carries the point

- A link to the failing job or the commit, not a retelling of what the log printed.
- Numbers only when they are the argument. "My metered usage on public repos this month is $2.95 and the included usage discount is the same $2.95, so the next payment due shows `-`" settles a billing ticket. Run timestamps decorate it.
- My guess stays a guess. "Probably" stays "probably".
- Nothing pointing at your other comment or the conversation. Each comment stands alone, so a repost says the thing again instead of "same as above".

## Voice

Contractions, plain words, write to the person. No "I have verified", no "This PR", no thanking me for my patience. When I state a fact, state it. Do not turn it into a request for a favour.
