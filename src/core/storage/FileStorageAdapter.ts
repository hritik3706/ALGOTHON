import * as fs from 'fs';
import * as path from 'path';
import { IStorageAdapter, StorageData } from './types';
import { Topic } from '../../types';

export class FileStorageAdapter implements IStorageAdapter {
  private filePath: string;
  private tempFilePath: string;
  private backupFilePath: string;
  private topicsFilePath: string;

  constructor(baseDir: string = './data') {
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    this.filePath = path.join(baseDir, 'algothon_store.json');
    this.tempFilePath = path.join(baseDir, 'algothon_store.temp.json');
    this.backupFilePath = path.join(baseDir, 'algothon_store.bak');
    this.topicsFilePath = path.join(baseDir, 'topics_seed.json');
  }

  public loadData(): StorageData | null {
    if (!fs.existsSync(this.filePath)) {
      return null;
    }

    const raw = fs.readFileSync(this.filePath, 'utf-8');
    if (!raw.trim()) return null;

    try {
      const parsed = JSON.parse(raw) as StorageData;
      if (!parsed.schema_version || !Array.isArray(parsed.problems)) {
        throw new Error('Invalid schema structure in persistent store');
      }
      return parsed;
    } catch (err) {
      // Corrupt file detected: never silently overwrite! Quarantine to corrupt file
      const timestamp = Date.now();
      const corruptPath = `${this.filePath}.corrupt_${timestamp}`;
      fs.copyFileSync(this.filePath, corruptPath);

      // Attempt backup recovery
      const backup = this.restoreBackup();
      if (backup) {
        return backup;
      }

      throw new Error(
        `Persistent store is corrupt. Quarantined as ${corruptPath}. Silent overwrite prevented.`
      );
    }
  }

  public saveData(data: StorageData): void {
    const payload = JSON.stringify(data, null, 2);

    // 1. Atomic write to temp file first
    fs.writeFileSync(this.tempFilePath, payload, 'utf-8');

    // 2. Atomic rename of temp file over primary store
    fs.renameSync(this.tempFilePath, this.filePath);
  }

  public createBackup(): void {
    if (fs.existsSync(this.filePath)) {
      fs.copyFileSync(this.filePath, this.backupFilePath);
    }
  }

  public restoreBackup(): StorageData | null {
    if (!fs.existsSync(this.backupFilePath)) return null;
    try {
      const raw = fs.readFileSync(this.backupFilePath, 'utf-8');
      const parsed = JSON.parse(raw) as StorageData;
      fs.copyFileSync(this.backupFilePath, this.filePath);
      return parsed;
    } catch {
      return null;
    }
  }

  public loadSeedTopics(): Topic[] | null {
    if (!fs.existsSync(this.topicsFilePath)) return null;
    try {
      const raw = fs.readFileSync(this.topicsFilePath, 'utf-8');
      return JSON.parse(raw) as Topic[];
    } catch {
      return null;
    }
  }

  public saveSeedTopics(topics: Topic[]): void {
    fs.writeFileSync(this.topicsFilePath, JSON.stringify(topics, null, 2), 'utf-8');
  }
}

