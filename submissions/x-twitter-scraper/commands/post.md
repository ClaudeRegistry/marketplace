---
description: Prepare a tweet and require approval before posting
---

Prepare a tweet with the text: "$ARGUMENTS"

Before posting, show the exact tweet text, posting account, endpoint, and usage estimate. Wait for explicit user approval.

After confirmation, use the `xquik` MCP tool to call `POST /api/v1/x/tweets` with body `{ "account": "<confirmed account>", "text": "<the tweet text>" }`.

The API requires an `account` field for the connected X username. If unknown, ask the user which connected account should post.

Show the result: tweet ID and link `https://x.com/i/status/{tweetId}`.

If the text is empty, ask the user what to tweet.
