import type { DriveInfo, DriveType } from '../../electron-api';

// `Record<DriveType, ...>`: TypeScript reports an error if a new DriveType is added without a name/icon.

/** Names Windows Explorer shows for a drive type. */
const TYPE_NAMES: Record<DriveType, string> = {
  local: 'Локальный диск',
  removable: 'USB-накопитель',
  cd: 'CD-дисковод',
  network: 'Сетевой диск',
  ram: 'RAM-диск',
  unknown: 'Диск',
};

/** Material Symbols icon for a drive type. */
const TYPE_ICONS: Record<DriveType, string> = {
  local: 'hard_drive',
  removable: 'usb',
  cd: 'album',
  network: 'lan',
  ram: 'memory',
  unknown: 'hard_drive_2',
};

export function driveTypeName(type: DriveType): string {
  return TYPE_NAMES[type];
}

export function driveTypeIcon(type: DriveType): string {
  return TYPE_ICONS[type];
}

/** Title like in Explorer: the volume label if set ('Новый том (D:)'), otherwise the type ('Локальный диск (C:)'). */
export function driveTitle(drive: DriveInfo): string {
  return `${drive.label || driveTypeName(drive.type)} (${drive.name})`;
}

const UNITS = ['байт', 'КБ', 'МБ', 'ГБ', 'ТБ'];
const NUMBER = new Intl.NumberFormat('ru-RU', { maximumSignificantDigits: 3 });

/** Size like Explorer shows it: 1024-based, 3 significant digits — '22,6 ГБ', '236 ГБ'. */
export function formatSize(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${NUMBER.format(value)} ${UNITS[unit]}`;
}
