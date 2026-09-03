import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

export interface PredictionResponse {
  category: string;
  confidence: number;
  probabilities?: Record<string, number>;
}

export const predictCategory = async (
  title: string,
): Promise<PredictionResponse> => {
  try {
    const response = await axios.post<PredictionResponse>(
      `${ML_SERVICE_URL}/predict-category`,
      { title },
      { timeout: 5000 },
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "ML Service Error:",
        error.response?.data || error.message,
      );
    } else {
      console.error("ML Service Error:", error);
    }

    throw new Error("Category prediction service unavailable");
  }
};