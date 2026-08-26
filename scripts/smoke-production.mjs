import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { OAuth2Client } from 'google-auth-library';
import { parse } from 'espree';

const DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbzPMDvCufvzEEzwXh5gTX6qQLyEYWzxrCzpFdn4LU1HpgivOmlpn-VxZK6dx5T_ln8C/exec?_smoke=1';
const targetUrl = process.argv[2] || DEFAULT_URL;
const credentials = JSON.parse(await readFile(join(homedir(), '.clasprc.json'), 'utf8')).tokens?.default;
if (!credentials) throw new Error('Không tìm thấy phiên clasp để kiểm tra production.');

const client = new OAuth2Client(credentials.client_id, credentials.client_secret);
client.setCredentials(credentials);
const accessToken = await client.getAccessToken();
const response = await fetch(targetUrl, {
  headers: { Authorization: `Bearer ${accessToken.token}` },
  redirect: 'follow'
});
if (!response.ok) throw new Error(`Production trả HTTP ${response.status}.`);
const outerHtml = await response.text();
const outerScripts = extractScripts(outerHtml);
const initScript = outerScripts.find(code => code.includes('goog.script.init(') && code.includes('userHtml'));
const initStart = initScript?.indexOf('goog.script.init(') ?? -1;
const initLiteral = initStart >= 0 ? readStringLiteral(initScript, initStart + 'goog.script.init('.length) : '';
if (!initLiteral) throw new Error('Không đọc được cấu hình sandbox production.');
const initJson = vm.runInNewContext(initLiteral);
const sandboxConfig = JSON.parse(initJson);
if (sandboxConfig.sandboxMode !== 'IFRAME_SANDBOX') throw new Error(`Sandbox production không hợp lệ: ${sandboxConfig.sandboxMode}.`);
for (const functionName of ['getSessionContext', 'bootstrap']) {
  if (!sandboxConfig.functionNames?.includes(functionName)) throw new Error(`Production thiếu RPC ${functionName}.`);
}
const deploymentId = targetUrl.match(/\/s\/([^/]+)\/exec/)?.[1];
if (deploymentId && sandboxConfig.deploymentId !== deploymentId) throw new Error('Deployment ID trong sandbox không khớp URL kiểm tra.');
const userHtml = sandboxConfig.userHtml;
if (!userHtml.includes('Client ES5 đã được chèn')) throw new Error('Production chưa chèn Client ES5.');

const scripts = extractScripts(userHtml);
scripts.forEach(code => parse(code, { ecmaVersion: 5, sourceType: 'script' }));
if (scripts.length !== 3) throw new Error(`Không nhận diện đủ 3 script FINDEBT; tìm thấy ${scripts.length}.`);

const elements = new Map();
const windowEvents = new Map();
const documentEvents = new Map();
const registerEvent = (registry, name, handler) => {
  if (!registry.has(name)) registry.set(name, []);
  registry.get(name).push(handler);
};
const dispatchEvent = (registry, name) => (registry.get(name) || []).forEach(handler => handler({ type: name }));
const makeElement = id => ({
  id,
  hidden: false,
  innerHTML: '',
  textContent: '',
  value: '',
  dataset: {},
  style: { setProperty() {} },
  classList: { add() {}, remove() {}, toggle() {} },
  append() {},
  remove() {},
  insertAdjacentHTML() {},
  querySelector() { return null; },
  querySelectorAll() { return []; },
  addEventListener() {},
  setAttribute() {},
  focus() {}
});
const element = id => {
  if (!elements.has(id)) elements.set(id, makeElement(id));
  return elements.get(id);
};
const document = {
  body: element('body'),
  documentElement: element('html'),
  readyState: 'loading',
  getElementById: element,
  querySelector(selector) { return selector.startsWith('#') ? element(selector.slice(1)) : null; },
  querySelectorAll() { return []; },
  addEventListener(name, handler) { registerEvent(documentEvents, name, handler); },
  createElement(tag) { return element(`created-${tag}`); }
};

let successHandler = null;
let failureHandler = null;
const bootstrapData = {
  config: { TEN_DOANH_NGHIEP: 'FINDEBT Smoke Test', THEME: 'dark' },
  workspace: {
    workspaceId: 'WS-SMOKE', email: 'smoke@findebt.local', role: 'OWNER',
    spreadsheetUrl: '#sheet', rootFolderUrl: '#drive'
  },
  members: [{ email: 'smoke@findebt.local', role: 'OWNER' }],
  partners: [],
  documents: [],
  dashboard: {
    kpis: { receivable: 0, payable: 0, net: 0, overdue: 0 },
    aging: { TRONG_HAN: 0, QUA_HAN_1_30: 0, QUA_HAN_31_60: 0, QUA_HAN_TREN_60: 0 },
    overdue: [], dueSoon: [], promises: { today: [], upcoming: [], late: [] }
  },
  bankAccounts: [],
  promises: [],
  health: null,
  performance: { bootstrapMs: 1, cacheHit: false, dataVersion: 1 }
};
const runner = new Proxy({}, {
  get(_target, property) {
    if (property === 'withSuccessHandler') return handler => { successHandler = handler; return runner; };
    if (property === 'withFailureHandler') return handler => { failureHandler = handler; return runner; };
    return () => {
      try {
        if (property === 'getSessionContext') successHandler?.({ connected: true, email: 'smoke@findebt.local' });
        else if (property === 'bootstrap') successHandler?.(bootstrapData);
        else if (property === 'loadWorkspaceHealth') successHandler?.({ health: null });
        else successHandler?.({ ok: true });
      }
      catch (error) { failureHandler?.(error); }
      return runner;
    };
  }
});

const runtime = {
  console,
  document,
  google: { script: { run: runner } },
  location: { protocol: 'https:', href: targetUrl, pathname: '/exec', search: '', hash: '' },
  history: { state: null, replaceState() {}, pushState() {} },
  navigator: { userAgent: 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36' },
  URL,
  URLSearchParams,
  Intl,
  Promise,
  Map,
  Date,
  JSON,
  Math,
  Object,
  Array,
  String,
  Number,
  RegExp,
  Error,
  Proxy,
  MutationObserver: class {
    observe() {}
    disconnect() {}
  },
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  confirm: () => true,
  addEventListener(name, handler) { registerEvent(windowEvents, name, handler); },
  scrollTo() {},
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }
};
runtime.window = runtime;
runtime.globalThis = runtime;
const context = vm.createContext(runtime);
scripts.forEach(code => new vm.Script(code).runInContext(context));
document.readyState = 'interactive';
dispatchEvent(documentEvents, 'DOMContentLoaded');
document.readyState = 'complete';
dispatchEvent(windowEvents, 'load');
await new Promise(resolve => setTimeout(resolve, 25));

const app = element('app');
const dashboard = element('page-dashboard');
if (app.hidden || !dashboard.innerHTML.includes('Bảng điều khiển')) {
  throw new Error(`Client không render được dashboard. Trạng thái: ${element('startup-status').textContent || 'trống'}`);
}
console.log(`Production smoke OK: HTTP ${response.status}, ${scripts.length} script FINDEBT đạt ES5, session + bootstrap RPC và dashboard hoạt động.`);

function extractScripts(source) {
  const result = [];
  let cursor = 0;
  while ((cursor = source.indexOf('<script', cursor)) >= 0) {
    const start = source.indexOf('>', cursor) + 1;
    const end = source.indexOf('</script>', start);
    if (start <= 0 || end < 0) break;
    const code = source.slice(start, end).trim();
    if (code) result.push(code);
    cursor = end + '</script>'.length;
  }
  return result;
}

function readStringLiteral(source, start) {
  const quote = source[start];
  if (quote !== '"' && quote !== "'") return '';
  let escaped = false;
  for (let index = start + 1; index < source.length; index += 1) {
    const char = source[index];
    if (!escaped && char === quote) return source.slice(start, index + 1);
    if (!escaped && char === '\\') escaped = true;
    else escaped = false;
  }
  return '';
}
