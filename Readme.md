# Slack-Clone (ThreadCall)
These is prototype of slack clone where user can join or create channels and video/audio calls live inside a messages threads and AI automatically posts a summary back to thread when the calls end. It's a real-time messaging platform.

## Problems
Slack and Zoom are two separate products. When a Slack conversation needs a call, you leave Slack, open Zoom, share a link, talk, hang up, then manually write notes back in Slack. The call has no connection to the conversation that prompted it. Decisions evaporate.

ThreadCall fixes this with one idea: the call belongs to the conversation.

## The One Feature That Makes It Different
Start a call directly from any message thread. When the call ends, an AI-generated summary — decisions, action items, key points — is automatically posted back as a reply to that exact thread. Zero manual work.
```bash
Thread: "Should we use Redis or Postgres for sessions?"
  └── Krishna: "I lean Redis, but let's discuss"
  └── Rohan: "Quick call?"
  └── 📞 Call — 2 participants — 6 min 42 sec
  └── 🤖 AI Summary
        Decisions: Use Redis for sessions (TTL built-in)
        Action items:
          - Krishna: implement Redis session store by Friday
          - Rohan: remove Postgres session table migration
```
