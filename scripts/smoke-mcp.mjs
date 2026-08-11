import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
);
const entrypoint = fileURLToPath(new URL('../build/index.js', import.meta.url));

const child = spawn(process.execPath, [entrypoint], {
  env: {
    ...process.env,
    AI_PROVIDER: 'vertex',
    GOOGLE_CLOUD_PROJECT: 'mcp-smoke-test',
  },
  stdio: ['pipe', 'pipe', 'pipe'],
});

let stdout = '';
let stderr = '';
let initialized = false;
let finished = false;

const timeout = setTimeout(() => {
  fail('Timed out waiting for MCP responses.');
}, 10_000);

function stop() {
  clearTimeout(timeout);
  child.kill('SIGTERM');
}

function fail(message) {
  if (finished) return;
  finished = true;
  console.error(message);
  if (stdout) console.error(`stdout:\n${stdout}`);
  if (stderr) console.error(`stderr:\n${stderr}`);
  process.exitCode = 1;
  child.kill('SIGKILL');
}

function send(message) {
  child.stdin.write(`${JSON.stringify(message)}\n`);
}

child.stderr.on('data', (chunk) => {
  stderr += chunk;
});

child.stdout.on('data', (chunk) => {
  stdout += chunk;
  const completeLines = stdout.endsWith('\n')
    ? stdout.trimEnd().split('\n')
    : stdout.split('\n').slice(0, -1);

  let messages;
  try {
    messages = completeLines.filter(Boolean).map((line) => JSON.parse(line));
  } catch (error) {
    fail(`Server wrote non-JSON data to stdout: ${error.message}`);
    return;
  }

  const initializeResponse = messages.find((message) => message.id === 1);
  if (initializeResponse && !initialized) {
    const actualVersion = initializeResponse.result?.serverInfo?.version;
    if (actualVersion !== packageJson.version) {
      fail(`Expected server version ${packageJson.version}, received ${actualVersion}.`);
      return;
    }

    initialized = true;
    send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  }

  const toolsResponse = messages.find((message) => message.id === 2);
  if (!toolsResponse || finished) return;

  const toolCount = toolsResponse.result?.tools?.length;
  if (toolCount !== 7) {
    fail(`Expected 7 tools, received ${toolCount}.`);
    return;
  }

  finished = true;
  console.log(
    `MCP smoke test passed: ${packageJson.name}@${packageJson.version}, ${toolCount} tools, protocol-clean stdout.`
  );
  stop();
});

child.on('error', (error) => {
  fail(`Could not start MCP server: ${error.message}`);
});

child.on('exit', (code, signal) => {
  clearTimeout(timeout);
  if (!finished && code !== 0 && signal !== 'SIGTERM') {
    fail(`MCP server exited before the test completed (code ${code}, signal ${signal}).`);
  }
});

send({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'mcp-smoke-test', version: '1.0.0' },
  },
});
