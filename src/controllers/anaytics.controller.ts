const analyticsService = require("./analytics.service");

const predictCategory = async (req, res, next) => {
  try {
    const { title } = req.body;

    const result =
      await analyticsService.getCategoryPrediction(title);

    res.status(200).json({
      success: true,
      message: "Category predicted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  predictCategory,
};