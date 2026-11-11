export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, number } = req.body;
  if (!number) {
    return res.status(400).json({ error: 'Number is required' });
  }

  const cleanNum = number.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const apiKey = "Key_live_38a0b79045fd4cd08ce63e6b638fe81c";
  const apiSecret = "Secret_live_bed1d5fddb2c43bfaa1b8356c2f78bd1";

  try {
    // 1. Sandbox से ऑथराइज़ेशन टोकन जनरेट करना
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
      return res.status(500).json({ error: "Auth failed with Sandbox", details: authData });
    }

    // 2. असली RC या DL API को कॉल करना
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
    return res.status(200).json(verifyData);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
