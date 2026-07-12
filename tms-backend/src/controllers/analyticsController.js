const analyticsService = require("../services/analyticsService");

async function getCompletionRate(req, res, next) {
  try {
    const weeks = Number(req.query.weeks) || 6;
    res.json(await analyticsService.getCompletionRate(weeks));
  } catch (err) {
    next(err);
  }
}

async function getOverdue(req, res, next) {
  try {
    res.json(await analyticsService.getOverdueMetrics());
  } catch (err) {
    next(err);
  }
}

async function getProductivity(req, res, next) {
  try {
    res.json(await analyticsService.getProductivityByUser());
  } catch (err) {
    next(err);
  }
}

async function getWorkload(req, res, next) {
  try {
    res.json(await analyticsService.getWorkloadDistribution());
  } catch (err) {
    next(err);
  }
}

module.exports = { getCompletionRate, getOverdue, getProductivity, getWorkload };
