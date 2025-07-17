import Anthropic from '@anthropic-ai/sdk';
import formidable from 'formidable';
import pdf from 'pdf-parse';
import fs from 'fs';

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
      multiples: false,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Form parsing error:', err);
        reject(err);
      } else {
        console.log('Raw form parse result:', {
          fields: Object.keys(fields),
          files: Object.keys(files),
          fileDetails: files.file ? {
            name: files.file.name,
            originalFilename: files.file.originalFilename,
            newFilename: files.file.newFilename,
            mimetype: files.file.mimetype,
            size: files.file.size,
            filepath: files.file.filepath,
            properties: Object.getOwnPropertyNames(files.file)
          } : 'No file'
        });
        resolve({ fields, files });
      }
    });
  });
};

const extractPDFText = async (filePath) => {
  try {
    console.log('Reading PDF file from path:', filePath);
    const dataBuffer = fs.readFileSync(filePath);
    console.log('PDF file read successfully, size:', dataBuffer.length);
    
    const data = await pdf(dataBuffer);
    console.log('PDF parsing complete. Text length:', data.text.length);
    
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

const processComments = async (text, apiKey) => {
  const prompt = `You are a kind and constructive assistant helping instructors analyze course evaluations. Your task is to:

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

Please be thorough but concise, focusing on actionable insights that will help the instructor improve while maintaining their confidence.

Here are the course evaluation comments to analyze:
${text}`;

  try {
    // Initialize Anthropic with user's API key
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Handle potential refusal stop reason in Claude 4
    if (response.stop_reason === 'refusal') {
      throw new Error('Content declined by AI for safety reasons');
    }

    return response.content[0].text;
  } catch (error) {
    console.error('Anthropic API error:', error);
    
    // Handle specific Claude 4 refusal cases
    if (error.message.includes('refusal') || error.message.includes('Content declined')) {
      throw new Error('The AI declined to process this content for safety reasons. Please try with different content.');
    }
    
    // Handle API key related errors
    if (error.status === 401 || error.message.includes('authentication')) {
      throw new Error('Invalid API key. Please check your Anthropic API key.');
    }
    
    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    
    if (error.status === 400) {
      throw new Error('Invalid request. Please check your input and try again.');
    }
    
    throw new Error('Failed to process comments with AI');
  }
};

const validateApiKey = (apiKey) => {
  return apiKey && apiKey.startsWith('sk-ant-') && apiKey.length > 20;
};

const testApiKey = async (apiKey) => {
  try {
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Test with a simple request
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: 'Hello'
        }
      ]
    });

    return response.content[0].text !== undefined;
  } catch (error) {
    console.error('API key test error:', error);
    return false;
  }
};

export default async function handler(req, res) {
  // Add CORS headers
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

  try {
    console.log('Request received, parsing form...');
    const { fields, files } = await parseForm(req);
    
    console.log('Form parsed successfully');
    console.log('Fields:', Object.keys(fields));
    console.log('Files:', Object.keys(files));
    
    // Get API key from form data
    const apiKey = Array.isArray(fields.apiKey) ? fields.apiKey[0] : fields.apiKey;
    
    if (!apiKey || !validateApiKey(apiKey)) {
      return res.status(400).json({ error: 'Valid Anthropic API key required' });
    }

    const file = files.file;
    console.log('File object details:', {
      exists: !!file,
      originalFilename: file?.originalFilename,
      newFilename: file?.newFilename,
      name: file?.name,
      filename: file?.filename,
      mimetype: file?.mimetype,
      size: file?.size,
      filepath: file?.filepath,
      allProperties: file ? Object.getOwnPropertyNames(file) : 'No file'
    });

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check file type - try multiple property names
    const filename = file.originalFilename || file.newFilename || file.name || file.filename || '';
    const mimetype = file.mimetype || file.type || '';
    
    console.log('File validation:', {
      filename: filename,
      mimetype: mimetype,
      endsWithPdf: filename.toLowerCase().endsWith('.pdf'),
      isPdfMime: mimetype === 'application/pdf'
    });
    
    // More lenient validation - accept if either filename ends with .pdf OR mimetype is correct
    const isValidPdf = filename.toLowerCase().endsWith('.pdf') || mimetype === 'application/pdf';
    
    if (!isValidPdf && filename !== '' && mimetype !== '') {
      return res.status(400).json({ 
        error: 'Please upload a PDF file',
        debug: {
          filename: filename,
          mimetype: mimetype,
          receivedFile: !!file,
          allProps: Object.getOwnPropertyNames(file)
        }
      });
    }

    // If we have a file but no filename/mimetype, try to proceed anyway
    if (!filename && !mimetype) {
      console.log('Warning: No filename or mimetype detected, but file exists. Proceeding...');
    }

    // Extract text from PDF
    let text;
    try {
      console.log('Attempting to extract PDF text...');
      text = await extractPDFText(file.filepath);
      console.log('PDF text extracted, length:', text.length);
    } catch (error) {
      console.error('PDF extraction error:', error);
      return res.status(500).json({ error: 'Failed to extract text from PDF' });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text found in PDF' });
    }

    // Limit text size to prevent token overflow
    if (text.length > 50000) {
      text = text.substring(0, 50000) + "\n\n[Text truncated due to length]";
    }

    console.log('Processing comments with AI...');
    // Process comments with AI using user's API key
    const result = await processComments(text, apiKey);
    console.log('AI processing complete');

    res.status(200).json({ result });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Clean up uploaded file
    try {
      if (req.file?.filepath) {
        fs.unlinkSync(req.file.filepath);
      }
    } catch (cleanupError) {
      console.error('File cleanup error:', cleanupError);
    }
  }
}
