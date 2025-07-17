import Anthropic from '@anthropic-ai/sdk';

export const config = {
  api: {
    bodyParser: true,
  },
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

async function handler(req, res) {
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
    const { apiKey } = req.body;

    if (!apiKey || !validateApiKey(apiKey)) {
      return res.status(400).json({ 
        error: 'Please provide a valid Anthropic API key (starts with sk-ant-)',
        valid: false 
      });
    }

    // Test the API key
    const isValid = await testApiKey(apiKey);

    if (isValid) {
      res.status(200).json({ valid: true });
    } else {
      res.status(401).json({ 
        error: 'Invalid API key. Please check your key and try again.',
        valid: false 
      });
    }
  } catch (error) {
    console.error('Test key error:', error);
    res.status(500).json({ 
      error: 'Unable to validate API key. Please try again.',
      valid: false 
    });
  }
}

export default handler;
