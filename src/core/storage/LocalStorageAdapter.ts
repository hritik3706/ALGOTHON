import { IStorageAdapter, StorageData } from './types';
import { Topic } from '../../types';

export class LocalStorageAdapter implements IStorageAdapter {
  private primaryKey = 'algothon_userdata_v1';
  private stagingKey = 'algothon_userdata_v1_staging';
  private backupKey = 'algothon_userdata_v1_bak';
  private topicsKey = 'algothon_seed_topics_v1';

  public loadData(): StorageData | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const raw = localStorage.getItem(this.primaryKey);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as StorageData;
      if (!parsed.schema_version || !Array.isArray(parsed.problems)) {
        throw new Error('Invalid schema structure in local storage');
      }
      return parsed;
    } catch (err) {
      // Corrupt store detected: isolate corrupt data safely
      const timestamp = Date.now();
      localStorage.setItem(`algothon_corrupt_${timestamp}`, raw);
      console.error(
        `Corrupt store detected and safely quarantined as algothon_corrupt_${timestamp}`,
        err
      );

      // Attempt recovery from backup
      const backup = this.restoreBackup();
      if (backup) {
        console.warn('Recovered successfully from last safe backup.');
        return backup;
      }

      throw new Error(
        'Persistent store is corrupt. A recovery snapshot was quarantined. Store was not overwritten.'
      );
    }
  }

  public saveData(data: StorageData): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    const payload = JSON.stringify(data);

    // Atomic write via staging key
    localStorage.setItem(this.stagingKey, payload);

    // Verify integrity of staged data
    const verification = localStorage.getItem(this.stagingKey);
    if (verification !== payload) {
      throw new Error('Staging write verification failed during atomic commit');
    }

    // Commit staging data to primary store
    localStorage.setItem(this.primaryKey, payload);
    localStorage.removeItem(this.stagingKey);
  }

  public createBackup(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const current = localStorage.getItem(this.primaryKey);
    if (current) {
      localStorage.setItem(this.backupKey, current);
    }
  }

  public restoreBackup(): StorageData | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const backupRaw = localStorage.getItem(this.backupKey);
    if (!backupRaw) return null;

    try {
      const parsed = JSON.parse(backupRaw) as StorageData;
      localStorage.setItem(this.primaryKey, backupRaw);
      return parsed;
    } catch {
      return null;
    }
  }

  public loadSeedTopics(): Topic[] | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = localStorage.getItem(this.topicsKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Topic[];
    } catch {
      return null;
    }
  }

  public saveSeedTopics(topics: Topic[]): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(this.topicsKey, JSON.stringify(topics));
  }
}

