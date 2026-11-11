export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { type, number } = req.body || {};
  if (!number) {
    return res.status(400).json({ message: 'कृपया नंबर दर्ज करें' });
  }

  const cleanNum = number.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const apiKey = "key_live_38a0b79045fd4cd08ce63e6b638fe81c";
  const apiSecret = "secret_live_bed1d5fddb2c43bfaa1b8356c2f78bd1";

  try {
    // 1. Sandbox Authenticate
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
      return res.status(200).json({ message: "Auth Error: " + (authData.message || JSON.stringify(authData)) });
    }

    // 2. Sandbox Vahan / Sarathi Post Call
    let targetUrl = "";
    let payload = {};

    if (type === 'RC') {
      targetUrl = "https://api.sandbox.co.in/rc/verify";
      payload = {
        rc_number: cleanNum,
        consent: "Y",
        reason: "Vehicle Verification"
      };
    } else {
      targetUrl = "https://api.sandbox.co.in/dl/verify";
      payload = {
        dl_number: cleanNum,
        consent: "Y",
        reason: "Operator Verification"
      };
    }

    const verifyRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Authorization": token,
        "x-api-key": apiKey,
        "x-api-version": "1.0",
        "Content-Type": "application/json",
        "accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const verifyData = await verifyRes.json();
    return res.status(200).json(verifyData);

  } catch (err) {
    return res.status(200).json({ message: "Server Catch Error: " + err.message });
  }
}
