(() => {
  "use strict";

  const STORAGE_KEY = "todo-app.items.v1";

  /** @typedef {{ id: string, text: string, done: boolean, createdAt: number }} Todo */

  /** @type {Todo[]} */
  let todos = load();
  let filter = "all"; // "all" | "active" | "completed"

  const form = document.getElementById("new-todo-form");
  const input = document.getElementById("new-todo-input");
  const list = document.getElementById("todo-list");
  const emptyState = document.getElementById("empty-state");
  const summary = document.getElementById("summary");
  const activeCount = document.getElementById("active-count");
  const clearBtn = document.getElementById("clear-completed");
  const filterButtons = Array.from(document.querySelectorAll(".filters__btn"));

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (t) => t && typeof t.id === "string" && typeof t.text === "string"
      );
    } catch {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      /* storage unavailable — keep working in memory */
    }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function addTodo(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    todos.push({ id: uid(), text: trimmed, done: false, createdAt: Date.now() });
    save();
    render();
  }

  function updateText(id, text) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    const trimmed = text.trim();
    if (trimmed) {
      todo.text = trimmed;
    } else {
      todos = todos.filter((t) => t.id !== id);
    }
    save();
    render();
  }

  function toggle(id) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    todo.done = !todo.done;
    save();
    render();
  }

  function remove(id) {
    todos = todos.filter((t) => t.id !== id);
    save();
    render();
  }

  function clearCompleted() {
    todos = todos.filter((t) => !t.done);
    save();
    render();
  }

  function visibleTodos() {
    if (filter === "active") return todos.filter((t) => !t.done);
    if (filter === "completed") return todos.filter((t) => t.done);
    return todos;
  }

  function render() {
    const visible = visibleTodos();
    list.replaceChildren(...visible.map(renderItem));

    const hasAny = todos.length > 0;
    emptyState.hidden = visible.length > 0;
    emptyState.textContent = hasAny
      ? "この条件のタスクはありません"
      : "タスクはありません";

    const remaining = todos.filter((t) => !t.done).length;
    summary.textContent = `${todos.length} 件のタスク`;
    activeCount.textContent = `${remaining} 件の未完了`;
    clearBtn.disabled = !todos.some((t) => t.done);

    for (const btn of filterButtons) {
      btn.classList.toggle("is-active", btn.dataset.filter === filter);
    }
  }

  /** @param {Todo} todo */
  function renderItem(todo) {
    const li = document.createElement("li");
    li.className = "todo" + (todo.done ? " is-done" : "");
    li.dataset.id = todo.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo__checkbox";
    checkbox.checked = todo.done;
    checkbox.setAttribute("aria-label", "完了にする");
    checkbox.addEventListener("change", () => toggle(todo.id));

    const text = document.createElement("input");
    text.type = "text";
    text.className = "todo__text";
    text.value = todo.text;
    text.maxLength = 500;
    text.setAttribute("aria-label", "タスク内容");
    text.addEventListener("blur", () => updateText(todo.id, text.value));
    text.addEventListener("keydown", (e) => {
      if (e.key === "Enter") text.blur();
      if (e.key === "Escape") {
        text.value = todo.text;
        text.blur();
      }
    });

    const del = document.createElement("button");
    del.type = "button";
    del.className = "todo__delete";
    del.textContent = "×";
    del.title = "削除";
    del.setAttribute("aria-label", "削除");
    del.addEventListener("click", () => remove(todo.id));

    li.append(checkbox, text, del);
    return li;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addTodo(input.value);
    input.value = "";
    input.focus();
  });

  clearBtn.addEventListener("click", clearCompleted);

  for (const btn of filterButtons) {
    btn.addEventListener("click", () => {
      filter = btn.dataset.filter;
      render();
    });
  }

  // Keep multiple open tabs in sync.
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      todos = load();
      render();
    }
  });

  render();
})();
