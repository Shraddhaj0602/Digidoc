import { GoogleGenerativeAI } from '@google/generative-ai';

const PROMPT = `You are an OCR engine for manufacturing operational records.

A user has uploaded a handwritten or semi-structured manufacturing 
document. Extract ALL of the following fields from the document.

Return ONLY a valid JSON object in this exact structure — no extra text, 
no markdown, no explanation:

{
  "plant": "",
  "department": "",
  "shift": "",
  "date": "",
  "employeeNumber": "",
  "operationCode": "",
  "machineNumber": "",
  "workOrderNumber": "",
  "quantityProduced": null,
  "timeTaken": "",
  "machines": [
    {
      "machineId": "",
      "productCode": "",
      "plan": null,
      "actual": null,
      "rejects": null,
      "operator": "",
      "timeTaken": ""
    }
  ],
  "totalProduction": null,
  "remarks": "",
  "confidence_scores": {
    "plant": 0.0,
    "department": 0.0,
    "shift": 0.0,
    "date": 0.0,
    "employeeNumber": 0.0,
    "operationCode": 0.0,
    "machineNumber": 0.0,
    "workOrderNumber": 0.0,
    "quantityProduced": 0.0,
    "timeTaken": 0.0,
    "totalProduction": 0.0,
    "remarks": 0.0,
    "machines": 0.0
  }
}

Rules:
- If a field is missing or illegible, return null
- confidence_scores range from 0.0 (not found) to 1.0 (very certain)
- For machines[], extract one object per machine row/operation in the document
- Shift can be any string (e.g., A, B, C, Morning, Evening, Night, General, or any other description found in the document) — normalize/clean as a clean string
- Date format should be DD/MM/YYYY
- Note: 'machineId' and 'machineNumber' may be the same thing. 'operator' is the 'employeeNumber'. 'actual' is 'quantityProduced'. Map them as best as you can if the document only has one value for these pairs. For each machine row in 'machines[]', extract the specific time taken (hours/time duration) for that row (if any) and save it in the 'timeTaken' field.`;

/**
 * Converts a File object to a base64 string
 */
export const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Extracts structured JSON from an image file using Gemini
 */
export const extractDocumentData = async (file, apiKey) => {
  if (!apiKey) throw new Error("API Key is required");
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const imagePart = await fileToGenerativePart(file);

  const result = await model.generateContent([PROMPT, imagePart]);
  const response = await result.response;
  let text = response.text();

  // Clean up markdown formatting if Gemini includes it despite the prompt
  if (text.startsWith('```json')) {
    text = text.replace(/```json\n?/, '').replace(/```\n?$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/```\n?/, '').replace(/```\n?$/, '');
  }

  return JSON.parse(text);
};
