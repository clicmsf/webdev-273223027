import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from '../src/data/db.mjs';
import { openPostgres } from '../src/data/postgres.mjs';
import { currentUser } from '../src/services/auth.mjs';
import { listUpcomingEvents } from '../src/services/events.mjs';
import { reservePlace, myRegistrations } from '../src/services/registrations.mjs';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const db = process.env.DATABASE_URL ? openPostgres() : openDatabase();

const lectures = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'lectures.json'), 'utf8')
);

// Our two tools
const tools = [
  {
    name: 'find_lecture',
    description:
      'Return the title and topics of one course lecture by its number, 1 to 12. Use it when asked what a specific lecture covers.',
    inputSchema: {
      type: 'object',
      properties: {
        number: {
          type: 'integer',
          description: 'Lecture number, 1 to 12'
        }
      },
      required: ['number']
    }
  },
  {
    name: 'search_lectures',
    description:
      'Search course lecture titles and topics by keyword. Use this when someone wants to find which lectures discuss a subject.',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Keyword to search for'
        }
      },
      required: ['keyword']
    }
  }
];

tools.push(
 { name:'upcoming_events',description:'List upcoming club events and available places for the authenticated member.',inputSchema:{type:'object',properties:{},additionalProperties:false} },
 { name:'my_registrations',description:'List only the authenticated member reservations.',inputSchema:{type:'object',properties:{},additionalProperties:false} },
 { name:'register_for_event',description:'Reserve one event place for the authenticated member; refuses full or duplicate events.',inputSchema:{type:'object',properties:{eventId:{type:'integer',minimum:1}},required:['eventId'],additionalProperties:false} }
);

// Send JSON-RPC response
function send(reply) {
  process.stdout.write(JSON.stringify(reply) + '\n');
}

// Create a tool result
function textResult(id, text, isError = false) {
  return {
    jsonrpc: '2.0',
    id: id,
    result: {
      content: [
        {
          type: 'text',
          text: text
        }
      ],
      isError: isError
    }
  };
}

// Create a protocol error
function protocolError(id, code, message) {
  return {
    jsonrpc: '2.0',
    id: id,
    error: {
      code: code,
      message: message
    }
  };
}

// Convert lecture topics to text
function topicsOf(lecture) {
  return Array.isArray(lecture.topics)
    ? lecture.topics.join(', ')
    : String(lecture.topics || '');
}

// Handle incoming messages
async function handle(msg) {
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!isObject(msg) || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string' ||
      (msg.id !== undefined && msg.id !== null && typeof msg.id !== 'string' && typeof msg.id !== 'number')) {
    return protocolError(null, -32600, 'Invalid request');
  }
  // A notification never receives a response, including initialize without an id.
  if (msg.id === undefined) return null;
  if (msg.params !== undefined && !isObject(msg.params)) {
    return protocolError(msg.id, -32602, 'Params must be an object');
  }

  // Initialize handshake
  if (msg.method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id: msg.id,
      result: {
        protocolVersion: msg.params?.protocolVersion || '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'lectures',
          version: '0.1.0'
        }
      }
    };
  }

  // Notification: no response
  if (msg.method === 'notifications/initialized') {
    return null;
  }

  // Other notifications also receive no response
  if (msg.id === undefined) {
    return null;
  }

  // List tools
  if (msg.method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id: msg.id,
      result: {
        tools: tools
      }
    };
  }

  // Call tools
  if (msg.method === 'tools/call') {
    const name = msg.params?.name;
    const args = msg.params?.arguments === undefined ? {} : msg.params.arguments;
    if (typeof name !== 'string' || !isObject(args)) {
      return protocolError(msg.id, -32602, 'Tool name and object arguments are required');
    }

    if (['upcoming_events','my_registrations','register_for_event'].includes(name)) {
      const expected=name==='register_for_event'?['eventId']:[];
      if (Object.keys(args).some(key=>!expected.includes(key))) return protocolError(msg.id,-32602,'Unexpected argument');
      if (name === 'register_for_event' && (!Number.isInteger(args.eventId) || args.eventId < 1)) {
        return protocolError(msg.id, -32602, 'Event id must be a positive integer');
      }
      try {
        const user=await currentUser(db,{headers:{cookie:'club_session='+(process.env.CLUB_SESSION_TOKEN || '')}});
        if (!user) return textResult(msg.id,JSON.stringify({error:'Unauthenticated',status:401,message:'Sign in first'}),true);
        const result=name==='upcoming_events'?await listUpcomingEvents(db):name==='my_registrations'?await myRegistrations(db,user.id):await reservePlace(db,user.id,args.eventId);
        return textResult(msg.id,JSON.stringify(result));
      } catch(error) {
        return textResult(msg.id,JSON.stringify({error:error.name,status:error.status || 500,message:error.status?error.message:'Tool failed'}),true);
      }
    }

    // Tool 1: Find lecture
    if (name === 'find_lecture') {

      if (!Number.isInteger(args.number)) {
        return protocolError(
          msg.id,
          -32602,
          'Lecture number must be an integer'
        );
      }

      const lecture = lectures.find(
        (l) => l.number === args.number
      );

      if (!lecture) {
        return textResult(
          msg.id,
          'There is no lecture ' + args.number +
          '. The course has lectures 1 to 12.',
          true
        );
      }

      return textResult(
        msg.id,
        'Lecture ' + lecture.number + ': ' +
        lecture.title + '. Topics: ' + topicsOf(lecture),
        false
      );
    }

    // Tool 2: Search lectures
    if (name === 'search_lectures') {

      if (
        typeof args.keyword !== 'string' ||
        args.keyword.trim() === ''
      ) {
        return protocolError(
          msg.id,
          -32602,
          'A keyword is required'
        );
      }

      const keyword = args.keyword.toLowerCase();

      const matches = lectures.filter((lecture) => {
        const text =
          lecture.title + ' ' + topicsOf(lecture);

        return text.toLowerCase().includes(keyword);
      });

      if (matches.length === 0) {
        return textResult(
          msg.id,
          'No lectures found for: ' + args.keyword,
          false
        );
      }

      const result = matches.map(
        (lecture) =>
          'Lecture ' + lecture.number + ': ' +
          lecture.title + '. Topics: ' + topicsOf(lecture)
      ).join('\n');

      return textResult(msg.id, result, false);
    }

    // Unknown tool
    return protocolError(
      msg.id,
      -32602,
      'Unknown tool: ' + name
    );
  }

  // Unknown method
  return protocolError(
    msg.id,
    -32601,
    'Unknown method: ' + msg.method
  );
}

// Read stdin line by line
const lines = readline.createInterface({
  input: process.stdin
});

let pending = Promise.resolve();

async function handleLine(line) {
  // Never log tool arguments or session identity.

  let msg;

  try {
    msg = JSON.parse(line);
  } catch (error) {
    send(protocolError(null, -32700, 'Parse error'));
    return;
  }

  if (!msg || typeof msg!=='object') { send(protocolError(null,-32600,'Invalid request')); return; }
  const reply = await handle(msg);

  if (reply) {
    send(reply);
  }
}

lines.on('line', (line) => {
  pending = pending.then(() => handleLine(line));
});
lines.on('close', async () => {
  await pending;
  if (db.end) await db.end();
  else db.close();
});
