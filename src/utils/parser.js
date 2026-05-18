export const parseOCRText = (text) => {
  // Initialize the result structure matching the expected prompt schema
  const result = {
    plant: null,
    department: null,
    shift: null,
    date: null,
    employeeNumber: null,
    operationCode: null,
    machineNumber: null,
    workOrderNumber: null,
    quantityProduced: null,
    timeTaken: null,
    machines: [],
    totalProduction: null,
    remarks: null,
    confidence_scores: {
      plant: 0.0,
      department: 0.0,
      shift: 0.0,
      date: 0.0,
      employeeNumber: 0.0,
      operationCode: 0.0,
      machineNumber: 0.0,
      workOrderNumber: 0.0,
      quantityProduced: 0.0,
      timeTaken: 0.0,
      totalProduction: 0.0,
      remarks: 0.0,
      machines: 0.0
    }
  };

  if (!text) return result;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = lines.join(' ');

  // Helpers to assign values and confidence
  const setField = (field, value, confidence) => {
    if (value) {
      result[field] = value;
      result.confidence_scores[field] = confidence;
    }
  };

  // 1. Plant Extraction (Look for common keywords or assume first few lines)
  const plantMatch = fullText.match(/(?:Plant|Factory|Company|Facility)[:\-]?\s*([A-Za-z0-9\s.,]+(?:Ltd|Inc|LLC|Pvt|Mfg)?)/i);
  if (plantMatch) {
    setField('plant', plantMatch[1].trim(), 0.85);
  } else if (lines.length > 0 && lines[0].length > 5) {
    // Heuristic: First line is often the plant/company name
    setField('plant', lines[0], 0.6);
  }

  // 2. Department Extraction
  const deptMatch = fullText.match(/(?:Department|Dept)[:\-]?\s*([A-Za-z\s]+)/i);
  if (deptMatch) {
    setField('department', deptMatch[1].trim(), 0.9);
  }

  // 3. Date Extraction (DD/MM/YYYY or similar)
  const dateMatch = fullText.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    let year = dateMatch[3];
    if (year.length === 2) year = '20' + year;
    setField('date', `${day}/${month}/${year}`, 0.95);
  }

  // 4. Shift Extraction (Any String)
  const shiftMatch = fullText.match(/(?:Shift)[:\-]?\s*([a-zA-Z0-9]+)/i);
  if (shiftMatch) {
    let shiftStr = shiftMatch[1];
    setField('shift', shiftStr, 0.9);
  }

  // 5. Total Production Extraction
  const totalMatch = fullText.match(/(?:Total|Overall|Sum)(?:\s+(?:Production|Qty|Quantity|Actual))?[:\-]?\s*(\d+)/i);
  if (totalMatch) {
    setField('totalProduction', parseInt(totalMatch[1], 10), 0.88);
  }

  // 6. Remarks Extraction
  const remarkMatch = fullText.match(/(?:Remarks|Comments|Notes)[:\-]?\s*(.+)/i);
  if (remarkMatch) {
    setField('remarks', remarkMatch[1].trim(), 0.8);
  }

  // 7. Machines Table Parsing (Heuristics based on lines containing numbers and codes)
  // Look for a pattern resembling: MC-101 P-2001 500 482 18 Ravi
  let machineConfSum = 0;
  lines.forEach(line => {
    // Simple heuristic: Line has a machine ID (MC-\d+ or MACH-\d+)
    const machIdMatch = line.match(/(MC|MACH|M)[\-\s]?(\d{1,4})/i);
    if (machIdMatch) {
      const machineId = `${machIdMatch[1].toUpperCase()}-${machIdMatch[2]}`;
      
      // Extract numbers for plan, actual, rejects
      const numbers = line.match(/\b\d+\b/g) || [];
      // Filter out the machine ID number
      const values = numbers.filter(n => n !== machIdMatch[2]).map(Number);
      
      let plan = values.length > 0 ? values[0] : null;
      let actual = values.length > 1 ? values[1] : null;
      let rejects = values.length > 2 ? values[2] : null;

      // Product Code heuristic (e.g. P-2001 or PRD123)
      const prodCodeMatch = line.match(/\b([A-Z]{1,3}[\-\s]?\d{3,5})\b/i);
      const productCode = prodCodeMatch && prodCodeMatch[1] !== machineId ? prodCodeMatch[1].toUpperCase() : '';

      // Operator Name (Longest word that's purely letters)
      const words = line.split(/\s+/).filter(w => /^[a-zA-Z]{3,}$/.test(w) && w.toLowerCase() !== 'machine');
      const operator = words.length > 0 ? words[words.length - 1] : '';

      result.machines.push({
        machineId,
        machineNumber: machineId,
        productCode,
        operationCode: productCode,
        workOrderNumber: '',
        plan,
        actual,
        quantityProduced: actual,
        rejects,
        operator,
        employeeNumber: operator,
        timeTaken: ''
      });
      machineConfSum += 0.75; // Baseline heuristic confidence for a found row
    }
  });

  if (result.machines.length > 0) {
    result.confidence_scores.machines = machineConfSum / result.machines.length;
    
    // Auto-calculate total production if missing
    if (!result.totalProduction) {
      const calculatedTotal = result.machines.reduce((acc, m) => acc + (m.actual || 0), 0);
      if (calculatedTotal > 0) {
         setField('totalProduction', calculatedTotal, 0.7);
      }
    }
  }

  // Fill nulls for missing expected fields to match the schema
  const requiredKeys = ['plant', 'department', 'shift', 'date', 'totalProduction', 'remarks'];
  requiredKeys.forEach(k => {
    if (result[k] === undefined) result[k] = null;
  });

  return result;
};
