import initSqlJs from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { databasePlans } from '../../config/catalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wasmPath = path.resolve(__dirname, '../../node_modules/sql.js/dist');

const SELECT_STATEMENT_REGEX = /^\s*select\b[\s\S]*$/i;

class DatabaseService {
  constructor(SQL, planDefinitions) {
    this.SQL = SQL;
    this.planDefinitions = planDefinitions;
    this.instances = new Map();
  }

  listPlans() {
    return this.planDefinitions.map((plan) => ({
      id: plan.id,
      name: plan.name,
      headline: plan.headline,
      priceUsd: plan.priceUsd,
      capacity: plan.capacity,
      description: plan.description,
      pitch: plan.pitch,
      features: plan.features,
      context: plan.context,
      sampleQueries: plan.sampleQueries
    }));
  }

  getPlan(planId) {
    return this.planDefinitions.find((plan) => plan.id === planId) ?? null;
  }

  ensureInstance(planId) {
    if (!this.instances.has(planId)) {
      const plan = this.getPlan(planId);
      if (!plan) {
        throw new Error(`Unknown plan: ${planId}`);
      }
      const db = new this.SQL.Database();
      try {
        db.run('PRAGMA foreign_keys = ON');
      } catch (error) {
        const message =
          error instanceof Error
            ? `Failed to enable foreign key enforcement: ${error.message}`
            : 'Failed to enable foreign key enforcement.';
        throw new Error(message);
      }

      plan.sql.schema.forEach((statement) => {
        db.run(statement);
      });
      plan.sql.seed.forEach((statement) => {
        db.run(statement);
      });
      this.instances.set(planId, db);
    }
    return this.instances.get(planId);
  }

  runReadOnlyQuery(planId, sql, options = {}) {
    const { explain = false } = options;
    if (typeof sql !== 'string' || sql.trim() === '') {
      throw new Error('SQL must be a non-empty string.');
    }

    if (!SELECT_STATEMENT_REGEX.test(sql)) {
      throw new Error('Only read-only SELECT statements are allowed.');
    }

    if (sql.includes(';') && sql.trim().split(';').filter(Boolean).length > 1) {
      throw new Error('Multiple statements per request are not supported.');
    }

    const db = this.ensureInstance(planId);
    try {
      const statement = explain ? `EXPLAIN QUERY PLAN ${sql}` : sql;
      const resultSets = db.exec(statement);
      if (!resultSets.length) {
        return { columns: [], rows: [] };
      }
      const [result] = resultSets;
      return {
        columns: result.columns,
        rows: result.values
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to execute query.';
      throw new Error(message);
    }
  }
}

export async function createDatabaseService() {
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(wasmPath, file)
  });
  return new DatabaseService(SQL, databasePlans);
}
