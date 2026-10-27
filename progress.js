(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StaffProgress = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const Course = typeof module==='object'&&module.exports ? require('./course-core.js') : StaffCourse;
  const Testing = typeof module==='object'&&module.exports ? require('./testing-core.js') : StaffTesting;
  const Mix = typeof module==='object'&&module.exports ? require('./mix-core.js') : StaffMix;
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
      if (card.learning !== undefined && (!object(card.learning) || !Number.isSafeInteger(card.learning.correct) || card.learning.correct < 0 || !Array.isArray(card.learning.days) || card.learning.days.length > 30 || card.learning.days.some(d => typeof d !== 'string' || !/^\d{4}-\d{1,2}-\d{1,2}$/.test(d)) || !finite(card.learning.interval,0,3650000))) throw new Error('Повреждены сведения о повторениях. Исходные данные сохранены.');
      cards[id] = { ...card, ease: card.ease, interval: card.interval, reps: card.reps, errors: card.errors, due: card.due };
    }
    const sessions = value.sessions.map(s => {
      if (!object(s) || !['practice', 'exam'].includes(s.mode) || !Number.isSafeInteger(s.total) || s.total < 1 || s.total > 10000 ||
          !Number.isSafeInteger(s.score) || s.score < 0 || s.score > s.total || typeof s.date !== 'string' || !Number.isFinite(Date.parse(s.date))) {
        throw new Error('Повреждена история сессий.');
      }
      return { ...s, mode: s.mode, score: s.score, total: s.total, date: new Date(s.date).toISOString() };
    });
    const mixes = value.mixes;
    if (mixes !== undefined) {
      if (!object(mixes) || Object.keys(mixes).length > 500) throw new Error('Повреждены данные составов.');
      for (const [id,v] of Object.entries(mixes)) {
        if (!/^[a-z0-9-]+$/.test(id) || !object(v) || !Number.isSafeInteger(v.attempts) || v.attempts<0 || !Number.isSafeInteger(v.successes) || v.successes<0 || v.successes>v.attempts || !finite(v.due,0,8640000000000000) || !finite(v.last,0,8640000000000000) || !Number.isSafeInteger(v.reps) || v.reps<0 || !finite(v.interval,0,3650000) || !finite(v.ease,1.3,3) || !Array.isArray(v.days) || v.days.length>30 || v.days.some(d=>typeof d!=='string') || !Array.isArray(v.errors) || v.errors.length>100 || v.errors.some(e=>!object(e)||!Array.isArray(e.missing)||!Array.isArray(e.extra)||!finite(e.date,0,8640000000000000)) || !['Изучается','Закрепляется','Освоен'].includes(v.status)) throw new Error('Повреждён прогресс рецепта.');
      }
    }
    for(const v of Object.values(mixes||{}))if(v.trainingDates!==undefined&&(!Array.isArray(v.trainingDates)||v.trainingDates.length>100||v.trainingDates.some(t=>!finite(t,0,8640000000000000))))throw Error('Повреждены даты тренировок.');
    if (value.formulaHelpRead !== undefined && typeof value.formulaHelpRead !== 'boolean') throw new Error('Повреждено состояние справки.');
    const theory = value.theory===undefined ? undefined : Course.validate(value.theory);
    const testing=value.testing===undefined?undefined:Testing.validate(value.testing);
    const cocktailPractice=value.cocktailPractice===undefined?undefined:Mix.validatePractice(value.cocktailPractice);
    return { cards, sessions, ...(testing===undefined?{}:{testing}), ...(cocktailPractice===undefined?{}:{cocktailPractice}), ...(theory===undefined?{}:{theory}), ...(value.formulaHelpRead === undefined ? {} : {formulaHelpRead:value.formulaHelpRead}), ...(mixes === undefined ? {} : {mixes}) };
  }

  function createStore(storage, ids, legacyIds) {
    const knownIds = new Set(ids);
    if (knownIds.size !== ids.length || ids.some(id => !/^staff-\d{4,}$/.test(id))) throw new Error('Ошибка идентификаторов банка.');
    function load() {
      const raw = storage.getItem(KEY);
      if (raw !== null) { const result=validate(JSON.parse(raw), knownIds); if(knownIds.has('staff-0400')&&storage.getItem('staff-academy-before-bank-2026-10')===null) storage.setItem('staff-academy-before-bank-2026-10',raw); return result; }
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
      const prior = storage.getItem(KEY);
      if((result.testing!==undefined||result.cocktailPractice!==undefined)&&prior!==null&&storage.getItem('staff-academy-before-unified-v1')===null)storage.setItem('staff-academy-before-unified-v1',prior);
      if(result.theory!==undefined&&prior!==null&&storage.getItem('staff-academy-before-theory-v1')===null)storage.setItem('staff-academy-before-theory-v1',prior);
      if (prior !== null && storage.getItem('staff-academy-before-cabinet') === null) storage.setItem('staff-academy-before-cabinet', prior);
      storage.setItem(KEY, JSON.stringify(result));
      return result;
    }
    function exportText() {
      return JSON.stringify({ app: 'staff-academy', schemaVersion: 5, exportedAt: new Date().toISOString(), progress: {...load(), ...(storage.getItem('staff.mixology.formulaHelp.v1')===null?{}:{formulaHelpRead: storage.getItem('staff.mixology.formulaHelp.v1') === 'read'})} }, null, 2);
    }
    function parseImport(text) {
      if (typeof text !== 'string' || text.length > 2 * 1024 * 1024) throw new Error('Файл слишком большой. Максимум 2 МБ.');
      const data = JSON.parse(text);
      if (!object(data) || data.app !== 'staff-academy' || ![3,4,5].includes(data.schemaVersion)) throw new Error('Это не поддерживаемый файл прогресса STAFF.');
      return validate(data.progress, knownIds);
    }
    function importText(text) {
      const result = parseImport(text);
      // If the backup cannot be written, replacement does not start.
      const priorRaw = storage.getItem(KEY);
      if (priorRaw !== null) storage.setItem('staff-academy-before-import', priorRaw);
      const legacyRaw = storage.getItem(LEGACY_KEY);
      if (legacyRaw !== null && storage.getItem(BACKUP_KEY) === null) storage.setItem(BACKUP_KEY, legacyRaw);
      if (result.mixes === undefined) { try { const current = load(); if (current.mixes) result.mixes = current.mixes; } catch (_) { /* Prior raw data was backed up above; valid import can repair damaged storage. */ } }
      try { const current=load(); if(result.theory===undefined&&current.theory)result.theory=current.theory; if(current.theory?.legacyCocktailsUnlocked){result.theory=result.theory||Course.empty();result.theory.legacyCocktailsUnlocked=true;} } catch (_) { /* Prior raw record is backed up before replacement. */ }
      try {const current=load();for(const key of ['testing','cocktailPractice'])if(result[key]===undefined&&current[key]!==undefined)result[key]=current[key];if(current.testing?.passedLevels.length){result.testing=result.testing||Testing.empty();result.testing.passedLevels=[...new Set([...result.testing.passedLevels,...current.testing.passedLevels])];}}catch(_){/* Raw previous record is backed up. */}
      const saved=save(result);
      if (result.formulaHelpRead !== undefined) storage.setItem('staff.mixology.formulaHelp.v1',result.formulaHelpRead?'read':'unread');
      return saved;
    }
    function exportBackup() {
      const raw = storage.getItem('staff-academy-before-unified-v1') || storage.getItem('staff-academy-before-theory-v1') || storage.getItem('staff-academy-before-cabinet');
      if (raw === null) throw new Error('Резервной копии до обновления пока нет.');
      return JSON.stringify({app:'staff-academy',schemaVersion:3,progress:JSON.parse(raw)},null,2);
    }
    return { load, save, exportText, exportBackup, parseImport, importText };
  }
  return { KEY, LEGACY_KEY, BACKUP_KEY, empty, validate, createStore };
});
