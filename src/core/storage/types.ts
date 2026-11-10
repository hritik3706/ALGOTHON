import { Problem, Attempt, Revision, Topic } from '../../types';

export interface StorageData {
  schema_version: number;
  problems: Problem[];
  attempts: Attempt[];
  revisions: Revision[];
  updated_at: string;
}

export interface IStorageAdapter {
  loadData(): StorageData | null;
  saveData(data: StorageData): void;
  createBackup(): void;
  restoreBackup(): StorageData | null;
  loadSeedTopics(): Topic[] | null;
  saveSeedTopics(topics: Topic[]): void;
}

