(function () {
  'use strict';
  let store, storageError = false, busy = false, waiting = null, applying = false;
  const section = document.createElement('section');
  section.className = 'settings';
  section.setAttribute('aria-label', 'Прогресс и обновления');
  section.innerHTML = '<details><summary>Прогресс и приложение</summary><p>Прогресс хранится на этом устройстве. Сохраните копию перед сменой адреса или устройства.</p><div class="tools"><button type="button" id="exportProgress">Сохранить прогресс</button><label class="file-button">Загрузить прогресс<input id="importProgress" type="file" accept=".json,application/json"></label></div><div id="importReview" hidden><p id="importSummary"></p><p>Импорт заменит текущий прогресс. Предыдущая версия останется в резервной копии на этом устройстве.</p><button type="button" id="confirmImport">Подтвердить замену</button><button type="button" id="cancelImport">Отмена</button></div><p>На iPhone: откройте ссылку в Safari → «Поделиться» → «На экран Домой». Импортируйте копию уже внутри приложения, запущенного с новой иконки.</p><p class="muted">Версия: <span id="appVersion">4a1fa33d63610326bab1</span></p></details><p id="storageStatus" role="status" aria-live="polite"></p><div id="updateNotice" hidden><span id="updateText"></span> <button type="button" id="applyUpdate">Обновить приложение</button></div>';
  document.querySelector('main').append(section);
  const $ = id => document.getElementById(id);
  function status(text, error = false) {
    $('storageStatus').textContent = text;
    $('storageStatus').classList.toggle('storage-error', error);
  }
  function failed(error) {
    storageError = true;
    status('Прогресс не удалось прочитать или сохранить. Исходные данные не удалены. ' + error.message, true);
  }
  let questionBank = [];
  const menuButton = document.createElement('button');
  menuButton.type = 'button';
  menuButton.className = 'progress-menu-button';
  menuButton.id = 'openProgressMenu';
  menuButton.setAttribute('aria-label', 'Открыть меню прогресса');
  menuButton.setAttribute('aria-haspopup', 'dialog');
  menuButton.setAttribute('aria-controls', 'progressDrawer');
  menuButton.innerHTML = '<span aria-hidden="true">☰</span>';
  document.querySelector('.top').prepend(menuButton);
  const drawer = document.createElement('dialog');
  drawer.id = 'progressDrawer';
  drawer.className = 'progress-drawer';
  drawer.setAttribute('aria-labelledby', 'progressHeading');
  drawer.innerHTML = '<div class="drawer-heading"><div><p class="drawer-eyebrow">STAFF АКАДЕМИЯ</p><h2 id="progressHeading">Мой прогресс</h2></div><button type="button" id="closeProgressMenu" aria-label="Закрыть меню">×</button></div><p class="muted">На этом устройстве</p><p id="drawerStorageError" role="status" hidden>Данные недоступны. Проверьте сообщение об ошибке сохранения в приложении.</p><div id="drawerStats"><p class="drawer-learned"><strong id="drawerLearned">0</strong> / <span id="drawerTotal">0</span></p><p class="muted">Карточек с верным последним ответом</p><progress id="drawerMeter" max="1" value="0" aria-label="Прогресс карточек"></progress><dl class="drawer-metrics"><div><dt>Попробовано карточек</dt><dd id="drawerSeen">0</dd></div><div><dt>Пора повторить</dt><dd id="drawerDue">0</dd></div><div><dt>Ещё не открыто</dt><dd id="drawerNew">0</dd></div><div><dt>Завершено занятий*</dt><dd id="drawerSessions">0</dd></div><div><dt>Последний экзамен</dt><dd id="drawerExam">Пока нет</dd></div></dl><p id="drawerLast" class="muted">Начните тренировку — здесь появится ваша сводка.</p><p class="muted">* История хранит последние 40 занятий. Экзамены не меняют прогресс карточек.</p></div><button type="button" id="drawerBackup" class="drawer-backup">Сохранить или перенести прогресс</button><p class="muted">Прогресс сохраняется автоматически в этом браузере. Для переноса на другое устройство сохраните копию. Синхронизации между устройствами нет.</p>';
  document.querySelector('main').append(drawer);
  function refreshSummary() {
    const stats = window.StaffUI.load();
    $('drawerStorageError').hidden = !storageError;
    $('drawerStats').hidden = storageError;
    if (storageError) return;
    const cards = Object.values(stats.cards);
    const learned = cards.filter(card => card.reps > 0).length;
    const exams = stats.sessions.filter(session => session.mode === 'exam');
    $('drawerLearned').textContent = String(learned);
    $('drawerTotal').textContent = String(questionBank.length);
    $('drawerMeter').max = questionBank.length || 1;
    $('drawerMeter').value = learned;
    $('drawerSeen').textContent = String(cards.length);
    $('drawerDue').textContent = String(cards.filter(card => card.due <= Date.now()).length);
    $('drawerNew').textContent = String(Math.max(0, questionBank.length - cards.length));
    $('drawerSessions').textContent = String(stats.sessions.length);
    const exam = exams[0];
    $('drawerExam').textContent = exam ? Math.round(exam.score / Math.max(1, exam.total) * 100) + '% · ' + exam.score + '/' + exam.total : 'Пока нет';
    const last = stats.sessions[0];
    $('drawerLast').textContent = last ? 'Последнее занятие: ' + new Date(last.date).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Начните тренировку — здесь появится ваша сводка.';
  }
  menuButton.onclick = () => { refreshSummary(); drawer.showModal(); };
  $('closeProgressMenu').onclick = () => drawer.close();
  drawer.onclick = event => { if (event.target === drawer) { const rect = drawer.getBoundingClientRect(); if (event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) drawer.close(); } };
  let swipeStart = null;
  drawer.addEventListener('touchstart', event => { swipeStart = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }; }, { passive: true });
  drawer.addEventListener('touchend', event => {
    if (!swipeStart) return;
    const touch = event.changedTouches[0];
    if (swipeStart.x - touch.clientX > 70 && Math.abs(swipeStart.y - touch.clientY) < 60) drawer.close();
    swipeStart = null;
  }, { passive: true });
  $('drawerBackup').onclick = () => { drawer.close(); section.querySelector('details').open = true; $('exportProgress').focus(); };
  window.addEventListener('staff-progress-imported', () => { if (drawer.open) refreshSummary(); });
  window.addEventListener('storage', () => { if (drawer.open) refreshSummary(); });
  let importText = null;
  function clearImport() { importText = null; $('importProgress').value = ''; $('importReview').hidden = true; }
  $('exportProgress').onclick = () => {
    try {
      const text = store.exportText();
      const file = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'staff-progress-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      status('Копия прогресса подготовлена. Сохраните JSON-файл в «Файлы».');
    } catch (error) { status('Экспорт не выполнен: ' + error.message, true); }
  };
  let importSequence = 0;
  $('importProgress').onchange = async event => {
    const sequence = ++importSequence;
    importText = null; $('importReview').hidden = true;
    try {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) throw new Error('Файл слишком большой. Максимум 2 МБ.');
      const text = await file.text();
      if (sequence !== importSequence) return;
      const data = store.parseImport(text);
      importText = text;
      $('importSummary').textContent = 'В копии: ' + Object.keys(data.cards).length + ' карточек и ' + data.sessions.length + ' сессий.';
      $('importReview').hidden = false;
    } catch (error) { status('Импорт не выполнен: ' + error.message, true); }
  };
  $('cancelImport').onclick = () => { ++importSequence; clearImport(); };
  $('confirmImport').onclick = () => {
    if (!importText) return;
    try {
      store.importText(importText); storageError = false; clearImport();
      status('Прогресс загружен.');
      window.dispatchEvent(new Event('staff-progress-imported'));
    } catch (error) { status('Импорт не выполнен: ' + error.message, true); }
  };
  function updateNotice() {
    if (!waiting) { $('updateNotice').hidden = true; return; }
    $('updateNotice').hidden = false;
    $('applyUpdate').disabled = busy;
    $('updateText').textContent = busy ? 'Новая версия готова. Обновление станет доступно после завершения сессии.' : 'Готова новая версия. Прогресс сохранится.';
  }
  function applyUpdate() {
    if (!waiting || busy || applying || storageError) return;
    applying = true;
    $('applyUpdate').disabled = true;
    waiting.postMessage({ type: 'SKIP_WAITING' });
    setTimeout(() => { if (applying) { applying = false; updateNotice(); } }, 10000);
  }
  $('applyUpdate').onclick = applyUpdate;
  window.StaffUI = {
    configure(bank) {
      questionBank = bank;
      try { store = StaffProgress.createStore(localStorage, bank.map(q => q[5]), STAFF_LEGACY_IDS); }
      catch (error) { failed(error); }
    },
    load() {
      if (!store) return StaffProgress.empty();
      try { return store.load(); } catch (error) { failed(error); return StaffProgress.empty(); }
    },
    save(data) {
      if (storageError || !store) return false;
      try { store.save(data); if (drawer.open) refreshSummary(); return true; } catch (error) { failed(error); return false; }
    },
    setBusy(value) { busy = value; updateNotice(); },
    async register() {
      if (!('serviceWorker' in navigator)) { status('Офлайн-режим не поддерживается этим браузером.'); return; }
      try {
        const registration = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (applying) location.reload();
          else { waiting = registration.waiting; updateNotice(); }
        });
        const showWaiting = (atStartup = false) => {
          // First install activates on its own. Only an existing active release
          // with a distinct waiting worker represents an application update.
          if (!registration.active || !registration.waiting) return;
          waiting = registration.waiting; updateNotice();
          // Apply an already waiting release before the first answer on a new launch.
          if (atStartup && !busy) applyUpdate();
        };
        showWaiting(true);
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (worker) worker.addEventListener('statechange', () => {
            if (worker.state === 'installed') showWaiting();
            else if ((worker.state === 'activated' || worker.state === 'redundant') && waiting === worker) {
              waiting = null; updateNotice();
            }
          });
        });
        let lastCheck = 0;
        const check = () => {
          if (document.visibilityState === 'visible' && navigator.onLine && Date.now() - lastCheck > 60000) {
            lastCheck = Date.now(); registration.update().catch(() => {}); showWaiting();
          }
        };
        document.addEventListener('visibilitychange', check);
        window.addEventListener('online', check);
        check();
        if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      } catch (error) { status('Офлайн-режим пока не готов. Откройте приложение с интернетом ещё раз.', true); }
    }
  };
})();
