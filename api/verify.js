
module.exports = async (req, res) => {
  const allowedOrigin =
    process.env.SITESEVA_ORIGIN ||
    "https://kalawatienterprises22.github.io";

  const requestOrigin = req.headers?.origin;

  if (requestOrigin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      status: "error",
      message: "केवल POST अनुरोध स्वीकार है।"
    });
  }

  const token = process.env.ATTESTR_BASIC_TOKEN;

  if (!token) {
    return res.status(500).json({
      status: "error",
      message: "सत्यापन सेवा अभी कॉन्फ़िगर नहीं है।"
    });
  }

  const body = req.body || {};
  const type = String(body.type || "").trim().toUpperCase();

  const isDL = ["DL", "LICENSE", "LICENCE"].includes(type);
  const isRC = type === "RC";

  if (!isDL && !isRC) {
    return res.status(400).json({
      status: "error",
      message: "दस्तावेज़ का प्रकार RC या DL होना चाहिए।"
    });
  }

  const cleanNum = String(body.number || "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();

  if (!cleanNum) {
    return res.status(400).json({
      status: "error",
      message: "कृपया वैध नंबर दर्ज करें।"
    });
  }

  const consentId = String(body.consentId || "").trim();

  if (body.consent !== true || !consentId) {
    return res.status(400).json({
      status: "error",
      message: "सत्यापन से पहले उपयोगकर्ता की सहमति आवश्यक है।"
    });
  }

  const endpoint = isDL
    ? "https://api.attestr.com/api/v3/public/checkx/dl"
    : "https://api.attestr.com/api/v3/public/checkx/rc";

  const payload = isDL
    ? { dl: cleanNum, consent: { consentId } }
    : { reg: cleanNum, consent: { consentId } };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    let result;

    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (!response.ok || !result || result.appError || result.error) {
      console.error("Attestr verification failed:", response.status);

      return res.status(502).json({
        status: "verification_failed",
        message: "रिकॉर्ड का सत्यापन नहीं हो पाया। कृपया बाद में प्रयास करें।"
      });
    }

    const record =
      result.data && typeof result.data === "object"
        ? result.data
        : result;

    const firstValue = (...values) => {
      for (const value of values) {
        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          return value;
        }
      }
      return null;
    };

    const owner = firstValue(
      record.owner,
      record.name,
      record.ownerName,
      record.registeredOwner
    );

    return res.status(200).json({
      status: "success",
      source: "live",
      data: {
        number: cleanNum,
        regNo: cleanNum,
        owner,
        ownerName: owner,
        maker: firstValue(record.maker, record.manufacturer),
        model: firstValue(record.model, record.makerDescription),
        vehicleClass: firstValue(
          record.vehicleClass,
          record.class,
          record.desc
        ),
        rto: firstValue(record.rto, record.registeredAt),
        fuelType: firstValue(record.fuelType, record.fuel),
        regDate: firstValue(
          record.regDate,
          record.issueDate,
          record.registrationDate
        ),
        fitness: firstValue(
          record.fitnessUpto,
          record.validUpto,
          record.fitness
        ),
        insurance: firstValue(
          record.insuranceUpto,
          record.insuranceExpiryDate
        )
      }
    });

  } catch (error) {
    const timedOut = error?.name === "AbortError";

    return res.status(timedOut ? 504 : 502).json({
      status: "verification_failed",
      message: timedOut
        ? "सत्यापन में समय लग रहा है। फिर प्रयास करें।"
        : "सत्यापन सेवा अभी उपलब्ध नहीं है।"
    });

  } finally {
    clearTimeout(timeout);
  }
};
