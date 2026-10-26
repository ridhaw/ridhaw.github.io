const USER = "ridhaw";
const API = "https://api.github.com";

const LANG_COLORS = {
  Python: "#3572A5", "C#": "#178600", Java: "#b07219", TypeScript: "#3178c6",
  JavaScript: "#f1e05a", "Jupyter Notebook": "#DA5B0B", Dart: "#00B4AB", HTML: "#e34c26",
};

const SKILLS = [
  { title: "⚙️ Backend", items: ["C#", ".NET / ASP.NET Core", "Entity Framework", "Java", "Spring Boot", "Spring Cloud", "JWT"] },
  { title: "🎨 Frontend", items: ["Next.js", "React", "TypeScript", "Angular", "Tailwind CSS"] },
  { title: "📱 Mobile", items: ["Flutter", "Android (Java)", "SQLite"] },
  { title: "🗄️ Données", items: ["PostgreSQL", "MySQL", "SQL Server"] },
  { title: "🧠 IA & data", items: ["Python", "PyTorch", "Transformers", "TensorFlow", "scikit-learn", "pandas"] },
  { title: "✨ IA générative", items: ["RAG", "Embeddings", "Recherche vectorielle", "API Claude"] },
  { title: "🚀 DevOps & qualité", items: ["Docker", "GitHub Actions", "Testcontainers", "xUnit", "pytest"] },
];

const ROLES = [
  "des API .NET robustes",
  "des microservices Spring",
  "des applications web Next.js",
  "des applications mobiles",
  "des modèles de machine learning",
  "des assistants d'IA générative",
];

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function relativeDate(iso) {
  const days = Math.round((Date.now() - new Date(iso)) / 86_400_000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days} jours`;
  const months = Math.round(days / 30);
  return months < 12 ? `il y a ${months} mois` : `il y a ${Math.round(months / 12)} an(s)`;
}

/* ---------- Thème ---------- */
$("#themeToggle").addEventListener("click", () => {
  const root = document.documentElement;
  const current = root.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  root.dataset.theme = current === "light" ? "dark" : "light";
  try { localStorage.setItem("theme", root.dataset.theme); } catch (e) { /* stockage indisponible */ }
});

/* ---------- Texte animé ---------- */
function typeRoles() {
  const el = $("#typed");
  if (reducedMotion) { el.textContent = ROLES[0]; return; }
  let role = 0, length = 0, deleting = false;
  const tick = () => {
    const word = ROLES[role];
    length += deleting ? -1 : 1;
    el.textContent = word.slice(0, length);
    let delay = deleting ? 35 : 70;
    if (!deleting && length === word.length) { deleting = true; delay = 1600; }
    else if (deleting && length === 0) { deleting = false; role = (role + 1) % ROLES.length; delay = 300; }
    setTimeout(tick, delay);
  };
  tick();
}

/* ---------- Compteurs ---------- */
function countUp(el, target) {
  if (reducedMotion) { el.textContent = target; return; }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / 1200);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- Compétences ---------- */
function renderSkills() {
  $("#skills-grid").innerHTML = SKILLS.map((s) => `
    <div class="skill"><h3>${s.title}</h3><ul>${s.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul></div>`).join("");
}

/* ---------- Projets (données locales + API GitHub en direct) ---------- */
let projects = [];

function renderProjects(filter = "all") {
  const list = projects.filter((p) => filter === "all" || p.category === filter);
  $("#projects-grid").innerHTML = list.map((p) => {
    const gh = p.github;
    const lang = gh?.language;
    const meta = gh
      ? `<span>${lang ? `<span class="lang-dot" style="background:${LANG_COLORS[lang] || "#888"}"></span>${escapeHtml(lang)}` : ""}</span>
         <span>★ ${gh.stargazers_count}</span>
         <span>Mis à jour ${relativeDate(gh.pushed_at)}</span>`
      : `<span>github.com/${USER}/${escapeHtml(p.repo)}</span>`;
    return `
      <a class="card" href="https://github.com/${USER}/${encodeURIComponent(p.repo)}" target="_blank" rel="noopener">
        <div class="card-head"><span class="emoji">${p.emoji}</span>${gh?.topics?.includes("github-actions") || p.highlight.includes("CI") ? '<span class="badge">CI</span>' : ""}</div>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.summary)}</p>
        <div class="highlight">▸ ${escapeHtml(p.highlight)}</div>
        <div class="tags">${p.stack.map((t) => `<span>#${escapeHtml(t)}</span>`).join("")}</div>
        <div class="meta">${meta}</div>
      </a>`;
  }).join("") || `<p class="muted">Aucun projet dans cette catégorie.</p>`;
}

document.querySelectorAll(".chip").forEach((chip) => chip.addEventListener("click", () => {
  document.querySelectorAll(".chip").forEach((c) => { c.classList.remove("active"); c.setAttribute("aria-selected", "false"); });
  chip.classList.add("active");
  chip.setAttribute("aria-selected", "true");
  renderProjects(chip.dataset.filter);
}));

async function loadProjects() {
  projects = await fetch("projects.json").then((r) => r.json());
  renderProjects();
  try {
    const repos = await fetch(`${API}/users/${USER}/repos?per_page=100&sort=pushed`).then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
    const byName = Object.fromEntries(repos.map((r) => [r.name, r]));
    projects = projects
      .map((p) => ({ ...p, github: byName[p.repo] }))
      .filter((p) => p.github || !repos.length);
    renderProjects(document.querySelector(".chip.active").dataset.filter);
    countUp($("#statProjects"), projects.length);
    countUp($("#statStars"), repos.reduce((sum, r) => sum + r.stargazers_count, 0));
    renderActivity(repos);
  } catch {
    countUp($("#statProjects"), projects.length);
    $("#activity-list").innerHTML = `<li class="muted">Activité indisponible pour le moment — voir <a href="https://github.com/${USER}">github.com/${USER}</a>.</li>`;
    // API indisponible ou limite atteinte : les fiches restent affichées sans les données en direct.
  }
}

/* ---------- Activité récente : dépôts poussés le plus récemment ---------- */
function renderActivity(repos) {
  const recent = repos.filter((r) => !r.fork && r.name !== USER).slice(0, 6);
  $("#activity-list").innerHTML = recent.length
    ? recent.map((r) => `<li><time datetime="${r.pushed_at}">${relativeDate(r.pushed_at)}</time>
        <a href="${r.html_url}" target="_blank" rel="noopener">${escapeHtml(r.name)}</a>
        ${r.description ? `<span class="muted"> — ${escapeHtml(r.description)}</span>` : ""}</li>`).join("")
    : `<li class="muted">Pas d'activité publique récente.</li>`;
}

/* ---------- Apparition au défilement ---------- */
function reveal() {
  const observer = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

$("#year").textContent = new Date().getFullYear();
document.querySelectorAll("[data-count]").forEach((el) => {
  if (el.id !== "statProjects") countUp(el, Number(el.dataset.count));
});
renderSkills();
typeRoles();
reveal();
loadProjects();
