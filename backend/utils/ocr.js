const Tesseract = require('tesseract.js');
const fs = require('fs');

const performOCR = async (filePath) => {
  try {
    const result = await Tesseract.recognize(filePath, 'eng');
    const text = result.data.text || '';
    const confidence = result.data.confidence || 85;
    
    // Extracted fields
    let productName = '';
    let brand = '';
    let purchaseDate = '';
    let purchasePrice = 0;
    let modelNumber = '';
    let serialNumber = '';
    let invoiceNumber = '';
    let seller = '';
    let warrantyDurationMonths = 12;
    let category = 'Electronics';

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Common brand patterns
    const brandsList = [
      'Samsung', 'LG', 'Whirlpool', 'Sony', 'Panasonic', 'Dell', 'HP', 'Apple', 
      'Lenovo', 'Asus', 'Acer', 'Bosch', 'Dyson', 'Honda', 'Toyota', 'Maruti', 
      'Bajaj', 'Yamaha', 'Xiaomi', 'Philips', 'Realme', 'OnePlus', 'Carrier', 
      'Voltas', 'Blue Star', 'Daikin', 'Havells', 'Eureka Forbes', 'Kent', 'Boat',
      'Noise', 'JBL', 'Canon', 'Nikon', 'Bose', 'Godrej', 'Haier', 'IFB'
    ];

    // 1. Brand matching
    for (const b of brandsList) {
      const regex = new RegExp(`\\b${b}\\b`, 'i');
      if (regex.test(text)) {
        brand = b;
        break;
      }
    }

    // 2. Seller / Vendor matching
    const sellersList = ['Amazon', 'Flipkart', 'Croma', 'Reliance Digital', 'Vijay Sales', 'Best Buy', 'Walmart', 'Apple Store', 'Tata CLiQ', 'Poorvika', 'Sangeetha'];
    for (const s of sellersList) {
      if (new RegExp(`\\b${s}\\b`, 'i').test(text)) {
        seller = s;
        break;
      }
    }
    if (!seller) {
      // Look for "Sold by" or "Vendor" or "Seller"
      const sellerMatch = text.match(/(?:sold\s*by|seller|vendor|retailer|dealer)\s*[:\-]?\s*([A-Za-z0-9\s&,.]+)/i);
      if (sellerMatch && sellerMatch[1]) {
        seller = sellerMatch[1].split('\n')[0].trim().substring(0, 40);
      }
    }

    // 3. Extract Dates (DD/MM/YYYY, YYYY-MM-DD, DD-MMM-YYYY etc.)
    const dateRegex = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/g;
    const foundDates = text.match(dateRegex);
    if (foundDates && foundDates.length > 0) {
      purchaseDate = foundDates[0].replace(/\//g, '-');
    }

    // 4. Extract Price / Amount
    const priceRegexes = [
      /(?:total|grand\s*total|net\s*amount|invoice\s*value|amount\s*paid|rs\.?|inr|\$|€|£)\s*:?\s*[\d,]+\.\d{2}/i,
      /(?:total|grand\s*total|net\s*amount|invoice\s*value|amount\s*paid|rs\.?|inr|\$|€|£)\s*:?\s*[\d,]+/i
    ];
    
    for (const pr of priceRegexes) {
      const match = text.match(pr);
      if (match) {
        const numMatch = match[0].match(/[\d,]+\.?\d*/);
        if (numMatch) {
          purchasePrice = parseFloat(numMatch[0].replace(/,/g, ''));
          break;
        }
      }
    }

    // 5. Extract Model / Serial / Invoice Number
    const modelMatch = text.match(/(?:model|mod|model\s*no|item\s*code|sku)\s*[:#-]?\s*([a-z0-9-]+)/i);
    if (modelMatch && modelMatch[1]) {
      modelNumber = modelMatch[1].trim();
    }

    const serialMatch = text.match(/(?:serial|sr\s*no|s\/n|sl\s*no|imei)\s*[:#-]?\s*([a-z0-9-]+)/i);
    if (serialMatch && serialMatch[1]) {
      serialNumber = serialMatch[1].trim();
    }

    const invoiceMatch = text.match(/(?:invoice|inv|bill|invoice\s*no|bill\s*no|order\s*id|order\s*#)\s*[:#-]?\s*([a-z0-9-]+)/i);
    if (invoiceMatch && invoiceMatch[1]) {
      invoiceNumber = invoiceMatch[1].trim();
    }

    // 6. Extract Warranty Term (e.g. 1 Year, 2 Years, 24 Months, 36 Months)
    const warrantyMatch = text.match(/(?:warranty|guarantee)\s*[:\-]?\s*(\d+)\s*(year|yr|month|mo)/i);
    if (warrantyMatch) {
      const num = parseInt(warrantyMatch[1]);
      const unit = warrantyMatch[2].toLowerCase();
      if (unit.startsWith('y')) {
        warrantyDurationMonths = num * 12;
      } else {
        warrantyDurationMonths = num;
      }
    }

    // 7. Category Inference
    const lowerText = text.toLowerCase();
    if (lowerText.includes('refrigerator') || lowerText.includes('fridge') || lowerText.includes('washing machine') || lowerText.includes('microwave') || lowerText.includes('air conditioner') || lowerText.includes('ac unit') || lowerText.includes('dishwasher') || lowerText.includes('vacuum')) {
      category = 'Appliances';
    } else if (lowerText.includes('phone') || lowerText.includes('laptop') || lowerText.includes('tv') || lowerText.includes('television') || lowerText.includes('tablet') || lowerText.includes('headphone') || lowerText.includes('speaker') || lowerText.includes('monitor') || lowerText.includes('keyboard')) {
      category = 'Electronics';
    } else if (lowerText.includes('car') || lowerText.includes('bike') || lowerText.includes('scooter') || lowerText.includes('vehicle') || lowerText.includes('motor')) {
      category = 'Vehicles';
    } else if (lowerText.includes('water purifier') || lowerText.includes('ro system') || lowerText.includes('aquaguard') || lowerText.includes('kent')) {
      category = 'Water Purifiers';
    } else if (lowerText.includes('generator') || lowerText.includes('inverter') || lowerText.includes('ups')) {
      category = 'Generators';
    }

    // 8. Extract Product Name
    const cleanedLines = lines.filter(l => 
      l.length > 5 && 
      !l.toLowerCase().includes('tax invoice') && 
      !l.toLowerCase().includes('gstin') && 
      !l.toLowerCase().includes('billed to') &&
      !l.toLowerCase().includes('shipping address')
    );
    if (cleanedLines.length > 0) {
      productName = cleanedLines[0].substring(0, 50);
    }
    if (!productName && brand) {
      productName = `${brand} ${category}`;
    }

    return {
      success: true,
      confidence: Math.round(confidence),
      text: text.substring(0, 1200),
      extracted: {
        productName: productName || 'Scanned Appliance/Device',
        brand: brand || 'Generic',
        category: category || 'Electronics',
        purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
        purchasePrice: purchasePrice || 0,
        modelNumber: modelNumber || '',
        serialNumber: serialNumber || '',
        invoiceNumber: invoiceNumber || '',
        seller: seller || 'Retail Merchant',
        warrantyDurationMonths: warrantyDurationMonths || 12
      }
    };
  } catch (error) {
    console.error('OCR error:', error);
    return {
      success: false,
      error: error.message,
      confidence: 0,
      extracted: {
        productName: 'Scanned Asset',
        brand: 'Generic',
        category: 'Electronics',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: 0,
        modelNumber: '',
        serialNumber: '',
        invoiceNumber: '',
        seller: '',
        warrantyDurationMonths: 12
      }
    };
  }
};

module.exports = { performOCR };
