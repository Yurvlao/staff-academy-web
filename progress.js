(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StaffProgress = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEY = 'staff-academy-v3';
  const LEGACY_KEY = 'staff-academy-v2';
  const BACKUP_KEY = 'staff-academy-v2-backup';
  const empty = () => ({ cards: {}, sessions: [] });
  const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const finite = (x, min, max) => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max;

  function validate(value, knownIds) {
    if (!object(value) || !object(value.cards) || !Array.isArray(value.sessions)) throw new Error('Неверная структура прогресса.');
    const entries = Object.entries(value.cards);
    if (entries.length > 10000 || value.sessions.length > 40) throw new Error('Превышен допустимый объём прогресса.');
    const cards = {};
    for (const [id, card] of entries) {
      if (!/^staff-\d{4,}$/.test(id) || !knownIds.has(id)) throw new Error('Файл содержит неизвестные карточки.');
      if (!object(card) || !finite(card.ease, 1.3, 3) || !finite(card.interval, 0, 3650000) ||
          !Number.isSafeInteger(card.reps) || card.reps < 0 || !Number.isSafeInteger(card.errors) || card.errors < 0 ||
          !finite(card.due, 0, 8640000000000000)) throw new Error('Повреждены данные карточки ' + id + '.');
      cards[id] = { ease: card.ease, interval: card.interval, reps: card.reps, errors: card.errors, due: card.due };
    }
    const sessions = value.sessions.map(s => {
      if (!object(s) || !['practice', 'exam'].includes(s.mode) || !Number.isSafeInteger(s.total) || s.total < 1 || s.total > 10000 ||
          !Number.isSafeInteger(s.score) || s.score < 0 || s.score > s.total || typeof s.date !== 'string' || !Number.isFinite(Date.parse(s.date))) {
        throw new Error('Повреждена история сессий.');
      }
      return { mode: s.mode, score: s.score, total: s.total, date: new Date(s.date).toISOString() };
    });
    return { cards, sessions };
  }

  function createStore(storage, ids, legacyIds) {
    const knownIds = new Set(ids);
    if (knownIds.size !== ids.length || ids.some(id => !/^staff-\d{4,}$/.test(id))) throw new Error('Ошибка идентификаторов банка.');
    function load() {
      const raw = storage.getItem(KEY);
      if (raw !== null) return validate(JSON.parse(raw), knownIds);
      const legacyRaw = storage.getItem(LEGACY_KEY);
      if (legacyRaw === null) return empty();
      const legacy = JSON.parse(legacyRaw);
      if (!object(legacy) || !object(legacy.cards) || !Array.isArray(legacy.sessions)) throw new Error('Старый прогресс повреждён. Исходные данные сохранены.');
      const cards = {};
      for (const [index, card] of Object.entries(legacy.cards)) {
        if (!/^(0|[1-9]\d*)$/.test(index) || !legacyIds[Number(index)]) throw new Error('Неизвестная версия старого банка. Нужен перенос по её карте.');
        cards[legacyIds[Number(index)]] = card;
      }
      const result = validate({ cards, sessions: legacy.sessions }, knownIds);
      // Preserve the original record. Never overwrite a prior legacy backup.
      if (storage.getItem(BACKUP_KEY) === null) storage.setItem(BACKUP_KEY, legacyRaw);
      storage.setItem(KEY, JSON.stringify(result));
      return result;
    }
    function save(value) {
      const result = validate(value, knownIds);
      storage.setItem(KEY, JSON.stringify(result));
      return result;
    }
    function exportText() {
      return JSON.stringify({ app: 'staff-academy', schemaVersion: 3, exportedAt: new Date().toISOString(), progress: load() }, null, 2);
    }
    function parseImport(text) {
      if (typeof text !== 'string' || text.length > 2 * 1024 * 1024) throw new Error('Файл слишком большой. Максимум 2 МБ.');
      const data = JSON.parse(text);
      if (!object(data) || data.app !== 'staff-academy' || data.schemaVersion !== 3) throw new Error('Это не файл прогресса STAFF версии 3.');
      return validate(data.progress, knownIds);
    }
    function importText(text) {
      const result = parseImport(text);
      // If the backup cannot be written, replacement does not start.
      const priorRaw = storage.getItem(KEY);
      if (priorRaw !== null) storage.setItem('staff-academy-before-import', priorRaw);
      const legacyRaw = storage.getItem(LEGACY_KEY);
      if (legacyRaw !== null && storage.getItem(BACKUP_KEY) === null) storage.setItem(BACKUP_KEY, legacyRaw);
      return save(result);
    }
    return { load, save, exportText, parseImport, importText };
  }
  return { KEY, LEGACY_KEY, BACKUP_KEY, empty, validate, createStore };
});
