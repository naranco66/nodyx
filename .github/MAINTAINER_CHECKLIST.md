# Maintainer Checklist — Before Merging an External PR

**Run through every box before clicking Merge. No exceptions.**

This file exists because on 2026-04-18 we merged [PR #11](https://github.com/Pokled/nodyx/pull/11) without running any of these checks and shipped broken code for 8 minutes. Never again.

---

## 1. CI must be green (the non-negotiable)

- [ ] **Approve the workflow run** — GitHub blocks CI for first-time external contributors until a maintainer approves. Go to the PR → Actions tab → "Approve and run workflows"
- [ ] **Wait for all CI checks to complete** — every job must show the green check, no skipped jobs
- [ ] If CI is red, **do not merge**. Comment on the PR, ask the contributor to fix, or offer to push a fix yourself (their star stays either way)

## 2. Local verification (5 minutes max)

- [ ] Checkout the PR branch: `gh pr checkout <PR_NUMBER>`
- [ ] If `nodyx-frontend` touched: `cd nodyx-frontend && npm run check` — zero errors required
- [ ] If `nodyx-frontend` touched: `npm run build` — must succeed
- [ ] If `nodyx-core` touched: `cd nodyx-core && npm run build && npm test`
- [ ] If `nodyx-p2p` touched: `cd nodyx-p2p && cargo check && cargo test`

## 3. Read the diff with intent

- [ ] Read every changed line. Ask: does this match our patterns (look at neighboring code)?
- [ ] Check the contributor's claims against reality. If the PR says "offset by +20px", open the file and verify the code actually computes a +20 offset that gets applied where it matters.
- [ ] Edge cases: what happens with empty input? Locked/deleted items? Concurrent users?

## 4. Test the feature in a real browser (if UI)

- [ ] Start dev: `cd nodyx-frontend && npm run dev`
- [ ] Exercise every claim in the PR description. "Verified X" in the PR body = you must verify X yourself.
- [ ] Try the golden path, then try one unusual path (nothing selected, max selected, locked element, etc.)

## 5. Merge strategy

- [ ] `gh pr merge <N> --merge` — use `--merge` (not `--squash`) to preserve the contributor's commit SHA and author attribution intact in `git log`
- [ ] Write the merge commit message yourself — keep the "Merge PR #N: <title>" format + "Closes #<issue>" line

## 6. Post-merge

- [ ] Polish commits if needed — each one linked in CONTRIBUTORS.md under "The Polish Trail"
- [ ] Production deploy (rebuild + `sudo -u nodyx pm2 restart`)
- [ ] Add/update contributor card in [CONTRIBUTORS.md](../CONTRIBUTORS.md)
- [ ] Warm comment on the PR thanking them + mention they're in the Hall of Fame
- [ ] If it's their first PR: also shout them out in the README

---

## The golden rule

**If you'd be embarrassed to show this code to a potential hire six months from now, don't merge it yet.** Polish-then-merge is fine too — you're the maintainer, you set the bar.

Our "merge-then-polish, never gatekeep" rule in [CONTRIBUTORS.md](../CONTRIBUTORS.md) is for **cosmetic** or **minor** polish. It is **not** a license to merge broken code. CI green + local `npm run check` green is the minimum bar. Below that, we polish first, then merge.
