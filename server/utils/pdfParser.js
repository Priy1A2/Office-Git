const pdfParse = require('pdf-parse');

/**
 * Extract text content from a PDF buffer
 * @param {Buffer} buffer - PDF file buffer
 * @returns {string} Extracted text
 */
const extractTextFromPDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No readable text found in PDF');
    }
    return data.text;
  } catch (error) {
    if (error.message.includes('No readable text')) {
      throw error;
    }
    throw new Error('Failed to parse PDF file. Ensure it is a valid PDF.');
  }
};

module.exports = { extractTextFromPDF };
