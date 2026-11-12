// Full drive details on Windows: label, type, file system, health and the physical disk
// behind it (model, SSD/HDD, NVMe/SATA/USB). Node itself can only read sizes, so the rest
// comes from Windows (CIM/WMI) via one PowerShell call (~0.7 s).
const { execFile } = require('child_process');
const fsApi = require('./fs-api');

// Queries CIM classes directly — much faster than Get-Volume / Get-PhysicalDisk,
// which load the whole Storage module (~3 s). Returns raw numbers; mapped to text below.
const PS_SCRIPT = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ns = 'root/Microsoft/Windows/Storage'
@{
  logical    = @(Get-CimInstance Win32_LogicalDisk -ErrorAction SilentlyContinue |
                 Select-Object DeviceID, VolumeName, DriveType, FileSystem, Size, FreeSpace, VolumeSerialNumber, ProviderName)
  volumes    = @(Get-CimInstance -Namespace $ns -ClassName MSFT_Volume -ErrorAction SilentlyContinue |
                 Where-Object DriveLetter | Select-Object DriveLetter, HealthStatus, AllocationUnitSize)
  partitions = @(Get-CimInstance -Namespace $ns -ClassName MSFT_Partition -ErrorAction SilentlyContinue |
                 Where-Object DriveLetter | Select-Object DriveLetter, DiskNumber)
  disks      = @(Get-CimInstance -Namespace $ns -ClassName MSFT_Disk -ErrorAction SilentlyContinue |
                 Select-Object Number, FriendlyName, BusType, PartitionStyle, Size)
  physical   = @(Get-CimInstance -Namespace $ns -ClassName MSFT_PhysicalDisk -ErrorAction SilentlyContinue |
                 Select-Object DeviceId, MediaType, HealthStatus, SerialNumber, FirmwareVersion)
} | ConvertTo-Json -Depth 3 -Compress
`;

// Codes from Microsoft docs: Win32_LogicalDisk, MSFT_Volume, MSFT_Disk, MSFT_PhysicalDisk.
const DRIVE_TYPES = { 2: 'removable', 3: 'local', 4: 'network', 5: 'cd', 6: 'ram' };
const MEDIA_TYPES = { 3: 'HDD', 4: 'SSD', 5: 'SCM' };
const PARTITION_STYLES = { 0: 'RAW', 1: 'MBR', 2: 'GPT' };
const HEALTH = { 0: 'healthy', 1: 'warning', 2: 'unhealthy' };
const BUS_TYPES = {
  1: 'SCSI', 2: 'ATAPI', 3: 'ATA', 4: 'IEEE 1394', 5: 'SSA', 6: 'Fibre Channel', 7: 'USB',
  8: 'RAID', 9: 'iSCSI', 10: 'SAS', 11: 'SATA', 12: 'SD', 13: 'MMC', 14: 'Virtual',
  15: 'File Backed Virtual', 16: 'Storage Spaces', 17: 'NVMe', 18: 'SCM', 19: 'UFS',
};

/** All drives with full details. Falls back to sizes only if Windows can't be queried. */
async function getDrives() {
  if (process.platform !== 'win32') return basicDrives();
  try {
    return buildDrives(await queryWindows());
  } catch (err) {
    console.error('Drive details unavailable, returning sizes only:', err.message);
    return basicDrives();
  }
}

function queryWindows() {
  // -EncodedCommand (UTF-16LE base64) avoids any quoting problems with the script text.
  const encoded = Buffer.from(PS_SCRIPT, 'utf16le').toString('base64');
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
      // windowsHide: no console window flashing over the app.
      { windowsHide: true, timeout: 15000, maxBuffer: 1024 * 1024, encoding: 'utf8' },
      (err, stdout) => {
        if (err) return reject(err);
        try {
          resolve(JSON.parse(stdout));
        } catch (parseErr) {
          reject(parseErr);
        }
      },
    );
  });
}

function buildDrives(raw) {
  const logical = toArray(raw.logical);
  if (logical.length === 0) throw new Error('Win32_LogicalDisk returned nothing');

  const volumes = byKey(raw.volumes, (v) => v.DriveLetter);
  const partitions = byKey(raw.partitions, (p) => p.DriveLetter);
  const disks = byKey(raw.disks, (d) => String(d.Number));
  const physical = byKey(raw.physical, (p) => String(p.DeviceId));
  const systemDrive = (process.env.SystemDrive || 'C:').toUpperCase();

  return logical.map((l) => {
    const name = l.DeviceID; // 'C:'
    const letter = name[0];
    const volume = volumes.get(letter);
    const partition = partitions.get(letter);
    const total = l.Size ?? null;
    const free = l.FreeSpace ?? null;
    const used = total !== null && free !== null ? total - free : null;

    return {
      name,
      path: `${name}\\`,
      label: l.VolumeName ?? '',
      type: DRIVE_TYPES[l.DriveType] ?? 'unknown',
      fileSystem: l.FileSystem || null,
      isReady: total !== null, // false: empty card reader / DVD drive
      isSystem: name.toUpperCase() === systemDrive,
      total,
      free,
      used,
      usedPercent: total ? Math.round((used / total) * 1000) / 10 : null,
      serialNumber: l.VolumeSerialNumber ?? null,
      clusterSize: volume?.AllocationUnitSize || null,
      health: volume ? (HEALTH[volume.HealthStatus] ?? 'unknown') : 'unknown',
      networkPath: l.ProviderName ?? null,
      disk: partition ? toDisk(partition.DiskNumber, disks, physical) : null,
    };
  });
}

function toDisk(number, disks, physical) {
  const d = disks.get(String(number));
  if (!d) return null;
  const p = physical.get(String(number));
  return {
    number,
    model: (d.FriendlyName ?? '').trim(),
    mediaType: MEDIA_TYPES[p?.MediaType] ?? 'unknown',
    busType: BUS_TYPES[d.BusType] ?? 'unknown',
    partitionStyle: PARTITION_STYLES[d.PartitionStyle] ?? 'unknown',
    size: d.Size ?? null,
    health: p ? (HEALTH[p.HealthStatus] ?? 'unknown') : 'unknown',
    serialNumber: p?.SerialNumber?.trim() || null,
    firmware: p?.FirmwareVersion?.trim() || null,
  };
}

// Fallback: sizes from Node (fs.statfs), everything else unknown.
async function basicDrives() {
  const systemDrive = (process.env.SystemDrive || 'C:').toUpperCase();
  const drives = await fsApi.listDrives();
  return drives.map((d) => ({
    ...d,
    label: '',
    type: 'unknown',
    fileSystem: null,
    isReady: true,
    isSystem: d.name.toUpperCase() === systemDrive,
    usedPercent: d.total ? Math.round((d.used / d.total) * 1000) / 10 : null,
    serialNumber: null,
    clusterSize: null,
    health: 'unknown',
    networkPath: null,
    disk: null,
  }));
}

function toArray(value) {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function byKey(list, keyOf) {
  return new Map(toArray(list).map((item) => [keyOf(item), item]));
}

module.exports = { getDrives };
