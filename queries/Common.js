import pool from "../db.config/index.js";


export const getSingleRow = async (tableName, condition) => {
    const query = `SELECT * FROM ${tableName} WHERE ${condition.column} = $1`;
    const result = await pool.query(query, [condition.value]);
    return result.rows;
  };
export const getAllRows = async (tableName) => {
    const query = `SELECT * FROM ${tableName} ORDER BY ${tableName}.id`;
    const result = await pool.query(query);
    return result.rows;
  };
  