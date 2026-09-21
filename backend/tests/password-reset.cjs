// Run after compiling backend: node --test tests/password-reset.cjs
// In-memory persistence and email doubles; no real database or email is contacted.
const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test';
process.env.JWT_ACCESS_SECRET = 'test-only-reset-secret';
process.env.JWT_REFRESH_SECRET = 'test-only-refresh-secret';
const { prisma } = require('../dist/config/prisma');
const { env } = require('../dist/config/env');
const email = require('../dist/utils/email');
const auth = require('../dist/modules/auth/auth.service');
const bcrypt = require('bcryptjs');
let user, sent, failDelivery;
function matches(where) {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'OR') return value.some(matches);
    if (value && typeof value === 'object') {
      if ('gt' in value) return user[key] && user[key] > value.gt;
      if ('lte' in value) return user[key] && user[key] <= value.lte;
      if ('lt' in value) return user[key] < value.lt;
    }
    return user[key] === value;
  });
}
prisma.user.findUnique = async ({ where }) => matches(where) ? { ...user } : null;
prisma.user.updateMany = async ({ where, data }) => {
  if (!matches(where)) return { count: 0 };
  for (const [key, value] of Object.entries(data)) user[key] = value && value.increment ? user[key] + value.increment : value;
  return { count: 1 };
};
email.sendEmail = async (_to, _subject, html) => { if (failDelivery) throw Error('provider failure'); sent.push(html.match(/<strong>(\d{6})<\/strong>/)[1]); };
function fresh() {
  env.nodeEnv = 'test'; env.resend.apiKey = '';
  user = { id: 'admin-1', email: 'admin@test.com', active: true, passwordHash: 'old', resetToken: null, resetTokenExpiresAt: null, resetCodeAttempts: 0, resetCodeSentAt: null };
  sent = []; failDelivery = false;
}
test('password reset code lifecycle and limits', async t => {
  await t.test('success hashes password and consumes code exactly once', async () => {
    fresh(); await auth.requestPasswordReset(user.email);
    assert.match(user.resetToken, /^code:[a-f0-9]{64}$/);
    assert.equal(user.resetToken.includes(sent[0]), false);
    await auth.resetPasswordWithCode(user.email, sent[0], 'NewPassword123!');
    assert.equal(await bcrypt.compare('NewPassword123!', user.passwordHash), true);
    await assert.rejects(auth.resetPasswordWithCode(user.email, sent[0], 'OtherPassword123!'));
  });
  await t.test('unknown and disabled accounts receive no code', async () => {
    fresh(); await auth.requestPasswordReset('unknown@test.com'); user.active = false;
    await auth.requestPasswordReset(user.email); assert.equal(sent.length, 0);
  });
  await t.test('expired code cannot change password', async () => {
    fresh(); await auth.requestPasswordReset(user.email); user.resetTokenExpiresAt = new Date(0);
    await assert.rejects(auth.resetPasswordWithCode(user.email, sent[0], 'NewPassword123!')); assert.equal(user.passwordHash, 'old');
  });
  await t.test('parallel guesses cannot exceed five attempts', async () => {
    fresh(); await auth.requestPasswordReset(user.email);
    await Promise.allSettled(Array.from({ length: 12 }, () => auth.resetPasswordWithCode(user.email, '000000', 'NewPassword123!')));
    assert.equal(user.resetCodeAttempts, 5);
    await assert.rejects(auth.resetPasswordWithCode(user.email, sent[0], 'NewPassword123!'));
  });
  await t.test('resends are throttled and old challenge is replaced', async () => {
    fresh(); await auth.requestPasswordReset(user.email); const oldHash = user.resetToken;
    await auth.requestPasswordReset(user.email); assert.equal(sent.length, 1);
    user.resetCodeSentAt = new Date(0); await auth.requestPasswordReset(user.email);
    assert.equal(sent.length, 2); assert.notEqual(user.resetToken, oldHash);
  });
  await t.test('concurrent correct requests permit only one password update', async () => {
    fresh(); await auth.requestPasswordReset(user.email);
    const results = await Promise.allSettled([auth.resetPasswordWithCode(user.email, sent[0], 'NewPassword123!'), auth.resetPasswordWithCode(user.email, sent[0], 'OtherPassword123!')]);
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  });
  await t.test('delivery failure clears challenge; production requires email configuration', async () => {
    fresh(); failDelivery = true; await auth.requestPasswordReset(user.email); assert.equal(user.resetToken, null);
    env.nodeEnv = 'production'; await assert.rejects(auth.requestPasswordReset('unknown@test.com'), /temporarily unavailable/);
  });
  await t.test('stored code hash cannot be used on legacy link endpoint', async () => {
    fresh(); await auth.requestPasswordReset(user.email);
    await assert.rejects(auth.resetPassword(user.resetToken, 'NewPassword123!'));
  });
});
