module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { type, number } = req.body || {};
    if (!number) {
      return res.status(400).json({ message: 'कृपया नंबर दर्ज करें' });
    }

    const cleanNum = String(number).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const token = "T1gwUlNQRGNnNnhycnJ1TmdHLjk0NTE1NDE4ODZiNzZkYmM2MTViMGI5NzRhZDY5M2ZiOjYwNGQ3YzUxMjIxNzkzZDk5NmIwMjc4NmQ4NDQwZGZmMDdhOWE1MDQxNmYxNTNjOA==";

    const endpoint = (type === 'rc')
      ? "https://api.attestr.com/api/v3/public/checkx/rc"
      : "https://api.attestr.com/api/v3/public/checkx/dl";

    const payload = (type === 'rc') 
      ? { reg: cleanNum } 
      : { dl: cleanNum };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        message: data.message || data.error || 'वेरिफिकेशन विफल रहा',
        details: data
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        number: cleanNum,
        ownerName: data.owner || data.name || data.ownerName || data.registeredOwner || 'उपलब्ध नहीं',
        model: data.model || data.vehicleClass || data.makerDescription || 'उपलब्ध नहीं',
        maker: data.maker || data.manufacturer || 'उपलब्ध नहीं',
        fuelType: data.fuelType || data.fuel || 'उपलब्ध नहीं',
        regDate: data.regDate || data.issueDate || data.registrationDate || 'उपलब्ध नहीं',
        fitness: data.fitnessUpto || data.validUpto || data.fitness || 'उपलब्ध नहीं',
        insurance: data.insuranceUpto || data.insuranceExpiryDate || 'उपलब्ध नहीं',
        raw: data
      }
    });

  } catch (error) {
    return res.status(500).json({
      message: 'सर्वर में समस्या आई',
      error: error.message
    });
  }
};
