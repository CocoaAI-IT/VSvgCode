
import type { Archive } from "./archive";

export interface ArchivePanelCallbacks {
  onSave: (name: string) => void;
  onLoad: (archive: Archive) => void;
  onDelete: (id: string) => void;
}

let panel: HTMLElement;
let listContainer: HTMLElement;
let nameInput: HTMLInputElement;
let callbacks: ArchivePanelCallbacks;

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function createArchivePanel(cb: ArchivePanelCallbacks): HTMLElement {
  callbacks = cb;

  panel = document.createElement("div");
  panel.id = "archive-panel";

  // Header
  const header = document.createElement("div");
  header.className = "archive-header";
  const title = document.createElement("h3");
  title.textContent = "Archives";
  const closeBtn = document.createElement("button");
  closeBtn.className = "archive-close";
  closeBtn.textContent = "\u00d7";
  closeBtn.addEventListener("click", closePanel);
  header.appendChild(title);
  header.appendChild(closeBtn);

  // Save row
  const saveRow = document.createElement("div");
  saveRow.className = "archive-save-row";
  nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "Archive name...";
  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";
  saveBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.classList.add("input-error");
      setTimeout(() => nameInput.classList.remove("input-error"), 600);
      return;
    }
    callbacks.onSave(name);
    nameInput.value = "";
  });
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveBtn.click();
  });
  saveRow.appendChild(nameInput);
  saveRow.appendChild(saveBtn);

  // List
  listContainer = document.createElement("div");
  listContainer.className = "archive-list";

  panel.appendChild(header);
  panel.appendChild(saveRow);
  panel.appendChild(listContainer);

  return panel;
}

export function renderList(archives: Archive[]) {
  listContainer.innerHTML = "";
  if (archives.length === 0) {
    const empty = document.createElement("div");
    empty.className = "archive-empty";
    empty.textContent = "No archives yet";
    listContainer.appendChild(empty);
    return;
  }
  for (const archive of archives) {
    const item = document.createElement("div");
    item.className = "archive-item";

    const info = document.createElement("div");
    info.className = "archive-info";
    const name = document.createElement("div");
    name.className = "archive-name";
    name.textContent = archive.name;
    const date = document.createElement("div");
    date.className = "archive-date";
    date.textContent = formatDate(archive.updatedAt);
    info.appendChild(name);
    info.appendChild(date);

    const actions = document.createElement("div");
    actions.className = "archive-actions";
    const loadBtn = document.createElement("button");
    loadBtn.textContent = "Load";
    loadBtn.addEventListener("click", () => callbacks.onLoad(archive));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "archive-delete-btn";
    deleteBtn.textContent = "Delete";
    let confirmPending = false;
    deleteBtn.addEventListener("click", () => {
      if (!confirmPending) {
        confirmPending = true;
        deleteBtn.textContent = "Confirm?";
        deleteBtn.classList.add("confirm");
        setTimeout(() => {
          confirmPending = false;
          deleteBtn.textContent = "Delete";
          deleteBtn.classList.remove("confirm");
        }, 2000);
      } else {
        callbacks.onDelete(archive.id);
      }
    });

    actions.appendChild(loadBtn);
    actions.appendChild(deleteBtn);
    item.appendChild(info);
    item.appendChild(actions);
    listContainer.appendChild(item);
  }
}

export function openPanel() {
  panel.classList.add("open");
  nameInput.focus();
}

export function closePanel() {
  panel.classList.remove("open");
}

export function togglePanel() {
  if (panel.classList.contains("open")) {
    closePanel();
  } else {
    openPanel();
  }
}
