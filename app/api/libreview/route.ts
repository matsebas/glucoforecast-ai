import { NextApiRequest, NextApiResponse } from "next";

export const dynamic = "force-dynamic";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, reportId, sessionId } = req.body;

  try {
    // Login
    const loginResponse = await fetch("https://api-la.libreview.io/auth/login", {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json;charset=UTF-8",
        Origin: "https://www.libreview.com",
        Referer: "https://www.libreview.com/",
        Product: "lv",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({ email, password }),
    });

    const loginData = await loginResponse.json();

    if (loginData.status !== 0) {
      throw new Error("Login failed");
    }

    // Fetch report
    const reportUrl = `https://lrs-la.libreview.io/report/${reportId}/${sessionId}?session=${loginData.data.authTicket.token}`;

    const reportResponse = await fetch(reportUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Cache-Control": "max-age=0",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    const htmlContent = await reportResponse.text();

    // Extract window.report
    const reportMatch = htmlContent.match(/window\.report\s*=\s*({[\s\S]*?});/);
    if (!reportMatch || !reportMatch[1]) {
      throw new Error("Report data not found");
    }

    const reportData = JSON.parse(reportMatch[1]);

    res.status(200).json({
      user: loginData.data.user,
      reportData,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
