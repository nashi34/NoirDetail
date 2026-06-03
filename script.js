const body = document.body;
const navToggle = document.querySelector(".nav-toggle");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const navBooking = document.querySelector(".nav-booking");
const navBookingToggle = document.querySelector(".nav-booking-toggle");
const revealItems = document.querySelectorAll("[data-reveal]");
const cursorGlow = document.querySelector(".cursor-glow");
const contactForm = document.querySelector(".contact-form");
const emailSubmit = document.querySelector(".email-submit");
const emailBookingLinks = document.querySelectorAll("[data-email-booking]");
const whatsappBookingLinks = document.querySelectorAll("[data-whatsapp-booking]");
const bookingLinks = document.querySelectorAll("[data-booking-link]");
const formStatus = document.querySelector(".form-status");
const turnstileBox = document.querySelector("[data-turnstile-box]");
const contactEmail = "dario@noirdetail.pt";
const whatsappNumber = "351925070415";
const bookingRateKey = "noirDetailBookingAttempts";
const maxBookingAttempts = 4;
const bookingWindowMs = 10 * 60 * 1000;
const minFormTimeMs = 2500;
const formStartedAt = Date.now();
let turnstileWidgetId = null;
let captchaRequired = true;
let backendAvailable = true;
let lockedNavTarget = "";

function setActiveNavLink(targetHref) {
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === targetHref);
  });
}

function closeBookingMenu() {
  navBooking?.classList.remove("is-open");
  navBookingToggle?.setAttribute("aria-expanded", "false");
}

function setFormStatus(message = "") {
  if (formStatus) {
    formStatus.textContent = message;
  }
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 55, 420)}ms`;
  revealObserver.observe(item);
});

navToggle?.addEventListener("click", () => {
  const isOpen = body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  closeBookingMenu();
});

navBookingToggle?.addEventListener("click", (event) => {
  event.stopPropagation();

  const isOpen = navBooking?.classList.toggle("is-open") || false;
  navBookingToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const href = link.getAttribute("href") || "";

    if (href.startsWith("#") && href.length > 1) {
      lockedNavTarget = href;
      setActiveNavLink(href);
    }

    body.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
    closeBookingMenu();
  });
});

document.addEventListener("click", (event) => {
  if (!navBooking?.contains(event.target)) {
    closeBookingMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeBookingMenu();
  }
});

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const targetHref = `#${entry.target.id}`;

      if (lockedNavTarget && lockedNavTarget !== targetHref) return;

      lockedNavTarget = "";
      setActiveNavLink(targetHref);
    });
  },
  { threshold: 0.48 }
);

document.querySelectorAll("section[id]").forEach((section) => {
  sectionObserver.observe(section);
});

let glowX = window.innerWidth / 2;
let glowY = window.innerHeight / 2;
let targetX = glowX;
let targetY = glowY;

function moveGlow() {
  glowX += (targetX - glowX) * 0.12;
  glowY += (targetY - glowY) * 0.12;

  if (cursorGlow) {
    cursorGlow.style.left = `${glowX}px`;
    cursorGlow.style.top = `${glowY}px`;
  }

  requestAnimationFrame(moveGlow);
}

if (cursorGlow && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  window.addEventListener("pointermove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
  });

  moveGlow();
} else if (cursorGlow) {
  cursorGlow.remove();
}

function getContactData(action = "whatsapp") {
  const data = new FormData(contactForm);

  return {
    action,
    name: String(data.get("name") || "").trim(),
    contact: String(data.get("contact") || "").trim(),
    message: String(data.get("message") || "").trim(),
    website: String(data.get("website") || "").trim(),
    turnstileToken: typeof turnstile !== "undefined" && turnstileWidgetId !== null ? turnstile.getResponse(turnstileWidgetId) : "",
  };
}

function getContactText() {
  const { name, contact, message } = getContactData();

  return [
    "Olá Noir Detail, quero marcar um serviço.",
    name ? `Nome: ${name}` : "",
    contact ? `Contacto: ${contact}` : "",
    message ? `Mensagem: ${message}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function getWhatsAppLink(body = "Olá Noir Detail, quero marcar um serviço.") {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(body)}`;
}

function getMailLink(body = "Olá Noir Detail, quero marcar um serviço.") {
  const subject = "Marcação Noir Detail";

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function getRecentBookingAttempts() {
  try {
    const attempts = JSON.parse(localStorage.getItem(bookingRateKey) || "[]");
    const now = Date.now();

    return attempts.filter((time) => now - Number(time) < bookingWindowMs);
  } catch {
    return [];
  }
}

function canStartBooking() {
  const attempts = getRecentBookingAttempts();

  if (attempts.length >= maxBookingAttempts) {
    setFormStatus("Demasiadas tentativas seguidas. Tenta novamente dentro de alguns minutos.");
    return false;
  }

  attempts.push(Date.now());

  try {
    localStorage.setItem(bookingRateKey, JSON.stringify(attempts));
  } catch {
    return true;
  }

  setFormStatus("");

  return true;
}

function passesBotChecks() {
  const data = getContactData();

  if (data.website) {
    setFormStatus("Não foi possível enviar a marcação.");
    return false;
  }

  if (Date.now() - formStartedAt < minFormTimeMs) {
    setFormStatus("Aguarda um momento antes de enviar a marcação.");
    return false;
  }

  if (captchaRequired && !data.turnstileToken) {
    setFormStatus("Confirma que não és um bot antes de enviar.");
    return false;
  }

  return true;
}

emailBookingLinks.forEach((link) => {
  link.setAttribute("href", getMailLink());
});

whatsappBookingLinks.forEach((link) => {
  link.setAttribute("href", getWhatsAppLink());
});

function setFormLoading(isLoading) {
  contactForm?.querySelectorAll("button, input, textarea").forEach((item) => {
    item.disabled = isLoading;
  });
}

function resetCaptcha() {
  if (typeof turnstile !== "undefined" && turnstileWidgetId !== null) {
    turnstile.reset(turnstileWidgetId);
  }
}

async function setupTurnstile() {
  if (!turnstileBox) return;

  turnstileBox.hidden = true;
  setFormStatus("A carregar proteção anti-spam...");

  try {
    const response = await fetch("/api/config", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Config request failed: ${response.status}`);
    }

    const config = await response.json();

    captchaRequired = Boolean(config.captchaRequired);

    if (!config.captchaRequired) {
      captchaRequired = false;
      turnstileBox.hidden = true;
      setFormStatus("");
      return;
    }

    if (!config.turnstileSiteKey) {
      turnstileBox.hidden = true;
      setFormStatus(
        "O CAPTCHA não está configurado no servidor. Define TURNSTILE_SITE_KEY e TURNSTILE_SECRET_KEY e reinicia o servidor."
      );
      return;
    }

    const waitForTurnstile = new Promise((resolve, reject) => {
      const deadline = Date.now() + 12000;

      const check = () => {
        if (typeof window.turnstile !== "undefined") {
          return resolve();
        }

        if (Date.now() > deadline) {
          return reject(new Error("Turnstile script did not load."));
        }

        window.setTimeout(check, 120);
      };

      check();
    });

    await waitForTurnstile();

    turnstileBox.hidden = false;
    setFormStatus("");

    turnstileWidgetId = turnstile.render(turnstileBox, {
      sitekey: config.turnstileSiteKey,
      theme: "dark",
    });
  } catch (error) {
    backendAvailable = false;
    captchaRequired = false;
    turnstileBox.hidden = true;
    console.error("Turnstile setup failed:", error);
    setFormStatus("");
  }
}

async function submitBooking(action) {
  if (!contactForm?.reportValidity()) return;

  if (!passesBotChecks() || !canStartBooking()) return;

  if (!backendAvailable) {
    const fallbackUrl = action === "email" ? getMailLink(getContactText()) : getWhatsAppLink(getContactText());
    window.open(fallbackUrl, "_blank", "noopener");
    setFormStatus(action === "email" ? "A abrir o cliente de email..." : "A abrir o WhatsApp...");
    return;
  }

  setFormLoading(true);
  setFormStatus("A enviar marcação...");

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(getContactData(action)),
    });

    const result = await response.json();

    if (!response.ok) {
      setFormStatus(result.error || "Não foi possível enviar a marcação.");
      resetCaptcha();
      return;
    }

    if (result.redirectUrl) {
      window.open(result.redirectUrl, "_blank", "noopener");
      setFormStatus("Marcação validada. O WhatsApp vai abrir numa nova janela.");
    } else {
      setFormStatus(result.message || "Mensagem enviada com sucesso.");
      contactForm.reset();
      resetCaptcha();
    }
  } catch {
    setFormStatus("Não foi possível ligar ao servidor. Tenta novamente.");
    resetCaptcha();
  } finally {
    setFormLoading(false);
  }
}

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  submitBooking("whatsapp");
});

emailSubmit?.addEventListener("click", () => {
  submitBooking("email");
});

bookingLinks.forEach((link) => {
  if (link.classList.contains("email-submit")) return;

  link.addEventListener("click", (event) => {
    if (!canStartBooking()) {
      event.preventDefault();
    }
  });
});

setupTurnstile();
