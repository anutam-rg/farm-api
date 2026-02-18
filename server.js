const express = require("express");
const { google } = require("googleapis");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || "";
const SA = process.env.GSA_KEY_JSON ? JSON.parse(process.env.GSA_KEY_JSON) : null;

app.post("/analyze", async (req, res) => {
  try {
    if (req.headers["x-webhook-token"] !== WEBHOOK_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!SA) {
      return res.status(500).json({ error: "Missing GSA_KEY_JSON" });
    }

    const { spreadsheetId, range } = req.body;

    const auth = new google.auth.JWT({
      email: SA.client_email,
      key: SA.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];

    return res.json({
      rows: values.length,
      data: values.slice(0, 10),
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/ping", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port", PORT));
