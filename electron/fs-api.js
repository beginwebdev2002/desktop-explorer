// File-system helpers for the Explorer. Plain Node.js (no Electron imports),
// so they can be tested with `node`. main.js exposes them to Angular via IPC.
const fs = require('fs/promises');
const path = require('path');

/** Drives (C:\, D:\, ...) with total / free / used space in bytes. */
async function listDrives() {
  const roots =
    process.platform === 'win32'
      ? [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((letter) => `${letter}:\\`)
      : ['/'];

  const drives = await Promise.all(
    roots.map(async (root) => {
      try {
        const s = await fs.statfs(root);
        const total = s.blocks * s.bsize;
        const free = s.bavail * s.bsize;
        return { name: root.replace(/\\$/, ''), path: root, total, free, used: total - free };
      } catch {
        return null; // no such drive, or an empty card reader / DVD drive
      }
    }),
  );
  return drives.filter(Boolean);
}

/** One level of a folder: its entries plus the parent path (null at a drive root). */
async function readDir(dirPath) {
  const dir = path.resolve(dirPath);
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const entries = await Promise.all(dirents.map((dirent) => toEntry(dir, dirent)));
  entries.sort(foldersFirstThenName);

  const parent = path.dirname(dir);
  return { path: dir, parent: parent === dir ? null : parent, entries };
}

async function toEntry(dir, dirent) {
  const fullPath = path.join(dir, dirent.name);
  let stat = null;
  try {
    stat = await fs.stat(fullPath); // follows symlinks / junctions
  } catch {
    // Locked or protected item (pagefile.sys, broken link): keep it, just without details.
  }
  const isDirectory = stat ? stat.isDirectory() : dirent.isDirectory();

  return {
    name: dirent.name,
    path: fullPath,
    isDirectory,
    isSymlink: dirent.isSymbolicLink(),
    extension: isDirectory ? '' : path.extname(dirent.name).slice(1).toLowerCase(),
    size: isDirectory || !stat ? null : stat.size,
    modified: stat ? stat.mtimeMs : null,
    created: stat ? stat.birthtimeMs : null,
  };
}

// Same order as Windows Explorer: folders first, then natural sort ("file2" before "file10").
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
function foldersFirstThenName(a, b) {
  return Number(b.isDirectory) - Number(a.isDirectory) || collator.compare(a.name, b.name);
}

module.exports = { listDrives, readDir };
