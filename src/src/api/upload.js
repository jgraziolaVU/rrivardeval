import formidable from 'formidable';
import pdf from 'pdf-parse';

// Initialize OpenAI (we'll use fetch instead of the library for better Vercel compatibility)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

const extractPDFText = async (filePath) => {
  const fs = require('fs');
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
};

const processComments = async (text) => {
  const systemPrompt = `You are a kind and constructive assistant helping instructors analyze course evaluations. Your task is to:

1. Filter out any comments that are mean, hurtful, or purely negative without constructive value
2. Categorize constructive feedback into themes and count frequency
3. Summarize actionable suggestions with frequency indicators
4. Extract positive/uplifting comments verbatim

Return the response in this exact format:

## CONSTRUCTIVE FEEDBACK SUMMARY

**Most Frequent Suggestions:**
• [Theme] (mentioned X times): [Summary of suggestions]
• [Theme] (mentioned X times): [Summary of suggestions]
• [Theme] (mentioned X times): [Summary of suggestions]

**Additional Suggestions:**
• [Less frequent but valuable feedback]

## POSITIVE COMMENTS

**Encouraging Feedback:**
"[Exact quote from student]"

"[Exact quote from student]"

"[Exact quote from student]"

**Additional Positive Notes:**
• [Paraphrased positive feedback that wasn't quotable]

## OVERALL SENTIMENT
[Brief summary of the overall tone and any patterns you noticed]

Please be thorough but concise, focusing on actionable insights that will help the instructor improve while maintaining their confidence.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to process comments with AI');
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if OpenAI API key is set
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const { fields, files } = await parseForm(req);
    const file = files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check file type
    if (!file.originalFilename?.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Please upload a PDF file' });
    }

    // Extract text from PDF
    let text;
    try {
      text = await extractPDFText(file.filepath);
    } catch (error) {
      console.error('PDF extraction error:', error);
      return res.status(500).json({ error: 'Failed to extract text from PDF' });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text found in PDF' });
    }

    // Process comments with AI
    const result = await processComments(text);

    res.status(200).json({ result });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
