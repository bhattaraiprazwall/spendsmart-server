const {
  predictCategory,
} = require("./algorithms/categoryPrediction");

const getCategoryPrediction = async (title) => {
  return predictCategory(title);
};

module.exports = {
  getCategoryPrediction,
};