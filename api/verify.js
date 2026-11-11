export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { type, number } = req.body || {};
  if (!number) {
    return res.status(400).json({ message: 'कृपया नंबर दर्ज करें' });
  }

  const cleanNum = number.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  // Attestr Auth Token
  const ATTESTR_TOKEN = "T1gwUlNQRGNnNnhycnJ1TmdHLjk0NTE1NDE4ODZiNzZkYmM2MTViMGI5NzRhZDY5M2ZiOjYwNGQ3YzUxMjIxNzkzZDk5NmIwMjc4NmQ4NDQwZGZmMDdhOWE1MDQxNmYxNTNjOA==";

  try {
    let endpoint = "";
    let requestBody = {};

    if (type === 'rc') {
      endpoint = "https://api.attestr.com/api/v3/public/checkx/rc";
      requestBody = {
        reg: cleanNum
      };
    } else {
      // Driving License Check
      endpoint = "https://api.attestr.com/api/v3/public/checkx/dl";
      requestBody = {
        dl: cleanNum
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ATTESTR_TOKEN}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        message: data.message || data.error || 'वेरिफिकेशन विफल रहा',
        details: data
      });
    }

    // Attestr Data Mapping
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
        insurance:
