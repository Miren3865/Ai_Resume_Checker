const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

/**
 * Extract raw text from uploaded resume file (PDF or DOCX)
 */
const extractTextFromFile = async (filePath, originalname) => {
  const ext = path.extname(originalname).toLowerCase();

  if (ext === '.pdf') {
    const dataBuffer = require('fs').readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return { text: data.text, fileType: 'pdf' };
  } else if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return { text: result.value, fileType: 'docx' };
  } else {
    throw new Error('Unsupported file type. Only PDF and DOCX are allowed.');
  }
};

module.exports = { extractTextFromFile };
