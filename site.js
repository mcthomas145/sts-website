// Supreme Truck Sales website. Inventory and inquiries connect to the STS management system.
const WORKER_URL = "https://sts-dealer.matt-c78.workers.dev";

const $ = (s, el = document) => el.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
const title = (u) => [u.year, u.make, u.model].filter(Boolean).join(" ");
let UNITS = [], DEALER = {};

// mobile menu
const menu = $(".menu"), nav = $(".nav");
if (menu) menu.addEventListener("click", () => { const open = nav.classList.toggle("open"); menu.setAttribute("aria-expanded", open); });

function fillDealer() {
  const tel = (DEALER.phone || "").replace(/[^\d+]/g, "");
  document.querySelectorAll("[data-phone]").forEach((el) => { if (!tel) return; el.hidden = false; el.href = "tel:" + tel; const t = $("[data-phone-text]", el) || el; t.textContent = (el.dataset.phone || "") + DEALER.phone; });
  document.querySelectorAll("[data-email]").forEach((el) => { if (!DEALER.email) return; el.hidden = false; el.href = "mailto:" + DEALER.email; el.textContent = DEALER.email; });
  document.querySelectorAll("[data-address]").forEach((el) => { if (DEALER.address) el.textContent = DEALER.address; });
}

function card(u) {
  const specs = [u.mileage != null ? Number(u.mileage).toLocaleString() + " miles" : "", u.engine, u.transmission, u.config].filter(Boolean);
  return `<button class="tc" data-id="${u.id}">
    <div class="ph">${u.photos[0] ? `<img src="${esc(u.photos[0])}" alt="${esc(title(u))}" loading="lazy">` : "Photos coming soon"}</div>
    ${u.stock_no ? `<span class="tag">Unit ${esc(u.stock_no)}</span>` : ""}${u.status !== "Available" ? `<span class="flag">${esc(u.status)}</span>` : ""}
    <div class="bd"><div class="ttl">${esc(title(u))}</div><div class="price">${u.price != null ? money(u.price) : "Call for price"}</div>
    <ul class="specs">${specs.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div></button>`;
}
const emptyMsg = `<div class="empty"><h3>New trucks are on the way</h3><p>Our next units are being prepared for sale. Tell us what you are looking for and we will contact you when a match arrives.</p><a class="btn" href="contact.html">Tell us what you need</a></div>`;

function drawInventory() {
  const grid = $("#grid"); if (!grid) return;
  const q = $("#q").value.trim().toLowerCase(), make = $("#make").value, sort = $("#sort").value;
  let list = UNITS.filter((u) => (!make || u.make === make) && (!q || [u.stock_no, u.year, u.make, u.model, u.engine, u.transmission, u.config, u.type].join(" ").toLowerCase().includes(q)));
  const big = Number.MAX_SAFE_INTEGER;
  const by = { plow: (a, b) => (a.price ?? big) - (b.price ?? big), phigh: (a, b) => (b.price ?? -1) - (a.price ?? -1), miles: (a, b) => (a.mileage ?? big) - (b.mileage ?? big), year: (a, b) => (b.year ?? 0) - (a.year ?? 0) }[sort];
  if (by) list = [...list].sort(by);
  $("#count").textContent = UNITS.length ? `${list.length} truck${list.length === 1 ? "" : "s"} listed` : "";
  grid.innerHTML = UNITS.length ? (list.length ? list.map(card).join("") : `<p>No trucks match that search. <a href="inventory.html">Show all trucks</a></p>`) : emptyMsg;
}
function drawFeatured() {
  const el = $("#featured"); if (!el) return;
  el.innerHTML = UNITS.length ? `<div class="grid">${UNITS.slice(0, 4).map(card).join("")}</div>` : emptyMsg;
}
function vehicleSchema() {
  if (!UNITS.length || !$("#grid")) return;
  const s = document.createElement("script"); s.type = "application/ld+json";
  s.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", itemListElement: UNITS.map((u, i) => ({ "@type": "ListItem", position: i + 1, item: {
    "@type": "Vehicle", name: title(u), url: `https://ststrucksales.com/inventory.html?unit=${u.id}`, image: u.photos.slice(0, 5), sku: u.stock_no || undefined,
    vehicleModelDate: u.year || undefined, brand: u.make ? { "@type": "Brand", name: u.make } : undefined, model: u.model || undefined, color: u.color || undefined,
    mileageFromOdometer: u.mileage != null ? { "@type": "QuantitativeValue", value: u.mileage, unitCode: "SMI" } : undefined, vehicleTransmission: u.transmission || undefined,
    itemCondition: "https://schema.org/UsedCondition", description: u.description || undefined,
    offers: u.price != null ? { "@type": "Offer", price: u.price, priceCurrency: "USD", availability: "https://schema.org/InStock", seller: { "@type": "AutoDealer", name: "Supreme Truck Sales" } } : undefined } })) });
  document.head.appendChild(s);
}

function leadForm(unitId) {
  return `<form data-lead ${unitId ? `data-unit="${unitId}"` : ""}>
    <label>Name<input name="name" required autocomplete="name"></label>
    <label>Phone<input name="phone" required inputmode="tel" autocomplete="tel"></label>
    <label>Email (optional)<input name="email" type="email" autocomplete="email"></label>
    <label>Message (optional)<textarea name="message" rows="3"></textarea></label>
    <div class="hp" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
    <div class="msg" role="status"></div><button class="btn">Send inquiry</button>
    <p class="consent">By sending this form you agree that we may contact you by phone, text or email about your inquiry. See our <a href="privacy.html">privacy policy</a>.</p></form>`;
}
function openUnit(id) {
  const u = UNITS.find((x) => x.id === id); if (!u) return;
  const specs = [["Unit", u.stock_no], ["VIN", u.vin], ["Mileage", u.mileage != null ? Number(u.mileage).toLocaleString() : ""], ["Cab", u.config], ["Engine", u.engine], ["Horsepower", u.hp], ["Transmission", u.transmission], ["Axles", u.axle], ["Rear ratio", u.ratio], ["Suspension", u.suspension], ["Wheelbase", u.wheelbase], ["Tires and wheels", u.tires], ["Color", u.color], ["Location", u.location]].filter((s) => s[1] != null && s[1] !== "");
  $("#modal").innerHTML = `<div class="overlay" data-close><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title(u))}">
    <div class="mh"><h2>${esc(title(u))}</h2><button class="btn line" data-close>Close</button></div>
    <div class="cols"><div>
      ${u.photos.length ? `<img class="big" id="big" src="${esc(u.photos[0])}" alt="${esc(title(u))}">${u.photos.length > 1 ? `<div class="thumbs">${u.photos.map((p, i) => `<button class="${i ? "" : "on"}" data-photo="${esc(p)}" aria-label="Photo ${i + 1}"><img src="${esc(p)}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}` : `<div class="big tc"><div class="ph" style="height:100%">Photos coming soon</div></div>`}
      ${u.description ? `<h3>About this truck</h3><p class="pre">${esc(u.description)}</p>` : ""}
      ${u.features.length ? `<h3>Features</h3><ul>${u.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}
      ${u.warranty ? `<h3>Warranty</h3><p class="pre">${esc(u.warranty)}</p>` : ""}
    </div><div>
      <div class="price" style="font-size:2.4rem">${u.price != null ? money(u.price) : "Call for price"}</div>${u.status !== "Available" ? `<p><b>${esc(u.status)}</b></p>` : ""}
      <dl class="spec">${specs.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      <h3>Ask about this truck</h3>${leadForm(u.id)}
    </div></div></div></div>`;
  document.title = `${title(u)} for sale | Supreme Truck Sales`;
  history.replaceState(null, "", "inventory.html?unit=" + u.id);
}
function closeUnit() { if (!$("#modal") || !$("#modal").innerHTML) return; $("#modal").innerHTML = ""; if (location.search.includes("unit=")) history.replaceState(null, "", location.pathname); document.title = document.body.dataset.title || document.title; }

document.addEventListener("click", (e) => {
  const c = e.target.closest(".tc[data-id]");
  if (c) { if ($("#grid")) return openUnit(Number(c.dataset.id)); location.href = "inventory.html?unit=" + c.dataset.id; return; }
  const th = e.target.closest("[data-photo]");
  if (th) { $("#big").src = th.dataset.photo; document.querySelectorAll(".thumbs button").forEach((b) => b.classList.toggle("on", b === th)); return; }
  if (e.target.matches("[data-close]")) closeUnit();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeUnit(); });
document.addEventListener("submit", async (e) => {
  const f = e.target;
  if (f.matches("[data-find]")) { e.preventDefault(); const p = new URLSearchParams(new FormData(f)); for (const [k, v] of [...p]) if (!v) p.delete(k); location.href = "inventory.html" + (p.toString() ? "?" + p : ""); return; }
  if (!f.matches("[data-lead]")) return;
  e.preventDefault();
  const msg = $(".msg", f), btn = $("button", f), body = Object.fromEntries(new FormData(f));
  if (f.dataset.unit) body.unit_id = Number(f.dataset.unit);
  if (f.dataset.topic) body.message = `[${f.dataset.topic}] ${body.message || ""}`.trim();
  btn.disabled = true; msg.textContent = "Sending…";
  try {
    const r = await fetch(WORKER_URL + "/api/public/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Your message did not send. Please try again or call us.");
    f.innerHTML = `<h3>Message sent</h3><p>We have your inquiry and will contact you shortly.</p>`;
  } catch (err) { msg.textContent = err.message; btn.disabled = false; }
});
["input", "change"].forEach((ev) => document.addEventListener(ev, (e) => { if (["q", "make", "sort"].includes(e.target.id)) drawInventory(); }));

(async () => {
  document.body.dataset.title = document.title;
  try {
    const d = await (await fetch(WORKER_URL + "/api/public/inventory")).json();
    UNITS = d.units || []; DEALER = d.dealer || {};
  } catch { const c = $("#count"); if (c) c.textContent = "Inventory is temporarily unavailable. Please contact us."; }
  fillDealer(); drawFeatured();
  if ($("#grid")) {
    const makes = [...new Set(UNITS.map((u) => u.make).filter(Boolean))].sort();
    $("#make").insertAdjacentHTML("beforeend", makes.map((m) => `<option>${esc(m)}</option>`).join(""));
    const p = new URLSearchParams(location.search);
    if (p.get("q")) $("#q").value = p.get("q");
    if (p.get("make") && makes.includes(p.get("make"))) $("#make").value = p.get("make");
    drawInventory(); vehicleSchema();
    const id = Number(p.get("unit")); if (id) openUnit(id);
  }
  const fm = $("#findMake"); if (fm) fm.insertAdjacentHTML("beforeend", [...new Set(UNITS.map((u) => u.make).filter(Boolean))].sort().map((m) => `<option>${esc(m)}</option>`).join(""));
})();
