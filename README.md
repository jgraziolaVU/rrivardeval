# Course Evaluation Summarizer

A modern web application that helps instructors analyze course evaluations by filtering out harsh comments and highlighting constructive feedback and positive remarks.

## Features

- **PDF Upload**: Upload course evaluation PDFs directly
- **AI-Powered Analysis**: Uses OpenAI GPT-4 to process and categorize feedback
- **Constructive Filtering**: Removes mean or unhelpful comments
- **Frequency Analysis**: Shows how often specific suggestions appear
- **Positive Highlights**: Extracts uplifting comments verbatim
- **Download Results**: Export summaries as text files
- **Responsive Design**: Works perfectly on mobile and desktop

## Deployment on Vercel

### Prerequisites
- Node.js 18+ installed
- OpenAI API key
- Vercel account

### Setup Instructions

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd course-evaluation-summarizer
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

4. **Configure Environment Variables in Vercel**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Add `OPENAI_API_KEY` with your OpenAI API key

### Local Development

```bash
npm start
```

The app will run at `http://localhost:3000`

## How It Works

1. **Upload**: Users upload a PDF containing course evaluations
2. **Extract**: The app extracts text from the PDF
3. **Process**: OpenAI analyzes the text to:
   - Filter out mean/unhelpful comments
   - Categorize constructive feedback by theme
   - Count frequency of suggestions
   - Extract positive comments verbatim
4. **Display**: Results are shown in a clean, readable format
5. **Download**: Users can download the summary as a text file

## Technology Stack

- **Frontend**: React, CSS3, Responsive Design
- **Backend**: Node.js, Vercel Serverless Functions
- **AI**: OpenAI GPT-4
- **PDF Processing**: pdf-extract
- **Hosting**: Vercel

## File Structure

```
course-evaluation-summarizer/
├── api/
│   └── upload.js          # Vercel serverless function
├── public/
│   └── index.html         # HTML template
├── src/
│   ├── App.js             # Main React component
│   ├── App.css            # Styling
│   └── index.js           # React entry point
├── package.json           # Dependencies
├── vercel.json            # Vercel configuration
└── README.md              # This file
```

## Privacy & Security

- Files are processed server-side and not stored permanently
- OpenAI API processes the text but doesn't retain data
- All uploads are temporary and automatically cleaned up

## Support

For issues or questions, please check the GitHub repository or contact the maintainer.

## License

This project is licensed under the GNU General Public License v3.0 - see the LICENSE file for details.
