const Tesseract = require('tesseract.js');
const fs = require('fs');

const performOCR = async (filePath) => {
  try {
    const result = await Tesseract.recognize(filePath, 'eng');
    const text = result.data.text;
    
    // Extracted fields
    let productName = '';
    let brand = '';
    let purchaseDate = '';
    let purchasePrice = 0;
    let modelNumber = '';
    let serialNumber = '';
    let invoiceNumber = '';

    const lines = text.split('\n');
    
    // Common brand patterns
    const brandsList = [
      'Samsung', 'LG', 'Whirlpool', 'Sony', 'Panasonic', 'Dell', 'HP', 'Apple', 
      'Lenovo', 'Asus', 'Acer', 'Bosch', 'Dyson', 'Honda', 'Toyota', 'Maruti', 
      'Bajaj', 'Yamaha', 'Xiaomi', 'Philips', 'Realme', 'OnePlus', 'Carrier', 
      'Voltas', 'Blue Star', 'Daikin', 'Havells', 'Eureka Forbes', 'Kent'
    ];

    // 1. Brand matching
    for (const b of brandsList) {
      const regex = new RegExp(`\\b${b}\\b`, 'i');
      if (regex.test(text)) {
        brand = b;
        break;
      }
    }

    // 2. Extract Dates (DD/MM/YYYY, YYYY-MM-DD, etc.)
    const dateRegex = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/g;
    const foundDates = text.match(dateRegex);
    if (foundDates && foundDates.length > 0) {
      // Return the first date found, cleaned up
      purchaseDate = foundDates[0].replace(/\//g, '-');
    }

    // 3. Extract Price / Amount (look for Total, Grand Total, Net Amount, Invoice Value, etc.)
    const priceRegexes = [
      /(?:total|amount|net|grand|price|val|rs\.?|\$)\s*:?\s*[\d,]+\.\d{2}/i,
      /(?:total|amount|net|grand|price|val|rs\.?|\$)\s*:?\s*[\d,]+/i
    ];
    
    for (const pr of priceRegexes) {
      const match = text.match(pr);
      if (match) {
        // Extract the number part
        const numMatch = match[0].match(/[\d,]+\.?\d*/);
        if (numMatch) {
          purchasePrice = parseFloat(numMatch[0].replace(/,/g, ''));
          break;
        }
      }
    }

    // 4. Extract Model / Serial / Invoice Number
    const modelMatch = text.match(/(?:model|mod|model\s*no|code)\s*[:#-]?\s*([a-z0-9-]+)/i);
    if (modelMatch && modelMatch[1]) {
      modelNumber = modelMatch[1].trim();
    }

    const serialMatch = text.match(/(?:serial|sr\s*no|s\/n|sl\s*no)\s*[:#-]?\s*([a-z0-9-]+)/i);
    if (serialMatch && serialMatch[1]) {
      serialNumber = serialMatch[1].trim();
    }

    const invoiceMatch = text.match(/(?:invoice|inv|bill|invoice\s*no|bill\s*no)\s*[:#-]?\s*([a-z0-9-]+)/i);
    if (invoiceMatch && invoiceMatch[1]) {
      invoiceNumber = invoiceMatch[1].trim();
    }

    // 5. Try to extract product name from first line or text
    // We clean common words to find a reasonable description
    const cleanedLines = lines.map(l => l.trim()).filter(l => l.length > 5 && !l.toLowerCase().includes('invoice') && !l.toLowerCase().includes('tax') && !l.toLowerCase().includes('receipt'));
    if (cleanedLines.length > 0) {
      productName = cleanedLines[0].substring(0, 50);
    }

    return {
      success: true,
      text: text.substring(0, 1000), // snippet of raw text
      extracted: {
        productName: productName || 'Scanned Product',
        brand: brand || 'Generic',
        purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
        purchasePrice: purchasePrice || 0,
        modelNumber: modelNumber || '',
        serialNumber: serialNumber || '',
        invoiceNumber: invoiceNumber || ''
      }
    };
  } catch (error) {
    console.error('OCR error:', error);
    return {
      success: false,
      error: error.message,
      extracted: {
        productName: 'Scanned Product',
        brand: 'Generic',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: 0,
        modelNumber: '',
        serialNumber: '',
        invoiceNumber: ''
      }
    };
  }
};

module.exports = { performOCR };
