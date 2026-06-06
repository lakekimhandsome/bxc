const crypto = require('crypto');

const MIN_PASSWORD_LENGTH = 4;
const MAX_PASSWORD_LENGTH = 32;

function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('비밀번호를 입력해주세요.');
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(`비밀번호는 ${MIN_PASSWORD_LENGTH}~${MAX_PASSWORD_LENGTH}자여야 합니다.`);
  }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
}

module.exports = {
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  validatePassword,
  hashPassword,
  verifyPassword,
};
