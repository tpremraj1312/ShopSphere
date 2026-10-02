/**
 * extract_logs.js
 * 
 * Extracts real prompts and final responses from Antigravity IDE transcript JSONL files
 * and writes them into the .agent-logs/ directory in the required 8x format.
 * 
 * This reads REAL transcripts — no fabrication.
 */

const fs = require('fs');
const path = require('path');

const BRAIN_DIR = path.join('C:', 'Users', 'Admin', '.gemini', 'antigravity-ide', 'brain');
const OUTPUT_DIR = path.join('C:', 'Users', 'Admin', 'Documents', 'ShopSphere', '.agent-logs');
const AUTHOR = 'tpremraj1312';
const PROJECT = 'ShopSphere';
const TOOL = 'antigravity-ide';
const MODEL = 'claude-opus-4.6-thinking';

// Sessions to process (Oct 1–2 development timeline)
const SESSIONS = [
  {
    id: 'd55dd082-9b5f-419c-ada1-ee9780108178',
    description: 'Frontend redesign - initial attempt (short session)',
  },
  {
    id: 'e7fbf6ce-6168-469d-a57e-fb280948ea1a',
    description: 'Full frontend redesign session',
  },
  {
    id: '7f9c6ab7-6312-49aa-b60d-05f0ed02ec01',
    description: 'Brief session',
  },
  {
    id: '8ea52e84-0c50-4eb0-a331-c3930ab96a1c',
    description: 'Bug fixes, orders, seller dashboard, deployment',
  },
  {
    id: 'b7aed8df-3a12-451e-89d6-eff9e2e5a320',
    description: 'Capture setup session (this one)',
  },
];

function extractUserContent(rawContent) {
  // Extract just the user request content, stripping system metadata wrappers
  if (!rawContent) return '';
  
  // Extract content between <USER_REQUEST> tags
  const userReqMatch = rawContent.match(/<USER_REQUEST>\s*\n?([\s\S]*?)\n?\s*<\/USER_REQUEST>/);
  if (userReqMatch) {
    return userReqMatch[1].trim();
  }
  
  // If no tags, return raw content (sometimes prompts aren't wrapped)
  return rawContent.trim();
}

function extractResponseContent(rawContent) {
  if (!rawContent) return '';
  return rawContent.trim();
}

function truncateForLog(content, maxLen = 8000) {
  // For very long responses (e.g. full file writes), truncate reasonably
  if (content.length <= maxLen) return content;
  return content.substring(0, maxLen) + '\n\n[... response truncated for log brevity, full content in transcript ...]';
}

function processSession(session) {
  const transcriptPath = path.join(
    BRAIN_DIR, session.id, '.system_generated', 'logs', 'transcript_full.jsonl'
  );
  
  if (!fs.existsSync(transcriptPath)) {
    console.log(`Skipping ${session.id} — transcript not found`);
    return null;
  }
  
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(l => l.trim());
  const entries = lines.map(l => {
    try { return JSON.parse(l); } 
    catch { return null; }
  }).filter(Boolean);
  
  // Extract prompt-response pairs
  const exchanges = [];
  let currentPrompt = null;
  let lastResponse = null;
  
  for (const entry of entries) {
    if (entry.type === 'USER_INPUT' && entry.source === 'USER_EXPLICIT') {
      // If we had a pending prompt with a response, save the pair
      if (currentPrompt && lastResponse) {
        exchanges.push({
          prompt: currentPrompt,
          response: lastResponse,
        });
      }
      currentPrompt = {
        content: extractUserContent(entry.content),
        timestamp: entry.created_at,
      };
      lastResponse = null;
    }
    
    if (entry.type === 'PLANNER_RESPONSE' && entry.source === 'MODEL' && entry.content) {
      // Keep updating lastResponse — we want the FINAL response for the prompt
      // (the last PLANNER_RESPONSE before the next USER_INPUT)
      if (currentPrompt) {
        if (!lastResponse) {
          lastResponse = {
            content: extractResponseContent(entry.content),
            timestamp: entry.created_at,
          };
        } else {
          // Append subsequent model responses (multi-turn within one prompt)
          lastResponse.content += '\n\n' + extractResponseContent(entry.content);
          lastResponse.timestamp = entry.created_at;
        }
      }
    }
  }
  
  // Don't forget the last pair
  if (currentPrompt && lastResponse) {
    exchanges.push({
      prompt: currentPrompt,
      response: lastResponse,
    });
  }
  
  return {
    sessionId: session.id,
    description: session.description,
    exchanges: exchanges,
  };
}

function formatSessionLog(sessionData) {
  if (!sessionData || sessionData.exchanges.length === 0) return null;
  
  const shortId = sessionData.sessionId.substring(0, 8);
  const firstTimestamp = sessionData.exchanges[0].prompt.timestamp;
  const lastTimestamp = sessionData.exchanges[sessionData.exchanges.length - 1].response.timestamp;
  const date = firstTimestamp.split('T')[0];
  
  // Build filename from first prompt timestamp
  const fileTs = firstTimestamp.replace(/:/g, '-').replace('T', '_').split('.')[0];
  const filename = `${fileTs}_${shortId}.md`;
  
  let output = `---
session_id: ${sessionData.sessionId}
date: ${date}
author: ${AUTHOR}
model: ${MODEL}
tool: ${TOOL}
project: ${PROJECT}
total_exchanges: ${sessionData.exchanges.length}
first_prompt_time: ${firstTimestamp}
last_prompt_time: ${lastTimestamp}
---

# Session Log - ${date}

Session: \`${shortId}\` | Project: \`${PROJECT}\` | Author: \`${AUTHOR}\`

---

`;

  for (let i = 0; i < sessionData.exchanges.length; i++) {
    const ex = sessionData.exchanges[i];
    const num = i + 1;
    
    output += `[LOG_ENTRY type=PROMPT num=${num} session=${shortId}]
timestamp: ${ex.prompt.timestamp}
model: ${MODEL}

${ex.prompt.content}


[LOG_ENTRY type=RESPONSE num=${num} session=${shortId}]
timestamp: ${ex.response.timestamp}
model: ${MODEL}

${truncateForLog(ex.response.content)}


`;
  }
  
  return { filename, content: output };
}

// Main
function main() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  console.log('Extracting real prompts/responses from Antigravity transcripts...\n');
  
  let totalExchanges = 0;
  
  for (const session of SESSIONS) {
    console.log(`Processing session: ${session.id}`);
    console.log(`  Description: ${session.description}`);
    
    const data = processSession(session);
    if (!data || data.exchanges.length === 0) {
      console.log('  → No exchanges found, skipping\n');
      continue;
    }
    
    console.log(`  → Found ${data.exchanges.length} prompt/response exchanges`);
    
    const formatted = formatSessionLog(data);
    if (formatted) {
      const outputPath = path.join(OUTPUT_DIR, formatted.filename);
      fs.writeFileSync(outputPath, formatted.content, 'utf8');
      console.log(`  → Wrote: ${formatted.filename}\n`);
      totalExchanges += data.exchanges.length;
    }
  }
  
  console.log(`\nDone. Total exchanges extracted: ${totalExchanges}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
}

main();
