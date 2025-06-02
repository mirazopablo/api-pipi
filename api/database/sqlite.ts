import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES } from './schema';

class DatabaseManager {
  private db: SQLite.SQLiteDatabase | null = null;

  async initDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync('offline_app.db');
      await this.createTables();
    }
    return this.db;
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.execAsync(CREATE_TABLES);
    console.log('Tables created successfully');
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

export const dbManager = new DatabaseManager();
export const getDatabase = () => dbManager.initDatabase();