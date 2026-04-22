const test = require('node:test');
const assert = require('node:assert');
const {
  rgbToHex,
  isNeutral,
  isWarm,
  pickAccent,
  chooseDominantColor,
  DEFAULT_PRIMARY,
  DEFAULT_ACCENT_WARM,
  DEFAULT_ACCENT_NEUTRAL,
} = require('../extract-brand-color');

test('rgbToHex converts rgb() to #hex', () => {
  assert.strictEqual(rgbToHex('rgb(11, 95, 174)'), '#0B5FAE');
  assert.strictEqual(rgbToHex('rgb(255, 0, 0)'), '#FF0000');
  assert.strictEqual(rgbToHex('rgb(0, 0, 0)'), '#000000');
});

test('rgbToHex returns null for non-rgb strings', () => {
  assert.strictEqual(rgbToHex('transparent'), null);
  assert.strictEqual(rgbToHex(''), null);
  assert.strictEqual(rgbToHex('#ffffff'), null);
});

test('isNeutral detects grays, whites, near-blacks', () => {
  assert.strictEqual(isNeutral('#FFFFFF'), true);
  assert.strictEqual(isNeutral('#000000'), true);
  assert.strictEqual(isNeutral('#808080'), true);
  assert.strictEqual(isNeutral('#F0F0F0'), true);
  assert.strictEqual(isNeutral('#0B5FAE'), false);
  assert.strictEqual(isNeutral('#E85D3A'), false);
});

test('isWarm detects reds/oranges/yellows', () => {
  assert.strictEqual(isWarm('#DC2626'), true);
  assert.strictEqual(isWarm('#E85D3A'), true);
  assert.strictEqual(isWarm('#F59E0B'), true);
  assert.strictEqual(isWarm('#0B5FAE'), false);
  assert.strictEqual(isWarm('#10B981'), false);
});

test('pickAccent returns orange for cool primary', () => {
  assert.strictEqual(pickAccent('#0B5FAE'), DEFAULT_ACCENT_WARM);
  assert.strictEqual(pickAccent('#10B981'), DEFAULT_ACCENT_WARM);
});

test('pickAccent returns charcoal for warm primary', () => {
  assert.strictEqual(pickAccent('#DC2626'), DEFAULT_ACCENT_NEUTRAL);
  assert.strictEqual(pickAccent('#E85D3A'), DEFAULT_ACCENT_NEUTRAL);
});

test('chooseDominantColor falls back to default when all colors neutral', () => {
  const candidates = ['#FFFFFF', '#000000', '#808080'];
  assert.strictEqual(chooseDominantColor(candidates), DEFAULT_PRIMARY);
});

test('chooseDominantColor picks most frequent non-neutral', () => {
  const candidates = ['#FFFFFF', '#0B5FAE', '#0B5FAE', '#000000', '#DC2626'];
  assert.strictEqual(chooseDominantColor(candidates), '#0B5FAE');
});

test('chooseDominantColor picks only non-neutral when tied', () => {
  const candidates = ['#FFFFFF', '#0B5FAE', '#000000'];
  assert.strictEqual(chooseDominantColor(candidates), '#0B5FAE');
});
