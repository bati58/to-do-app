document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "taskflow-tasks";
  const taskForm = document.getElementById("taskForm");
  const taskInput = document.getElementById("taskInput");
  const priorityInput = document.getElementById("priorityInput");
  const dueDateInput = document.getElementById("dueDateInput");
  const tasksList = document.getElementById("tasksList");
  const emptyState = document.getElementById("emptyState");
  const searchInput = document.getElementById("searchInput");
  const toast = document.getElementById("toast");
  let tasks = readTasks();
  let activeFilter = "all";

  document.getElementById("currentDate").textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "short", month: "short", day: "numeric"
  }).format(new Date());

  function readTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function createTask(title, priority, dueDate) {
    return { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), title, priority, dueDate, completed: false, createdAt: Date.now() };
  }

  function render() {
    const query = searchInput.value.trim().toLowerCase();
    const visibleTasks = tasks.filter((task) => {
      const matchesFilter = activeFilter === "all" || (activeFilter === "completed" ? task.completed : !task.completed);
      return matchesFilter && task.title.toLowerCase().includes(query);
    });

    tasksList.replaceChildren(...visibleTasks.map(renderTask));
    emptyState.hidden = visibleTasks.length > 0;
    document.getElementById("totalCount").textContent = tasks.length;
    document.getElementById("activeCount").textContent = tasks.filter((task) => !task.completed).length;
    document.getElementById("completedCount").textContent = tasks.filter((task) => task.completed).length;
  }

  function renderTask(task) {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " completed" : ""}`;
    const check = document.createElement("button");
    check.className = "check-btn";
    check.type = "button";
    check.setAttribute("aria-label", task.completed ? "Mark task active" : "Mark task complete");
    check.innerHTML = task.completed ? '<i class="fa-solid fa-check"></i>' : "";
    check.addEventListener("click", () => updateTask(task.id, { completed: !task.completed }));

    const content = document.createElement("div");
    content.className = "task-content";
    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;
    const meta = document.createElement("div");
    meta.className = "task-meta";
    const priority = document.createElement("span");
    priority.className = `priority priority-${task.priority || "medium"}`;
    priority.textContent = `${(task.priority || "medium")[0].toUpperCase()}${(task.priority || "medium").slice(1)} priority`;
    meta.append(priority);
    if (task.dueDate) {
      const due = document.createElement("span");
      due.innerHTML = '<i class="fa-regular fa-calendar"></i> ';
      due.append(document.createTextNode(new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${task.dueDate}T00:00:00`))));
      meta.append(due);
    }
    content.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    const edit = actionButton("fa-pen", "Edit task", () => editTask(task));
    const remove = actionButton("fa-trash", "Delete task", () => deleteTask(task.id));
    remove.classList.add("delete");
    actions.append(edit, remove);
    item.append(check, content, actions);
    return item;
  }

  function actionButton(icon, label, handler) {
    const button = document.createElement("button");
    button.className = "icon-btn";
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.innerHTML = `<i class="fa-solid ${icon}"></i>`;
    button.addEventListener("click", handler);
    return button;
  }

  function updateTask(id, changes) {
    tasks = tasks.map((task) => task.id === id ? { ...task, ...changes } : task);
    saveTasks();
    render();
  }

  function editTask(task) {
    const newTitle = window.prompt("Update your task", task.title);
    if (newTitle === null) return;
    const title = newTitle.trim();
    if (!title) return showToast("Task title cannot be empty.");
    updateTask(task.id, { title });
    showToast("Task updated.");
  }

  function deleteTask(id) {
    tasks = tasks.filter((task) => task.id !== id);
    saveTasks();
    render();
    showToast("Task deleted.");
  }

  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;
    tasks.unshift(createTask(title, priorityInput.value, dueDateInput.value));
    saveTasks();
    taskForm.reset();
    render();
    showToast("Task added.");
  });

  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      document.querySelectorAll(".filter-btn").forEach((item) => item.classList.toggle("active", item === button));
      render();
    });
  });
  searchInput.addEventListener("input", render);
  document.getElementById("clearCompleted").addEventListener("click", () => {
    if (!tasks.some((task) => task.completed)) return showToast("There are no completed tasks.");
    tasks = tasks.filter((task) => !task.completed);
    saveTasks();
    render();
    showToast("Completed tasks cleared.");
  });

  render();
});
