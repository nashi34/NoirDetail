require("dotenv").config();

const path = require("path");
const https = require("https");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");

const app = express();
const port = Number(process.env.PORT || 3000);
const whatsappNumber = String(process.env.WHATSAPP_NUMBER || "351925070415").trim();
const contactEmail = String(process.env.CONTACT_EMAIL || "dario@noirdetail.pt").trim();
const turnstileSiteKey = String(process.env.TURNSTILE_SITE_KEY || "").trim();
const turnstileSecretKey = String(process.env.TURNSTILE_SECRET_KEY || "").trim();
const captchaEnabled = Boolean(turnstileSiteKey && turnstileSecretKey);
const formLoadTimes = new Map();

app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://challenges.cloudflare.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "https://noirdetail.pt", "data:"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["https://challenges.cloudflare.com"],
        formAction: ["'self'"],
      },
    },
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));

const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas tentativas. Tenta novamente dentro de alguns minutos." },
});

function cleanText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function getClientIp(request) {
  return request.ip || request.socket.remoteAddress || "unknown";
}

function getFormKey(request) {
  return `${getClientIp(request)}:${request.get("user-agent") || "unknown"}`;
}

function rememberFormLoad(request) {
  formLoadTimes.set(getFormKey(request), Date.now());
}

function hasHumanTiming(request) {
  const key = getFormKey(request);
  const loadedAt = formLoadTimes.get(key);

  if (!loadedAt) return false;

  formLoadTimes.delete(key);
  return Date.now() - loadedAt >= 2500;
}

async function verifyTurnstile(token, ip) {
  if (!turnstileSecretKey) return false;
  if (!token) return false;

  const postData = new URLSearchParams({
    secret: turnstileSecretKey,
    response: token,
    remoteip: ip,
  }).toString();

  return new Promise((resolve) => {
    const request = https.request(
      {
        hostname: "challenges.cloudflare.com",
        path: "/turnstile/v0/siteverify",
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "content-length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode !== 200) return resolve(false);

          try {
            const result = JSON.parse(data);
            resolve(Boolean(result.success));
          } catch (error) {
            console.error("Turnstile verification parse error:", error);
            resolve(false);
          }
        });
      }
    );

    request.on("error", (error) => {
      console.error("Turnstile verification request error:", error);
      resolve(false);
    });

    request.write(postData);
    request.end();
  });
}

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

function buildMessage({ name, contact, message, action }) {
  return [
    `Nova marcação Noir Detail (${action}).`,
    "",
    `Nome: ${name}`,
    `Contacto: ${contact}`,
    `Mensagem: ${message}`,
  ].join("\n");
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

app.get("/api/config", (request, response) => {
  rememberFormLoad(request);
  response.json({
    turnstileSiteKey: captchaEnabled ? turnstileSiteKey : "",
    captchaRequired: captchaEnabled,
  });
});

app.post("/api/contact", contactLimiter, async (request, response) => {
  try {
    const name = cleanText(request.body.name, 80);
    const contact = cleanText(request.body.contact, 120);
    const message = cleanText(request.body.message, 800);
    const action = cleanText(request.body.action, 20);
    const website = cleanText(request.body.website, 120);
    const turnstileToken = cleanText(request.body.turnstileToken, 3000);

    if (website) {
      return response.status(400).json({ error: "Não foi possível enviar a marcação." });
    }

    if (!name || !contact || !message || !["email", "whatsapp"].includes(action)) {
      return response.status(400).json({ error: "Preenche todos os campos obrigatórios." });
    }

    if (!hasHumanTiming(request)) {
      return response.status(400).json({ error: "Aguarda um momento antes de enviar a marcação." });
    }

    if (captchaEnabled) {
      const captchaOk = await verifyTurnstile(turnstileToken, getClientIp(request));

      if (!captchaOk) {
        return response.status(403).json({ error: "Confirma que não és um bot antes de enviar." });
      }
    }

    const text = buildMessage({ name, contact, message, action });

    if (action === "whatsapp") {
      return response.json({
        ok: true,
        redirectUrl: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`,
      });
    }

    const transporter = createTransporter();

    if (action === "email") {
      const mailToUrl = `mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(
        "Marcação Noir Detail"
      )}&body=${encodeURIComponent(text)}`;

      if (!transporter) {
        return response.json({ ok: true, redirectUrl: mailToUrl });
      }

      await transporter.sendMail({
        from: process.env.MAIL_FROM || contactEmail,
        to: process.env.MAIL_TO || contactEmail,
        replyTo: looksLikeEmail(contact) ? contact : undefined,
        subject: "Marcação Noir Detail",
        text,
      });

      return response.json({ ok: true, message: "Mensagem enviada com sucesso." });
    }

    return response.status(400).json({ error: "Ação desconhecida." });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Não foi possível enviar a marcação." });
  }
});

app.use("/files", express.static(path.join(__dirname, "files")));
app.get("/style.css", (request, response) => response.sendFile(path.join(__dirname, "style.css")));
app.get("/script.js", (request, response) => response.sendFile(path.join(__dirname, "script.js")));
app.get("/", (request, response) => response.sendFile(path.join(__dirname, "index.html")));
app.get("/index.html", (request, response) => response.redirect(301, "/"));

app.listen(port, () => {
  console.log(`Noir Detail disponível em http://localhost:${port}`);

  if (!turnstileSecretKey || !turnstileSiteKey) {
    console.log("Configura TURNSTILE_SITE_KEY e TURNSTILE_SECRET_KEY antes de publicar.");
  }
});
