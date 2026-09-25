import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const serverPath = fileURLToPath(new URL('../src/server.js', import.meta.url));

/**
 * Starts the server in a child process on a free port.
 * @param {Record<string, string>} env e.g. DB_PATH and API_TOKEN
 * @returns {Promise<{ url: string, stop: () => Promise<void> }>}
 */
export async function startServer(env) {
  const child = spawn(process.execPath, [serverPath], {
    env: { ...process.env, TRUST_PROXY: '', ...env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  const port = await new Promise((resolve, reject) => {
    child.stdout.setEncoding('utf8').on('data', (chunk) => {
      output += chunk;
      const match = /listening on port (\d+)/.exec(output);
      if (match) resolve(Number(match[1]));
    });
    child.stderr.setEncoding('utf8').on('data', (chunk) => (output += chunk));
    child.once('exit', (code) => reject(new Error(`Server exited with code ${code}:\n${output}`)));
  });

  return {
    url: `http://127.0.0.1:${port}`,
    async stop() {
      if (child.exitCode !== null || child.signalCode !== null) return;
      const exited = once(child, 'exit');
      child.kill('SIGTERM');
      await exited;
    },
  };
}

/**
 * Returns a function that sends a request to `baseUrl` and reads the whole response.
 * @param {string} baseUrl
 * @param {{ forwardedFor?: () => string }} [options] sets X-Forwarded-For on every request
 */
export function apiClient(baseUrl, { forwardedFor } = {}) {
  return async function request(method, path, { body, token, headers = {} } = {}) {
    const response = await fetch(baseUrl + path, {
      method,
      redirect: 'manual',
      headers: {
        ...(token !== undefined && { authorization: `Bearer ${token}` }),
        ...(forwardedFor && { 'x-forwarded-for': forwardedFor() }),
        ...headers,
      },
      body: body === undefined || typeof body === 'string' ? body : JSON.stringify(body),
    });
    const text = await response.text();
    return {
      status: response.status,
      headers: response.headers,
      text,
      body: text === '' ? undefined : JSON.parse(text),
    };
  };
}
