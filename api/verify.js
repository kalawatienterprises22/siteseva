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

    const headers = {
      "Authorization": token,
      "x-api-key": apiKey,
      "x-api-version": "1.0",
      "accept": "application/json"
    };

    let verifyData = null;

    if (type === 'RC') {
      // 1. Sandbox का स्टैंडर्ड RC Search एंडपॉइंट
      let r = await fetch(`https://api.sandbox.co.in/kyc/vehicle/rc/search?vehicle_number=${cleanNum}&consent=Y&reason=Verification`, {
        method: "GET",
        headers: headers
      });
      verifyData = await r.json();

      // 2. अगर 404 आए तो अल्टरनेटिव KYC Vahan एंडपॉइंट
      if (verifyData.code === 404 || verifyData.message === "Not Found") {
        r = await fetch(`https://api.sandbox.co.in/kyc/vahan/search?vehicle_number=${cleanNum}&consent=Y&reason=Verification`, {
          method: "GET",
          headers: headers
        });
        verifyData = await r.json();
      }

      // 3. अगर फिर भी 404 आए तो v1 RC Verify
      if (verifyData.code === 404 || verifyData.message === "Not Found") {
        r = await fetch(`https://api.sandbox.co.in/kyc/rc/verify?vehicle_number=${cleanNum}&consent=Y&reason=Verification`, {
          method: "GET",
          headers: headers
        });
        verifyData = await r.json();
      }
    } else {
      // DL Verification
      let r = await fetch(`https://api.sandbox.co.in/kyc/dl/verify?dl_number=${cleanNum}&consent=Y&reason=Verification`, {
        method: "GET",
        headers: headers
      });
      verifyData = await r.json();

      if (verifyData.code === 404 || verifyData.message === "Not Found") {
        r = await fetch(`https://api.sandbox.co.in/kyc/dl/search?dl_number=${cleanNum}&consent=Y&reason=Verification`, {
          method: "GET",
          headers: headers
        });
        verifyData = await r.json();
      }
    }

    return res.status(200).json(verifyData);

  } catch (err) {
    return res.status(200).json({ message: "Server Catch Error: " + err.message });
  }
}
