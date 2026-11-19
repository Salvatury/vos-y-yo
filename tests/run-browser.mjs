process.env.PORT = '4180';
process.env.TEST_URL = 'http://127.0.0.1:4180';
const { server } = await import('../scripts/serve.mjs');
if (!server.listening) await new Promise(resolve => server.once('listening', resolve));
try { await import('./browser.mjs'); }
finally { server.close(); }
