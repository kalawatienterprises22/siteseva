export default async function handler(req, res) {
  // CORS और Method चेक
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { type, number } = req.body || {};
  if (!number) {
    return res.status(400).json({ message: 'कृपया नंबर दर्ज करें' });
  }

  const cleanNum = number.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const apiKey = "Key_live_38a0b79045fd4cd08ce63e6b638fe81c";
  const apiSecret = "Secret_live_bed1d5fddb2c43bfaa1b8356c2f78bd1";

  try {
    // 1. Sandbox ऑथेंटिकेशन टोकन
    const authRes = await fetch("https://api.sandbox.co.in/authenticate", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "x-api-secret": apiSecret,
        "x-api-version": "1.0",
        "accept": "application/json"
      }
    });

    const authData = await authRes.json();
    const token = authData.data?.access_token || authData.access_token;

    if (!token) {
      return res.status(200).json({
        message: "Sandbox Auth Failed: " + (authData.message || JSON.stringify(authData))
      });
    }

    // 2. Sandbox Vahan / Sarathi API कॉल
    // Sandbox KYC V2/V1 स्टैंडर्ड एंडपॉइंट्स
    let targetUrl = "";
    if (type === 'RC') {
      targetUrl = `https://api.sandbox.co.in/kyc/rc/verify?rc_number=${cleanNum}`;
    } else {
      targetUrl = `https://api.sandbox.co.in/kyc/dl/verify?dl_number=${cleanNum}`;
    }

    const verifyRes = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Authorization": token,
        "x-api-key": apiKey,
        "x-api-version": "1.0",
        "accept": "application/json"
      }
    });

    const verifyData = await verifyRes.json();

    // 500 एरर देने के बजाय जो भी जवाब आए, उसे 200 के साथ भेजें ताकि स्क्रीन पर असली वजह दिखे
    return res.status(200).json(verifyData);

  } catch (err) {
    return res.status(200).json({ message: "Server Catch Error: " + err.message });
  }
}
