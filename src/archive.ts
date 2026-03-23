const ARCHIVES_KEY = "vsvgcode-archives";
const DRAFT_KEY = "vsvgcode-draft";

export interface Archive {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

function readArchives(): Archive[] {
  try {
    const raw = localStorage.getItem(ARCHIVES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeArchives(archives: Archive[]) {
  try {
    localStorage.setItem(ARCHIVES_KEY, JSON.stringify(archives));
  } catch {
    alert("localStorage is full. Could not save archives.");
  }
}

export function getAll(): Archive[] {
  return readArchives().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function save(name: string, content: string): Archive {
  const archives = readArchives();
  const entry: Archive = {
    id: Date.now().toString(36),
    name,
    content,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  archives.push(entry);
  writeArchives(archives);
  return entry;
}

export function remove(id: string) {
  const archives = readArchives().filter((a) => a.id !== id);
  writeArchives(archives);
}

export function saveDraft(content: string) {
  try {
    localStorage.setItem(DRAFT_KEY, content);
  } catch {
    // ignore quota errors for drafts
  }
}

export function loadDraft(): string | null {
  return localStorage.getItem(DRAFT_KEY);
}
