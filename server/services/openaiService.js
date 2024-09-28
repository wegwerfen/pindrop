import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { WEBPAGE_ANALYSIS_PROMPT } from '../utils/prompts.js';

dotenv.config();

const OPENAI_API_ENDPOINT = process.env.OPENAI_API_ENDPOINT;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_MODEL = process.env.OPENAI_API_MODEL;

export async function analyzeWebpage(text) {
  const prompt = `${WEBPAGE_ANALYSIS_PROMPT} ${text}`;
  
  try {
    const response = await fetch(OPENAI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_API_MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful assistant that analyzes web content.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content.trim());
  } catch (error) {
    console.error('Error analyzing webpage:', error);
    throw error;
  }
}