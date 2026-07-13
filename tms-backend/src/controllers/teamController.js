const { sql, poolPromise } = require("../config/db");

async function getAllTeams(req, res, next) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT t.*, u.name AS createdByName
      FROM tms_teams t
      LEFT JOIN tms_users u ON t.created_by = u.id
      ORDER BY t.created_at DESC
    `);

    const teams = await Promise.all(result.recordset.map(attachMembers(pool)));
    res.json(teams);
  } catch (err) {
    next(err);
  }
}

async function createTeam(req, res, next) {
  try {
    const { name, members = [] } = req.body;
    if (!name) return res.status(400).json({ message: "Team name is required" });

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("createdBy", sql.Int, req.user.id)
      .query(`
        INSERT INTO tms_teams (name, created_by)
        OUTPUT INSERTED.*
        VALUES (@name, @createdBy)
      `);

    const team = result.recordset[0];

    for (const userId of members) {
      await pool
        .request()
        .input("teamId", sql.Int, team.id)
        .input("userId", sql.Int, userId)
        .query("INSERT INTO tms_team_members (team_id, user_id) VALUES (@teamId, @userId)");
    }

    res.status(201).json(await attachMembers(pool)(team));
  } catch (err) {
    next(err);
  }
}

async function updateTeam(req, res, next) {
  try {
    const { name } = req.body;
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("name", sql.NVarChar, name)
      .query(`
        UPDATE tms_teams SET name = @name
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    if (result.recordset.length === 0) return res.status(404).json({ message: "Team not found" });
    res.json(await attachMembers(pool)(result.recordset[0]));
  } catch (err) {
    next(err);
  }
}

async function deleteTeam(req, res, next) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM tms_teams OUTPUT DELETED.id WHERE id = @id");

    if (result.recordset.length === 0) return res.status(404).json({ message: "Team not found" });
    res.json({ message: "Team deleted" });
  } catch (err) {
    next(err);
  }
}

function attachMembers(pool) {
  return async (team) => {
    const membersResult = await pool
      .request()
      .input("teamId", sql.Int, team.id)
      .query(`
        SELECT u.name FROM tms_team_members tm
        JOIN tms_users u ON tm.user_id = u.id
        WHERE tm.team_id = @teamId
      `);

    return {
      id: team.id,
      name: team.name,
      members: membersResult.recordset.map((r) => r.name),
      createdBy: team.createdByName,
    };
  };
}

module.exports = { getAllTeams, createTeam, updateTeam, deleteTeam };
