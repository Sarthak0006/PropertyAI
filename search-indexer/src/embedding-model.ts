import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function generateEmbedding(text: string): Promise<number[]> {
    const model = genAI.getGenerativeModel({
        model: "gemini-embedding-001",
    });

    const result = await model.embedContent({
        content: {
            role: "user",
            parts: [{ text }],
        },
        taskType: TaskType.RETRIEVAL_DOCUMENT,
    });

    return result.embedding.values;
}