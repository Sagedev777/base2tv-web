import test from 'node:test';
import assert from 'node:assert/strict';

import { getDbConfigStatus } from '../db.js';

test('flags incomplete production database settings', () => {
  const status = getDbConfigStatus({
    DB_HOST: 'localhost',
    DB_USER: 'user',
    DB_PASS: 'CHANGE_THIS_TO_YOUR_CPANEL_DB_PASSWORD',
    DB_NAME: '',
  });

  assert.equal(status.isConfigured, false);
  assert.ok(status.missing.includes('DB_PASS'));
  assert.ok(status.missing.includes('DB_NAME'));
});

test('accepts a complete database config', () => {
  const status = getDbConfigStatus({
    DB_HOST: 'localhost',
    DB_USER: 'user',
    DB_PASS: 'secret',
    DB_NAME: 'app_db',
  });

  assert.equal(status.isConfigured, true);
  assert.deepEqual(status.missing, []);
});
