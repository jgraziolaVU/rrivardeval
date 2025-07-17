# Course Evaluation Summarizer

A modern web application that helps instructors analyze course evaluations by filtering out harsh comments and highlighting constructive feedback and positive remarks using Anthropic's Claude AI.

## Features

- **PDF Upload**: Upload course evaluation PDFs directly with drag-and-drop support
- **AI-Powered Analysis**: Uses Anthropic Claude to process and categorize feedback
- **Constructive Filtering**: Removes mean or unhelpful comments while preserving actionable feedback
- **Frequency Analysis**: Shows how often specific suggestions appear
- **Positive Highlights**: Extracts uplifting comments verbatim
- **Progress Tracking**: Visual progress indicator during processing
- **Download Results**: Export summaries as text files
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop

## Technology Stack

- **Frontend**: React 18, Modern CSS3, Responsive Design
- **Backend**: Node.js, Vercel Serverless Functions
- **AI**: Anthropic Claude 3.5 Sonnet
- **PDF Processing**: pdf-parse library
- **File Upload**: formidable for multipart handling
- **Hosting**: Vercel (free tier compatible)

## Deployment on Vercel

### Prerequisites
- Node.js 18+ installed
- Anthropic API key (get one at https://console.anthropic.com/)
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
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
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
   - Add `ANTHROPIC_API_KEY` with your Anthropic API key

### Local Development

```bash
npm start
```

The app will run at `http://localhost:3000`

## How It Works

1. **Upload**: Users upload a PDF containing course evaluations via drag-and-drop or file selector
2. **Extract**: The app extracts text content from the PDF using pdf-parse
3. **Process**: Anthropic Claude analyzes the text to:
   - Filter out mean/unhelpful comments
   - Categorize constructive feedback by theme with frequency counts
   - Extract positive comments verbatim
   - Provide overall sentiment analysis
4. **Display**: Results are shown in a clean, readable format with proper typography
5. **Download**: Users can download the complete summary as a text file

## File Structure

```
course-evaluation-summarizer/
├── api/
│   └── upload.js          # Vercel serverless function for PDF processing
├── public/
│   ├── index.html         # HTML template
│   └── manifest.json      # PWA manifest
├── src/
│   ├── App.js             # Main React component
│   ├── App.css            # Styling and responsive design
│   └── index.js           # React entry point
├── package.json           # Dependencies and scripts
├── vercel.json            # Vercel configuration
├── .env.local.example     # Environment variables template
└── README.md              # This file
```

## API Configuration

The application uses Anthropic's Claude 3.5 Sonnet model with the following configuration:
- **Model**: `claude-3-5-sonnet-20241022`
- **Max Tokens**: 2000
- **Temperature**: 0.3 (for consistent, focused responses)
- **Timeout**: 30 seconds for processing

## Features in Detail

### AI Analysis
- **Constructive Filtering**: Removes purely negative comments without constructive value
- **Theme Categorization**: Groups similar feedback with frequency indicators
- **Positive Extraction**: Preserves uplifting comments exactly as written
- **Sentiment Analysis**: Provides overall evaluation tone assessment

### User Experience
- **Progress Tracking**: Visual progress bar during processing
- **Error Handling**: Clear error messages for common issues
- **File Validation**: Ensures only PDF files are processed
- **Responsive Design**: Optimized for all device sizes
- **Accessibility**: Semantic HTML and proper contrast ratios

### Security & Privacy
- **No Data Persistence**: Files are processed and immediately deleted
- **API Key Protection**: Environment variables keep credentials secure
- **File Size Limits**: 10MB maximum file size
- **Text Truncation**: Limits processing to prevent token overflow

## Troubleshooting

### Common Issues

1. **"Anthropic API key not configured"**
   - Ensure `ANTHROPIC_API_KEY` is set in your environment variables
   - Check that the key is valid and has sufficient credits

2. **"Failed to extract text from PDF"**
   - Ensure the PDF contains readable text (not just images)
   - Try a different PDF file to verify the issue

3. **"Request timed out"**
   - The PDF might be too large or complex
   - Try with a smaller file or fewer pages

4. **Build errors on Vercel**
   - Ensure all dependencies are properly installed
   - Check that `api/upload.js` is in the correct directory

### Development Tips

- Use `npm start` for local development with hot reload
- Check browser console for detailed error messages
- Test with various PDF formats to ensure compatibility
- Monitor Vercel function logs for deployment issues

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 - see the LICENSE file for details.

## Support

For issues or questions:
- Check the troubleshooting section above
- Review Vercel function logs for deployment issues
- Ensure your Anthropic API key has sufficient credits
- Contact the maintainer through the GitHub repository

## Acknowledgments

- Built with [Anthropic Claude](https://www.anthropic.com/) for AI analysis
- Deployed on [Vercel](https://vercel.com/) for seamless hosting
- Uses [pdf-parse](https://www.npmjs.com/package/pdf-parse) for PDF text extraction
- Designed with educators in mind for better course improvement insights
