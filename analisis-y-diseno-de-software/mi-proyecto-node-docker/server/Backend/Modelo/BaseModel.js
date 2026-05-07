import pool from '../../db.js';

export default class BaseModel {
  constructor(db = pool) {
    this.db = db;
  }

  query(sql, params = []) {
    return this.db.query(sql, params);
  }
}
