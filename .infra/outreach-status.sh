#!/bin/bash
# Outreach campaign status board. Shows, per invited plugin: the issue on the
# author's repo (state + any reply from someone other than us) and the paired
# draft PR on the marketplace (state, CI, mergeability). A reply from the
# author is the signal to act (mark PR ready -> merge -> deploy -> thank).
#
# Usage: bash .infra/outreach-status.sh
set -euo pipefail

ME="williankeller"

# plugin | author-repo | issue# | marketplace-PR#
CAMPAIGNS=(
  "nemp|SukinShetty/Nemp-memory|9|16"
  "insane-research|fivetaku/insane-research|3|17"
  "bkt|avivsinai/bitbucket-cli|295|18"
  "flowforge-skill|wentong2022-arch/flowforge-skill|2|19"
)

echo "ClaudeRegistry outreach - batch 1"
echo "================================="

for c in "${CAMPAIGNS[@]}"; do
  IFS='|' read -r plugin repo issue pr <<< "$c"
  echo
  echo "### $plugin"

  # Issue on the author's repo: state + non-us comments.
  istate=$(gh issue view "$issue" --repo "$repo" --json state -q .state 2>/dev/null || echo "GONE")
  replies=$(gh issue view "$issue" --repo "$repo" --json comments \
    -q "[.comments[] | select(.author.login != \"$ME\")] | length" 2>/dev/null || echo 0)
  echo "  issue $repo#$issue: $istate | replies from others: $replies"
  if [ "${replies:-0}" -gt 0 ]; then
    gh issue view "$issue" --repo "$repo" --json comments \
      -q ".comments[] | select(.author.login != \"$ME\") | \"    -> @\(.author.login): \(.body | .[0:140])\"" 2>/dev/null || true
  fi

  # Draft PR on the marketplace: state, draft, CI rollup, non-us comments.
  pstate=$(gh pr view "$pr" --repo ClaudeRegistry/marketplace --json state,isDraft \
    -q '"\(.state)\(if .isDraft then " (draft)" else "" end)"' 2>/dev/null || echo "GONE")
  pchecks=$(gh pr view "$pr" --repo ClaudeRegistry/marketplace --json statusCheckRollup \
    -q '[.statusCheckRollup[]? | .conclusion // .status] | join(",")' 2>/dev/null || echo "-")
  pcomments=$(gh pr view "$pr" --repo ClaudeRegistry/marketplace --json comments \
    -q "[.comments[] | select(.author.login != \"$ME\")] | length" 2>/dev/null || echo 0)
  echo "  PR   marketplace#$pr: $pstate | CI: ${pchecks:--} | replies: $pcomments"
  if [ "${pcomments:-0}" -gt 0 ]; then
    gh pr view "$pr" --repo ClaudeRegistry/marketplace --json comments \
      -q ".comments[] | select(.author.login != \"$ME\") | \"    -> @\(.author.login): \(.body | .[0:140])\"" 2>/dev/null || true
  fi
done

echo
echo "Signal to act: any 'replies from others' > 0. A yes -> mark PR ready, confirm CI green, merge, deploy website, thank on the issue."
