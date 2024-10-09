import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { WEBPAGE_ANALYSIS_PROMPT, IMAGE_ANALYSIS_PROMPT, NOTE_ANALYSIS_PROMPT } from '../utils/prompts.js';
import fs from 'fs/promises';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import sharp from 'sharp';

dotenv.config();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirnamePath = dirname(__filename);

const OPENAI_API_ENDPOINT = process.env.OPENAI_API_ENDPOINT;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_MODEL = process.env.OPENAI_API_MODEL;

// Ensure you have the same path utility
import {
  getUserImagePath
} from '../utils/paths.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export const analyzeImage = async (buffer, userId) => {
  try {
    // Convert buffer to base64
    const base64Image = buffer.toString('base64');

    // Get image metadata using sharp
    const metadata = await sharp(buffer).metadata();

    const response = await fetch(OPENAI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_API_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: IMAGE_ANALYSIS_PROMPT
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/${metadata.format};base64,${base64Image}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;
    console.log("analysis", analysis);

    // Parse the JSON response directly
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysis);
    } catch (jsonError) {
      console.error('Error parsing JSON:', jsonError);
      throw new Error('Invalid JSON format received from OpenAI.');
    }

    const { description, tags } = parsedAnalysis;

    console.log("des tags", description, tags);
    return {
      description,
      tags,
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

export async function analyzeNote(text) {
  const prompt = `${NOTE_ANALYSIS_PROMPT} ${text}`;
  
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
          { role: 'system', content: 'You are a helpful assistant that analyzes note content.' },
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
    console.error('Error analyzing note:', error);
    throw error;
  }
}

function getMimeType(extension) {
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}