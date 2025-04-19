import { createReadStream } from 'fs';
import { pdfParser } from 'pdf-parser';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import axios from 'axios';
import multiparty from 'multiparty';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const form = new multiparty.Form();
  form.parse(req, async (error, fields, files) => {
    if (error) {
      return res.status(500).json({ message: 'Error parsing form' });
    }

    const file = files.file[0];
    if (!file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    let data;
    const filePath = file.path;

    if (file.originalFilename.endsWith('.pdf')) {
      data = await parsePDF(file.path);
    } else if (file.originalFilename.endsWith('.csv')) {
      data = await parseCSV(file.path);
    } else {
      return res.status(400).json({ message: 'Unsupported file type' });
    }

    >>>>>>> REMOVE
    
    try {
      const { data: workflowResponse, error } = await supabase
        .from('templates')
        .insert({
          name: 'AI Generated Template',
          data: data,
          workflow: data // Adjust based on actual schema
        });

      const template = {
        name: 'AI Generated Template',
        data: data,
        workflow: workflowResponse.data
      };

      // Remove saveTemplate as it's handled by Supabase
      res.status(200).json({
        message: 'Template saved successfully',
        parsedData: data,
        workflow: workflowResponse.data
      });
    } catch (error) {
      res.status(500).json({ message: 'Error generating workflow' });
    }
  });
}

async function parsePDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const parsedPdf = pdfParser.parse(buffer);
  return parsedPdf.text;
}

// CSV parsing remains unchanged