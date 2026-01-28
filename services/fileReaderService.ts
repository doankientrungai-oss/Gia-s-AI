import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';
import mammoth from 'mammoth';

// This is required for pdf.js to work in a browser environment
if (typeof window !== 'undefined' && 'pdfjsWorkerSrc' in window) {
    pdfjs.GlobalWorkerOptions.workerSrc = (window as any).pdfjsWorkerSrc;
}

/**
 * Reads the text content from a File object.
 * Supports PDF and DOCX files.
 * @param file The File object to read.
 * @returns A promise that resolves with the text content of the file.
 */
export const readFileContent = async (file: File): Promise<string> => {
    const type = file.type;
    const arrayBuffer = await file.arrayBuffer();

    if (type === 'application/pdf') {
        const loadingTask = pdfjs.getDocument(arrayBuffer);
        const pdf = await loadingTask.promise;
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map(s => (s as any).str).join(' ') + '\n';
        }
        return textContent;
    } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || type === 'application/msword') {
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } else {
        throw new Error(`Unsupported file type: ${type}. Only PDF and DOCX are supported for text extraction.`);
    }
};