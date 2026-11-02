/**
 * TimeBlock Studio — Main Application Script
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. Constants & Default Data
  // ==========================================
  const STORAGE_KEYS = {
    BLOCKS: 'tb_safe_blocks',
    TODOS: 'tb_safe_todos',
    QUOTE: 'tb_safe_quote'
  };

  const DEFAULT_QUOTES = [
    { text: "Deep work is the ability to focus without distraction on a cognitively demanding task.", author: "Cal Newport" },
    { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
    { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" }
  ];

  // ==========================================
  // 2. Application State
  // ==========================================
  let customBlocks = [];
  let todoData = [];
  let currentQuote = DEFAULT_QUOTES[0];
  let quoteIndex = 0;
  let editingBlockId = null;

  // Timer State
  let timerDuration = 25 * 60;
  let timerRemaining = timerDuration;
  let timerInterval = null;
  let timerRunning = false;
  let activeTaskTitle = "General Study";

  // ==========================================
  // 3. DOM Cache
  // ==========================================
  const DOM = {
    // Top banner & controls
    saveStatusText: document.getElementById('save-status-text'),
    btnExport: document.getElementById('btn-export'),
    btnImportTrigger: document.getElementById('btn-import-trigger'),
    importFile: document.getElementById('import-file'),
    btnClearDay: document.getElementById('btn-clear-day'),
    btnPrint: document.getElementById('btn-print'),

    // Quote
    quoteDisplay: document.getElementById('quote-display'),
    authorDisplay: document.getElementById('author-display'),
    btnQuoteSuggest: document.getElementById('btn-quote-suggest'),
    btnQuoteCustom: document.getElementById('btn-quote-custom'),

    // Timer
    timerBox: document.getElementById('timer-box'),
    timerTaskName: document.getElementById('timer-task-name'),
    timerDisplay: document.getElementById('timer-display'),
    btnTimerToggle: document.getElementById('btn-timer-toggle'),
    btnTimerMinus: document.getElementById('btn-timer-minus'),
    btnTimerPlus: document.getElementById('btn-timer-plus'),
    btnTimerReset: document.getElementById('btn-timer-reset'),

    // Block Form
    blockCreator: document.getElementById('block-creator'),
    formHeading: document.getElementById('form-heading'),
    totalFocusTime: document.getElementById('total-focus-time'),
    btnCancelBanner: document.getElementById('btn-cancel-edit-banner'),
    startTime: document.getElementById('start-time'),
    endTime: document.getElementById('end-time'),
    taskCat: document.getElementById('task-cat'),
    taskTitle: document.getElementById('task-title'),
    taskDetails: document.getElementById('task-details'),
    btnSubmit: document.getElementById('btn-submit'),
    btnCancel: document.getElementById('btn-cancel'),
    btnInsertCheck: document.getElementById('btn-insert-check'),
    btnInsertNum: document.getElementById('btn-insert-num'),
    btnInsertBullet: document.getElementById('btn-insert-bullet'),

    // Timeline
    timelineContainer: document.getElementById('timeline-container'),

    // Todos
    taskCounter: document.getElementById('task-counter'),
    newTodoInput: document.getElementById('new-todo'),
    btnAddTodo: document.getElementById('btn-add-todo'),
    todoListContainer: document.getElementById('todo-list-container')
  };

  // ==========================================
  // 4. Persistence & Storage
  // ==========================================
  function initStoragePersistence() {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(granted => {
        if (granted) console.log("Storage persistence enabled.");
      });
    }
  }

  function loadInitialData() {
    try {
      const storedBlocks = localStorage.getItem(STORAGE_KEYS.BLOCKS);
      const storedTodos = localStorage.getItem(STORAGE_KEYS.TODOS);
      const storedQuote = localStorage.getItem(STORAGE_KEYS.QUOTE);

      customBlocks = storedBlocks !== null ? JSON.parse(storedBlocks) : [
        {
          id: 1,
          start: '09:00',
          end: '10:30',
          title: 'Deep Study Block',
          details: '[ ] Review textbook chapter\n[ ] Practice questions 1-5',
          type: 'deep'
        }
      ];

      todoData = storedTodos !== null ? JSON.parse(storedTodos) : [
        { text: 'Pick up groceries', done: false }
      ];

      if (storedQuote !== null) {
        currentQuote = JSON.parse(storedQuote);
      }
    } catch (e) {
      console.error("Error reading localStorage:", e);
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(customBlocks));
      localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todoData));
      localStorage.setItem(STORAGE_KEYS.QUOTE, JSON.stringify(currentQuote));

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      DOM.saveStatusText.innerText = `🟢 Saved Automatically at ${timeStr}`;
    } catch (e) {
      DOM.saveStatusText.innerText = `⚠️ Storage blocked by browser! Please export backup.`;
    }
  }

  function exportDataBackup() {
    const backupData = {
      blocks: customBlocks,
      todos: todoData,
      quote: currentQuote,
      date: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeblock_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importDataBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported.blocks)) customBlocks = imported.blocks;
        if (Array.isArray(imported.todos)) todoData = imported.todos;
        if (imported.quote && imported.quote.text) currentQuote = imported.quote;

        saveData();
        renderQuote();
        renderTimeline();
        renderTodos();
        alert("🎉 Backup restored successfully!");
      } catch (err) {
        alert("Invalid backup file format.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  }

  // ==========================================
  // 5. Utility Helpers
  // ==========================================
  function timeToMins(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  function formatTime12(t) {
    let [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 === 0 ? 12 : h % 12;
    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  function formatDuration(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m]));
  }

  // ==========================================
  // 6. Quote Manager
  // ==========================================
  function renderQuote() {
    DOM.quoteDisplay.innerText = `"${currentQuote.text}"`;
    DOM.authorDisplay.innerText = `— ${currentQuote.author}`;
  }

  function suggestNextQuote() {
    quoteIndex = (quoteIndex + 1) % DEFAULT_QUOTES.length;
    currentQuote = DEFAULT_QUOTES[quoteIndex];
    saveData();
    renderQuote();
  }

  function setCustomQuote() {
    const text = prompt("Enter your personal motivational motto:", currentQuote.text);
    if (!text || !text.trim()) return;
    const author = prompt("Author / Name:", "Me") || "Me";
    currentQuote = { text: text.trim(), author: author.trim() };
    saveData();
    renderQuote();
  }

  // ==========================================
  // 7. Focus Timer & Audio
  // ==========================================
  function playChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.warn("Audio unavailable:", e);
    }
  }

  function updateTimerDisplay() {
    const m = Math.floor(timerRemaining / 60);
    const s = timerRemaining % 60;
    const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    DOM.timerDisplay.innerText = formatted;
    document.title = timerRunning ? `(${formatted}) ${activeTaskTitle}` : `TimeBlock Studio`;
  }

  function toggleTimer() {
    if (timerRunning) {
      clearInterval(timerInterval);
      timerRunning = false;
      DOM.btnTimerToggle.innerText = "▶️ Resume";
      DOM.btnTimerToggle.className = "btn btn-primary";
    } else {
      timerRunning = true;
      DOM.btnTimerToggle.innerText = "⏸️ Pause";
      DOM.btnTimerToggle.className = "btn btn-secondary";

      timerInterval = setInterval(() => {
        if (timerRemaining > 0) {
          timerRemaining--;
          updateTimerDisplay();
        } else {
          clearInterval(timerInterval);
          timerRunning = false;
          DOM.btnTimerToggle.innerText = "▶️ Start Focus";
          DOM.btnTimerToggle.className = "btn btn-primary";
          playChime();
          alert(`🎉 Focus block completed: "${activeTaskTitle}"!`);
        }
      }, 1000);
    }
    updateTimerDisplay();
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerRemaining = timerDuration;
    DOM.btnTimerToggle.innerText = "▶️ Start Focus";
    DOM.btnTimerToggle.className = "btn btn-primary";
    updateTimerDisplay();
  }

  function adjustTimer(mins) {
    timerRemaining = Math.max(60, timerRemaining + mins * 60);
    timerDuration = timerRemaining;
    updateTimerDisplay();
  }

  function startFocusOnBlock(title, durationMinutes) {
    activeTaskTitle = title;
    DOM.timerTaskName.innerText = title;
    timerDuration = Math.max(60, durationMinutes * 60);
    timerRemaining = timerDuration;

    clearInterval(timerInterval);
    timerRunning = false;
    DOM.timerBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toggleTimer();
  }

  // ==========================================
  // 8. Block Scheduler & Timeline
  // ==========================================
  function insertFormattingText(prefix) {
    const ta = DOM.taskDetails;
    ta.value += (ta.value ? '\n' : '') + prefix;
    ta.focus();
  }

  function formatDetailsHTML(blockId, text) {
    if (!text || !text.trim()) return '';
    const lines = text.split('\n');
    let html = '<div class="subtasks-container">';

    lines.forEach((line, lineIndex) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('[ ]') || trimmed.startsWith('[x]')) {
        const isDone = trimmed.startsWith('[x]');
        const cleanText = trimmed.replace(/^\[[ x]\]\s*/, '');
        html += `
          <div class="subtask-item ${isDone ? 'done' : ''}">
            <input type="checkbox" ${isDone ? 'checked' : ''} data-block-id="${blockId}" data-line-index="${lineIndex}">
            <span>${escapeHtml(cleanText)}</span>
          </div>
        `;
      } else if (/^\d+\./.test(trimmed)) {
        const num = trimmed.match(/^\d+\./)[0];
        const cleanText = trimmed.replace(/^\d+\.\s*/, '');
        html += `
          <div class="subtask-item">
            <span class="subtask-number">${num}</span>
            <span>${escapeHtml(cleanText)}</span>
          </div>
        `;
      } else {
        html += `
          <div class="subtask-item note-item">
            <span>${escapeHtml(trimmed)}</span>
          </div>
        `;
      }
    });

    html += '</div>';
    return html;
  }

  function toggleSubtaskCheck(blockId, lineIndex) {
    const block = customBlocks.find(b => b.id === blockId);
    if (!block) return;
    const lines = block.details.split('\n');
    if (lines[lineIndex]) {
      if (lines[lineIndex].trim().startsWith('[ ]')) {
        lines[lineIndex] = lines[lineIndex].replace('[ ]', '[x]');
      } else if (lines[lineIndex].trim().startsWith('[x]')) {
        lines[lineIndex] = lines[lineIndex].replace('[x]', '[ ]');
      }
    }
    block.details = lines.join('\n');
    saveData();
    renderTimeline();
  }

  function renderTimeline() {
    DOM.timelineContainer.innerHTML = '';
    customBlocks.sort((a, b) => timeToMins(a.start) - timeToMins(b.start));

    let deepWorkMins = 0;

    if (customBlocks.length === 0) {
      DOM.timelineContainer.innerHTML = `
        <div class="empty-timeline-msg">
          No time blocks scheduled yet. Create your first block above!
        </div>`;
    }

    customBlocks.forEach((block, index) => {
      const startM = timeToMins(block.start);
      const endM = timeToMins(block.end);
      const duration = endM - startM;

      if (block.type === 'deep') deepWorkMins += (duration > 0 ? duration : 0);

      // Gap Indicator
      if (index > 0) {
        const prevBlock = customBlocks[index - 1];
        const prevEndM = timeToMins(prevBlock.end);
        if (startM > prevEndM) {
          const gapMins = startM - prevEndM;
          const gapEl = document.createElement('div');
          gapEl.className = 'gap-indicator';
          gapEl.innerHTML = `
            <span>⚪ Unassigned Free Space: ${formatTime12(prevBlock.end)} → ${formatTime12(block.start)}</span>
            <strong>${formatDuration(gapMins)} free</strong>
          `;
          DOM.timelineContainer.appendChild(gapEl);
        }
      }

      // Schedule Block Element
      const blockEl = document.createElement('div');
      blockEl.className = `schedule-block cat-${block.type}`;
      blockEl.innerHTML = `
        <div class="block-header">
          <div>
            <div class="block-times">
              <span>${formatTime12(block.start)} – ${formatTime12(block.end)}</span>
              <span class="block-duration">${formatDuration(duration)}</span>
            </div>
            <div class="block-main-title">${escapeHtml(block.title)}</div>
          </div>
          <div class="block-actions">
            <button type="button" class="btn btn-focus btn-focus-block" data-title="${escapeHtml(block.title)}" data-duration="${duration}">
              ▶️ Focus
            </button>
            <button type="button" class="btn-icon-action btn-edit-block" title="Edit this block" data-id="${block.id}">✏️</button>
            <button type="button" class="btn-icon-action btn-delete btn-delete-block" title="Delete block" data-id="${block.id}">&times;</button>
          </div>
        </div>
        ${formatDetailsHTML(block.id, block.details)}
      `;
      DOM.timelineContainer.appendChild(blockEl);
    });

    DOM.totalFocusTime.innerText = `${formatDuration(deepWorkMins)} Study Planned`;
  }

  function startEditBlock(id) {
    const block = customBlocks.find(b => b.id === id);
    if (!block) return;

    editingBlockId = id;
    DOM.startTime.value = block.start;
    DOM.endTime.value = block.end;
    DOM.taskCat.value = block.type;
    DOM.taskTitle.value = block.title;
    DOM.taskDetails.value = block.details || '';

    DOM.blockCreator.classList.add('is-editing');
    DOM.formHeading.innerText = "Edit Time Block";
    DOM.btnSubmit.innerText = "💾 Save Changes";
    DOM.btnCancel.style.display = "block";

    DOM.blockCreator.scrollIntoView({ behavior: 'smooth', block: 'center' });
    DOM.taskTitle.focus();
  }

  function cancelEdit() {
    editingBlockId = null;
    DOM.taskTitle.value = '';
    DOM.taskDetails.value = '';
    DOM.blockCreator.classList.remove('is-editing');
    DOM.formHeading.innerText = "Schedule a Block";
    DOM.btnSubmit.innerText = "+ Schedule This Block";
    DOM.btnCancel.style.display = "none";
  }

  function saveTimeBlock() {
    const start = DOM.startTime.value;
    const end = DOM.endTime.value;
    const title = DOM.taskTitle.value.trim();
    const details = DOM.taskDetails.value.trim();
    const type = DOM.taskCat.value;

    if (!title) {
      alert("Please write a title for this block.");
      return;
    }

    if (timeToMins(end) <= timeToMins(start)) {
      alert("End time must be later than start time!");
      return;
    }

    if (editingBlockId !== null) {
      const block = customBlocks.find(b => b.id === editingBlockId);
      if (block) {
        block.start = start;
        block.end = end;
        block.title = title;
        block.details = details;
        block.type = type;
      }
      cancelEdit();
    } else {
      customBlocks.push({
        id: Date.now(),
        start,
        end,
        title,
        details,
        type
      });
      DOM.taskTitle.value = '';
      DOM.taskDetails.value = '';
    }

    saveData();
    renderTimeline();
  }

  function deleteBlock(id) {
    if (editingBlockId === id) cancelEdit();
    customBlocks = customBlocks.filter(b => b.id !== id);
    saveData();
    renderTimeline();
  }

  // ==========================================
  // 9. Quick Errands / Todo Manager
  // ==========================================
  function renderTodos() {
    DOM.todoListContainer.innerHTML = '';
    let activeCount = 0;

    todoData.forEach((todo, idx) => {
      if (!todo.done) activeCount++;
      const li = document.createElement('li');
      li.className = `todo-item ${todo.done ? 'completed' : ''}`;
      li.innerHTML = `
        <label>
          <input type="checkbox" data-todo-index="${idx}" ${todo.done ? 'checked' : ''}>
          <span>${escapeHtml(todo.text)}</span>
        </label>
        <button type="button" class="btn-icon-action btn-delete btn-delete-todo" data-todo-index="${idx}">&times;</button>
      `;
      DOM.todoListContainer.appendChild(li);
    });

    DOM.taskCounter.innerText = `${activeCount} left`;
  }

  function addTodo() {
    const val = DOM.newTodoInput.value.trim();
    if (!val) return;
    todoData.push({ text: val, done: false });
    DOM.newTodoInput.value = '';
    saveData();
    renderTodos();
  }

  function toggleTodo(idx) {
    if (todoData[idx]) {
      todoData[idx].done = !todoData[idx].done;
      saveData();
      renderTodos();
    }
  }

  function deleteTodo(idx) {
    todoData.splice(idx, 1);
    saveData();
    renderTodos();
  }

  function resetDay() {
    if (!confirm("Are you sure you want to clear your daily schedule?")) return;
    customBlocks = [];
    todoData = [];
    cancelEdit();
    resetTimer();
    saveData();
    renderTimeline();
    renderTodos();
  }

  // ==========================================
  // 10. Event Listeners Delegation
  // ==========================================
  function attachEventListeners() {
    // Top Bar
    DOM.btnExport.addEventListener('click', exportDataBackup);
    DOM.btnImportTrigger.addEventListener('click', () => DOM.importFile.click());
    DOM.importFile.addEventListener('change', importDataBackup);
    DOM.btnClearDay.addEventListener('click', resetDay);
    DOM.btnPrint.addEventListener('click', () => window.print());

    // Quotes
    DOM.btnQuoteSuggest.addEventListener('click', suggestNextQuote);
    DOM.btnQuoteCustom.addEventListener('click', setCustomQuote);

    // Timer Controls
    DOM.btnTimerToggle.addEventListener('click', toggleTimer);
    DOM.btnTimerMinus.addEventListener('click', () => adjustTimer(-5));
    DOM.btnTimerPlus.addEventListener('click', () => adjustTimer(5));
    DOM.btnTimerReset.addEventListener('click', resetTimer);

    // Form Formatting
    DOM.btnInsertCheck.addEventListener('click', () => insertFormattingText('[ ] '));
    DOM.btnInsertNum.addEventListener('click', () => {
      const matches = DOM.taskDetails.value.match(/^\d+\./gm);
      const nextNum = matches ? matches.length + 1 : 1;
      insertFormattingText(`${nextNum}. `);
    });
    DOM.btnInsertBullet.addEventListener('click', () => insertFormattingText('• '));

    // Form Submission
    DOM.btnSubmit.addEventListener('click', saveTimeBlock);
    DOM.btnCancel.addEventListener('click', cancelEdit);
    DOM.btnCancelBanner.addEventListener('click', cancelEdit);

    // Timeline Event Delegation (Click on dynamic buttons & checkboxes)
    DOM.timelineContainer.addEventListener('click', (e) => {
      const target = e.target;

      // Start focus
      const focusBtn = target.closest('.btn-focus-block');
      if (focusBtn) {
        startFocusOnBlock(focusBtn.dataset.title, parseInt(focusBtn.dataset.duration, 10));
        return;
      }

      // Edit block
      const editBtn = target.closest('.btn-edit-block');
      if (editBtn) {
        startEditBlock(Number(editBtn.dataset.id));
        return;
      }

      // Delete block
      const deleteBtn = target.closest('.btn-delete-block');
      if (deleteBtn) {
        deleteBlock(Number(deleteBtn.dataset.id));
        return;
      }
    });

    DOM.timelineContainer.addEventListener('change', (e) => {
      if (e.target.matches('input[type="checkbox"][data-block-id]')) {
        const blockId = Number(e.target.dataset.blockId);
        const lineIndex = Number(e.target.dataset.lineIndex);
        toggleSubtaskCheck(blockId, lineIndex);
      }
    });

    // Todo Sidebar Controls
    DOM.btnAddTodo.addEventListener('click', addTodo);
    DOM.newTodoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addTodo();
    });

    DOM.todoListContainer.addEventListener('change', (e) => {
      if (e.target.matches('input[type="checkbox"][data-todo-index]')) {
        toggleTodo(Number(e.target.dataset.todoIndex));
      }
    });

    DOM.todoListContainer.addEventListener('click', (e) => {
      const delBtn = e.target.closest('.btn-delete-todo');
      if (delBtn) {
        deleteTodo(Number(delBtn.dataset.todoIndex));
      }
    });
  }

  // ==========================================
  // 11. App Initialization
  // ==========================================
  function init() {
    initStoragePersistence();
    loadInitialData();
    renderQuote();
    updateTimerDisplay();
    renderTimeline();
    renderTodos();
    attachEventListeners();
  }

  init();
});