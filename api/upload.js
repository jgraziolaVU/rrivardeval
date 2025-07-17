import Anthropic from '@anthropic-ai/sdk';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const uploadDir = path.join(os.tmpdir(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      maxFileSize: 4 * 1024 * 1024, // 4MB for Vercel free tier
      keepExtensions: true,
      multiples: false,
      uploadDir: uploadDir,
      filename: (name, ext, part) => {
        return `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`;
      }
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Form parsing error:', err);
        reject(err);
      } else {
        let fileObj = files.file;
        if (Array.isArray(fileObj)) {
          fileObj = fileObj[0];
        }

        console.log('Form parsed successfully:', {
          fileSize: fileObj?.size,
          fileName: fileObj?.originalFilename,
          filepath: fileObj?.filepath
        });

        files.file = fileObj;
        resolve({ fields, files });
      }
    });
  });
};

const processPDFWithClaude = async (file, apiKey) => {
  try {
    let dataBuffer;

    if (file.filepath && fs.existsSync(file.filepath)) {
      console.log('Reading PDF file from path:', file.filepath);
      dataBuffer = fs.readFileSync(file.filepath);
      console.log('PDF read successfully, buffer size:', dataBuffer.length);
    } else if (file.buffer) {
      console.log('Using PDF file buffer');
      dataBuffer = file.buffer;
    } else {
      throw new Error('No valid file path or buffer found');
    }

    // Convert to base64 for Claude's document API
    const base64Data = dataBuffer.toString('base64');
    console.log('PDF converted to base64, length:', base64Data.length);

    const prompt = `You are a kind and constructive assistant helping instructors analyze course evaluations. 

First, extract all the student comments from this course evaluation PDF. Focus on the sections asking about:
1. What aspects of this course and the instructor's teaching contributed most to your learning?
2. What aspects of this course and the instructor's teaching could be changed to enhance your learning?

Then, analyze the comments to:
1. Filter out any comments that are mean, hurtful, or purely negative without constructive value
2. Categorize constructive feedback into themes and count frequency
3. Summarize actionable suggestions with frequency indicators
4. Extract positive/uplifting comments verbatim

Return the response in this exact format:

## CONSTRUCTIVE FEEDBACK SUMMARY

**Most Frequent Suggestions:**
• [Theme] (mentioned X times): [Summary of suggestions]
• [Theme] (mentioned X times): [Summary of suggestions]

**Additional Suggestions:**
• [Less frequent but valuable feedback]

## POSITIVE COMMENTS

**Encouraging Feedback:**
"[Exact quote from student]"

"[Exact quote from student]"

**Additional Positive Notes:**
• [Paraphrased positive feedback that wasn't quotable]

## OVERALL SENTIMENT
[Brief summary of the overall tone and any patterns you noticed]

Please be thorough but concise, focusing on actionable insights that will help the instructor improve while maintaining their confidence.`;

    const anthropic = new Anthropic({ apiKey });

    console.log('Sending PDF to Claude for analysis...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    console.log('Claude analysis complete');

    if (response.stop_reason === 'refusal') {
      throw new Error('Content declined by AI for safety reasons');
    }

    return response.content[0].text;
  } catch (error) {
    console.error('Claude document processing error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      type: error.type
    });

    if (error.message.includes('refusal') || error.message.includes('Content declined')) {
      throw new Error('The AI declined to process this content for safety reasons.');
    }

    if (error.status === 401 || error.message.includes('authentication')) {
      throw new Error('Invalid API key. Please check your Anthropic API key.');
    }

    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }

    if (error.status === 400) {
      throw new Error('Invalid request. The PDF might be corrupted or in an unsupported format.');
    }

    throw new Error(`Failed to process PDF with AI: ${error.message}`);
  }
};

const validateApiKey = (apiKey) => {
  return apiKey && apiKey.startsWith('sk-ant-') && apiKey.length > 20;
};

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let uploadedFile = null;

  try {
    console.log('Request received, parsing form...');
    const { fields, files } = await parseForm(req);

    const actualFile = files.file;
    uploadedFile = actualFile;

    const apiKey = Array.isArray(fields.apiKey) ? fields.apiKey[0] : fields.apiKey;

    if (!apiKey || !validateApiKey(apiKey)) {
      return res.status(400).json({ error: 'Valid Anthropic API key required' });
    }

    if (!actualFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filename = actualFile.originalFilename || actualFile.newFilename || actualFile.name || '';
    const mimetype = actualFile.mimetype || actualFile.type || '';

    console.log('Processing file:', {
      filename,
      mimetype,
      size: actualFile.size,
      filepath: actualFile.filepath
    });

    // Validate PDF file exists and is readable
    if (!actualFile.filepath || !fs.existsSync(actualFile.filepath)) {
      throw new Error('Unable to access uploaded file');
    }

    // Use Claude's document API directly for PDF processing
    console.log('Processing PDF with Claude document API...');
    const result = await processPDFWithClaude(actualFile, apiKey);
    console.log('Processing complete');

    res.status(200).json({ result });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    try {
      if (uploadedFile?.filepath && fs.existsSync(uploadedFile.filepath)) {
        fs.unlinkSync(uploadedFile.filepath);
        console.log('Cleaned up temporary file');
      }
    } catch (cleanupError) {
      console.error('File cleanup error:', cleanupError);
    }
  }
}

export default handler;
