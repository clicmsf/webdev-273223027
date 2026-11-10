# Exercise 1 · MCP server

Your hand-written MCP server lives in this folder. Write it in any language you like. The full task is on the exercise page; this file is the short version plus your notes.

## What is already here

| File | What it is |
|---|---|
| `lectures.json` | The course lectures. Your first tool reads this file. |
| `messages.jsonl` | The messages a client sends, in order, with what your server must answer. |
| `check.mjs` | The self-check. It starts your server, sends those messages and tells you what is wrong. |

## The two tools

1. **`find_lecture`**: everyone writes this one. Input: `number` (1 to 12). It returns the title and topics of that lecture from `lectures.json`. A number outside the range is not a crash and not a protocol error: it is a result with `isError: true` and a readable message.
2. **One of your own**: anything useful that reads local data. Give it a description a model can choose by. Every tool needs one: the self-check applies the same rule to all of them, because a description is the only thing a model reads when it decides what to call.

## Where this goes next

Do not throw this folder away after Exercise 1. From Exercise 3 it becomes **your project's own MCP server**: the same protocol loop, with the tools rewired from `lectures.json` to your real data. Its tools call exactly the same service functions your HTTP routes call, so a tool obeys the same rules an API request does, and it carries a user (the `MCP_TOKEN` in `.env.example`) so it may do what that person may do and no more.

That is the whole design, and it is one sentence: **one set of rules, two front doors.** An MCP tool that writes its own database query is a second way into your data with none of your rules on it, and Exercise 5 is very good at finding those.

Add an `mcp` script to `package.json` (`"mcp": "node mcp-server/server.js"`) so your agent, CI and the lecturer can all start the server the same way.

## Run the self-check

```bash
node mcp-server/check.mjs -- <your start command>
# for example
node mcp-server/check.mjs -- node mcp-server/server.js
node mcp-server/check.mjs -- python3 mcp-server/server.py
# once you have added the mcp script
node mcp-server/check.mjs -- npm run --silent mcp
```

It prints one line per check. Fix the failures yourself: the agent may explain a message or review your handler, but it must not write the protocol code for you.

## How to start it
npm run --silent mcp

## Session transcript

Captured on 2026-11-10 by an automated stdio client against this server using
`DB_PATH=:memory: node mcp-server/server.js`. This is reproducible protocol
evidence, not a claim that a student typed it or a model selected a tool.
The first two lecture tools are the Exercise 1 tools; the three project tools
were added in Exercise 3 and require an authenticated session.

```text
client → {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"exercise-evidence","version":"1.0.0"}}}
server → {"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-11-25","capabilities":{"tools":{}},"serverInfo":{"name":"lectures","version":"0.1.0"}}}
client → {"jsonrpc":"2.0","method":"notifications/initialized"}
(no server output)
client → {"jsonrpc":"2.0","id":2,"method":"tools/list"}
server → {"jsonrpc":"2.0","id":2,"result":{"tools":[{"name":"find_lecture","description":"Return the title and topics of one course lecture by its number, 1 to 12. Use it when asked what a specific lecture covers.","inputSchema":{"type":"object","properties":{"number":{"type":"integer","description":"Lecture number, 1 to 12"}},"required":["number"]}},{"name":"search_lectures","description":"Search course lecture titles and topics by keyword. Use this when someone wants to find which lectures discuss a subject.","inputSchema":{"type":"object","properties":{"keyword":{"type":"string","description":"Keyword to search for"}},"required":["keyword"]}},{"name":"upcoming_events","description":"List upcoming club events and available places for the authenticated member.","inputSchema":{"type":"object","properties":{},"additionalProperties":false}},{"name":"my_registrations","description":"List only the authenticated member reservations.","inputSchema":{"type":"object","properties":{},"additionalProperties":false}},{"name":"register_for_event","description":"Reserve one event place for the authenticated member; refuses full or duplicate events.","inputSchema":{"type":"object","properties":{"eventId":{"type":"integer","minimum":1}},"required":["eventId"],"additionalProperties":false}}]}}
client → {"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"find_lecture","arguments":{"number":5}}}
server → {"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"text","text":"Lecture 5: What the agent built, part 1. Topics: HTTP, REST vs GraphQL, data modeling, ORM, layers"}],"isError":false}}
client → {"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"find_lecture","arguments":{"number":99}}}
server → {"jsonrpc":"2.0","id":4,"result":{"content":[{"type":"text","text":"There is no lecture 99. The course has lectures 1 to 12."}],"isError":true}}
client → {"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"search_lectures","arguments":{"keyword":"HTTP"}}}
server → {"jsonrpc":"2.0","id":5,"result":{"content":[{"type":"text","text":"Lecture 5: What the agent built, part 1. Topics: HTTP, REST vs GraphQL, data modeling, ORM, layers"}],"isError":false}}
client → {"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"no_such_tool","arguments":{}}}
server → {"jsonrpc":"2.0","id":6,"error":{"code":-32602,"message":"Unknown tool: no_such_tool"}}
client → {"jsonrpc":"2.0","id":7,"method":"no_such_method"}
server → {"jsonrpc":"2.0","id":7,"error":{"code":-32601,"message":"Unknown method: no_such_method"}}
client → {"jsonrpc":"2.0","id":8,"method":"tools/call","params":{"name":"find_lecture","arguments":{"number":7}}}
server → {"jsonrpc":"2.0","id":8,"result":{"content":[{"type":"text","text":"Lecture 7: Evaluating output. Topics: Non-determinism, false positives, when to trust it"}],"isError":false}}
```

## The description experiment
I changed the find_lecture description from a detailed explanation to "Provides information about course lectures."

The previous simulated test selected find_lecture for "What does lecture 7 cover?" in both cases; this is not evidence of a real agent experiment.

The detailed description should help the model choose the correct tool more reliably because it explains the expected input and output.


### Real-agent verification still required

1. In Codespaces, start Gemini CLI and run `/mcp`; verify `my-project` connects.
2. Ask `What does lecture 7 cover?` without naming a tool; record the actual
   tool choice and response, then `/stats`.
3. Change only the `find_lecture` description to the vague text above, restart
   Gemini, repeat the identical question and record the actual choice and stats.
4. Restore the precise description and replace the simulated observation with
   three sentences describing the real change, result and explanation. Add the
   actual session entries to `AGENT_LOG.md` and `USAGE.md`.

No real-agent selection, token count, student authorship or course acceptance
is claimed by the automated checks.
