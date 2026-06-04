/* ═══════════════════════════════════════════════════
   QUIZ-MONEY225 — app.js
   Backend: JSONBin.io
═══════════════════════════════════════════════════ */

const JSONBIN_BIN_ID  = "6a211a9ff5f4af5e29b659f0";
const JSONBIN_API_KEY = "$2a$10$r/C8bsUAzgvvOcrCWf9MwOmUH/r.wLICUszZHgSKQxACpugslGQWK";
const JSONBIN_URL     = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

// ── Default DB structure ──
const DEFAULT_DB = {
  users: [],
  transactions: [],
  recharges: [],
  withdrawals: [],
  questions: [
    { id: "q1", text: "Quelle est la capitale de la Côte d'Ivoire ?", a: "Abidjan", b: "Yamoussoukro", c: "Bouaké", d: "Daloa", correct: "b", category: "Géographie" },
    { id: "q2", text: "Combien vaut 15 × 8 ?", a: "110", b: "120", c: "130", d: "140", correct: "b", category: "Maths" },
    { id: "q3", text: "Quel est le plus grand pays d'Afrique en superficie ?", a: "Soudan", b: "RD Congo", c: "Algérie", d: "Nigeria", correct: "c", category: "Géographie" },
    { id: "q4", text: "En quelle année a eu lieu l'indépendance de la Côte d'Ivoire ?", a: "1958", b: "1960", c: "1962", d: "1964", correct: "b", category: "Histoire" },
    { id: "q5", text: "Quelle est la monnaie officielle de la Côte d'Ivoire ?", a: "Franc CFA", b: "Cedis", c: "Naira", d: "Dalasi", correct: "a", category: "Économie" },
    { id: "q6", text: "Combien font 2³ + 3² ?", a: "15", b: "16", c: "17", d: "18", correct: "c", category: "Maths" },
    { id: "q7", text: "Quel est l'élément chimique de symbole 'O' ?", a: "Or", b: "Osmium", c: "Oxygène", d: "Ozone", correct: "c", category: "Sciences" },
    { id: "q8", text: "Qui a peint la Joconde ?", a: "Michel-Ange", b: "Raphaël", c: "Donatello", d: "Léonard de Vinci", correct: "d", category: "Culture" },
    { id: "q9", text: "Quel est le pays le plus peuplé d'Afrique ?", a: "Éthiopie", b: "RD Congo", c: "Nigeria", d: "Égypte", correct: "c", category: "Géographie" },
    { id: "q10", text: "Combien y a-t-il de minutes dans 3 heures et demie ?", a: "180", b: "200", c: "210", d: "220", correct: "c", category: "Maths" },
    { id: "q11", text: "Quelle planète est surnommée la planète rouge ?", a: "Vénus", b: "Jupiter", c: "Mars", d: "Saturne", correct: "c", category: "Sciences" },
    { id: "q12", text: "Quelle est la langue officielle du Brésil ?", a: "Espagnol", b: "Portugais", c: "Français", d: "Anglais", correct: "b", category: "Géographie" },
    { id: "q13", text: "Quel sport utilise un volant ?", a: "Tennis", b: "Squash", c: "Badminton", d: "Ping-pong", correct: "c", category: "Sport" },
    { id: "q14", text: "Combien d'os y a-t-il dans le corps humain adulte ?", a: "186", b: "196", c: "206", d: "216", correct: "c", category: "Sciences" },
    { id: "q15", text: "Qui est l'auteur des Misérables ?", a: "Émile Zola", b: "Victor Hugo", c: "Albert Camus", d: "Gustave Flaubert", correct: "b", category: "Culture" },
  ],
  tournaments: [
    { id: "t1", name: "Grand Tournoi Hebdo", description: "Gagnez jusqu'à 10 000 FCFA !", entry_fee: 500, prize: 10000, status: "open", participants: [] },
    { id: "t2", name: "Tournoi Éclair", description: "Tournoi rapide - 5 questions", entry_fee: 200, prize: 3000, status: "open", participants: [] },
  ],
  community_messages: [],
  admin_logs: [],
  settings: { maintenance: false, bonus_amount: 100 }
};

// ── Cache ──
let dbLastFetch = 0;
const DB_CACHE_TTL = 30000; // 30 secondes

/* ═══════════════════════════════════════════════════
   SOUND SYSTEM (Web Audio API — aucun fichier requis)
═══════════════════════════════════════════════════ */
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playSound(type) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === "suspended") ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "click") {
      // Son court et net pour les boutons UI
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);

    } else if (type === "correct") {
      // Son victoire — deux notes montantes joyeuses
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(523, now);       // Do
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(784, now + 0.18); // Sol
      gain2.gain.setValueAtTime(0.3, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.5);

    } else if (type === "wrong") {
      // Son erreur — descente grave
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.4);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    }
  } catch (e) {
    // Son désactivé si le navigateur bloque
    console.warn("Sound error:", e);
  }
}

// ── State ──
let db = null;
let currentUser = null;
let sessionToken = null;

// Solo game state
let soloQuestions = [];
let soloCurrentQ  = 0;
let soloScore     = 0;
let soloSessionGain = 0;
let soloEncaissed   = 0;
let soloTimer = null;
let soloTimeLeft = 10;
let soloAnswered = false;

// Admin edit state
let adminEditUserId = null;

// Community polling
let communityInterval = null;
let selectedPaymentMethod = "";

/* ═══════════════════════════════════════════════════
   JSONBIN API
═══════════════════════════════════════════════════ */
async function dbRead(force = false) {
  const now = Date.now();
  // Use cache if data is fresh and not forcing a network call
  if (!force && db !== null && (now - dbLastFetch) < DB_CACHE_TTL) {
    return db;
  }
  try {
    const res = await fetch(JSONBIN_URL + "/latest", {
      headers: { "X-Master-Key": JSONBIN_API_KEY }
    });
    if (!res.ok) throw new Error("Read failed: " + res.status);
    const data = await res.json();
    db = { ...DEFAULT_DB, ...data.record };
    // Ensure all keys exist
    for (const key of Object.keys(DEFAULT_DB)) {
      if (!db[key]) db[key] = DEFAULT_DB[key];
    }
    dbLastFetch = Date.now();
    return db;
  } catch (e) {
    console.error("dbRead error:", e);
    if (db === null) db = { ...DEFAULT_DB };
    return db;
  }
}

// Force un vrai appel réseau (utilisé avant les opérations critiques)
async function dbReadFresh() {
  return dbRead(true);
}

async function dbWrite() {
  try {
    const res = await fetch(JSONBIN_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_API_KEY
      },
      body: JSON.stringify(db)
    });
    if (!res.ok) throw new Error("Write failed: " + res.status);
    return true;
  } catch (e) {
    console.error("dbWrite error:", e);
    return false;
  }
}

/* ═══════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════ */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}
function hashPassword(p) {
  // Simple hash for demo (in production use bcrypt/server-side)
  let h = 0;
  for (let i = 0; i < p.length; i++) {
    h = ((h << 5) - h) + p.charCodeAt(i);
    h |= 0;
  }
  return "h_" + Math.abs(h).toString(36) + "_" + p.length;
}
function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function getUserLevel(balance) {
  if (balance < 1000)  return "Niveau 1 ⭐";
  if (balance < 5000)  return "Niveau 2 ⭐⭐";
  if (balance < 15000) return "Niveau 3 ⭐⭐⭐";
  return "Niveau 4 👑";
}
function getUserEmoji(balance) {
  if (balance < 1000)  return "🎮";
  if (balance < 5000)  return "🌟";
  if (balance < 15000) return "💎";
  return "👑";
}
function showToast(msg, type = "info") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast " + type;
  setTimeout(() => t.classList.add("hidden"), 3000);
}
function showScreen(id) {
  playSound("click");
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  // Load data for screens
  if (id === "home-screen")       loadHome();
  if (id === "wallet-screen")     loadWallet();
  if (id === "withdraw-screen")   loadWithdraw();
  if (id === "community-screen")  loadCommunity();
  if (id === "tournament-screen") loadTournaments();
  if (id === "admin-screen")      loadAdmin();
  if (id === "solo-screen")       startSoloGame();
}
function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

/* ═══════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════ */
window.addEventListener("DOMContentLoaded", async () => {
  // Show splash
  showScreen("splash-screen");

  // Try restore session
  const savedSession = sessionStorage.getItem("qm225_session");
  if (savedSession) {
    try {
      const sess = JSON.parse(savedSession);
      await dbRead();
      const u = db.users.find(u => u.id === sess.uid && !u.banned);
      if (u) {
        currentUser = u;
        sessionToken = sess.token;
        setTimeout(() => showScreen("home-screen"), 2200);
        return;
      }
    } catch (e) {}
  }

  // Show auth after splash
  await dbRead();
  setTimeout(() => showScreen("auth-screen"), 2200);
});

/* ═══════════════════════════════════════════════════
   AUTH TABS
═══════════════════════════════════════════════════ */
document.querySelectorAll(".auth-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab + "-form").classList.add("active");
  });
});

/* ═══════════════════════════════════════════════════
   REGISTER
═══════════════════════════════════════════════════ */
async function register() {
  playSound("click");
  const pseudo   = document.getElementById("reg-pseudo").value.trim();
  const email    = document.getElementById("reg-email").value.trim().toLowerCase();
  const phone    = document.getElementById("reg-phone").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirm  = document.getElementById("reg-confirm").value;
  const errEl    = document.getElementById("reg-error");

  errEl.textContent = "";

  if (!pseudo || !email || !phone || !password || !confirm) {
    return errEl.textContent = "Tous les champs sont obligatoires.";
  }
  if (password !== confirm) {
    return errEl.textContent = "Les mots de passe ne correspondent pas.";
  }
  if (password.length < 6) {
    return errEl.textContent = "Mot de passe trop court (min 6 caractères).";
  }

  await dbReadFresh();

  if (db.users.find(u => u.email === email)) {
    return errEl.textContent = "Cet email est déjà utilisé.";
  }
  if (db.users.find(u => u.phone === phone)) {
    return errEl.textContent = "Ce numéro de téléphone est déjà utilisé.";
  }
  if (db.users.find(u => u.pseudo.toLowerCase() === pseudo.toLowerCase())) {
    return errEl.textContent = "Ce pseudo est déjà utilisé.";
  }

  const newUser = {
    id: uid(),
    pseudo,
    email,
    phone,
    password: hashPassword(password),
    game_balance: 300,
    withdraw_balance: 0,
    community_access: false,
    last_daily_bonus: null,
    banned: false,
    is_admin: false,
    created_at: Date.now()
  };

  db.users.push(newUser);
  db.transactions.push({
    id: uid(), user_id: newUser.id,
    type: "bonus", amount: 300, created_at: Date.now(),
    description: "🎁 Bonus de bienvenue inscription"
  });
  await dbWrite();
  dbLastFetch = Date.now(); // cache invalidation après écriture

  currentUser = newUser;
  sessionToken = uid();
  sessionStorage.setItem("qm225_session", JSON.stringify({ uid: newUser.id, token: sessionToken }));

  showScreen("home-screen");
  showToast("🎁 Bienvenue " + pseudo + " ! +300 FCFA offerts !", "success");
}

/* ═══════════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════════ */
async function login() {
  playSound("click");
  const email    = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const errEl    = document.getElementById("login-error");

  errEl.textContent = "";

  if (!email || !password) {
    return errEl.textContent = "Email et mot de passe requis.";
  }

  await dbReadFresh();

  const user = db.users.find(u => u.email === email && u.password === hashPassword(password));
  if (!user) {
    return errEl.textContent = "Email ou mot de passe incorrect.";
  }
  if (user.banned) {
    return errEl.textContent = "Votre compte a été suspendu.";
  }

  currentUser = user;
  sessionToken = uid();
  sessionStorage.setItem("qm225_session", JSON.stringify({ uid: user.id, token: sessionToken }));

  showScreen("home-screen");
  showToast("Content de te revoir " + user.pseudo + " ! 👋", "success");
}

/* ═══════════════════════════════════════════════════
   LOGOUT
═══════════════════════════════════════════════════ */
function logout() {
  currentUser = null;
  sessionToken = null;
  sessionStorage.removeItem("qm225_session");
  if (communityInterval) clearInterval(communityInterval);
  showScreen("auth-screen");
  showToast("Déconnecté.", "info");
}

/* ═══════════════════════════════════════════════════
   HOME
═══════════════════════════════════════════════════ */
async function loadHome() {
  if (!currentUser) return;

  await dbReadFresh();
  currentUser = db.users.find(u => u.id === currentUser.id) || currentUser;

  // Header
  document.getElementById("home-avatar").textContent = getUserEmoji(currentUser.withdraw_balance);
  document.getElementById("home-pseudo").textContent  = currentUser.pseudo;
  document.getElementById("home-level").textContent   = getUserLevel(currentUser.withdraw_balance);

  // Balances
  document.getElementById("home-game-balance").textContent     = currentUser.game_balance.toLocaleString('fr-FR');
  document.getElementById("home-withdraw-balance").textContent = currentUser.withdraw_balance.toLocaleString('fr-FR');

  // Daily bonus
  const bonusBtn = document.getElementById("daily-bonus-btn");
  const today = new Date().toDateString();
  if (currentUser.last_daily_bonus === today) {
    bonusBtn.classList.add("claimed");
    bonusBtn.querySelector("span:last-child").textContent = "Bonus déjà récupéré aujourd'hui ✓";
  } else {
    bonusBtn.classList.remove("claimed");
    bonusBtn.querySelector("span:last-child").textContent = "Récupérer mon bonus quotidien +100 FCFA";
  }

  // Admin button
  if (currentUser.is_admin) {
    const adminBtn = document.createElement("button");
    adminBtn.className = "btn-primary";
    adminBtn.style.cssText = "margin: 0 16px; width: calc(100% - 32px);";
    adminBtn.innerHTML = "⚙️ Panel Admin";
    adminBtn.onclick = () => showScreen("admin-screen");
    const existing = document.getElementById("admin-home-btn");
    if (!existing) {
      adminBtn.id = "admin-home-btn";
      document.querySelector(".leaderboard-section").before(adminBtn);
    }
  }

  // Leaderboard
  loadLeaderboard();
}

function loadLeaderboard() {
  const sorted = [...db.users]
    .filter(u => !u.banned)
    .sort((a, b) => b.withdraw_balance - a.withdraw_balance)
    .slice(0, 10);

  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";

  if (sorted.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);text-align:center;font-size:14px;padding:20px">Aucun joueur encore.</p>';
    return;
  }

  sorted.forEach((u, i) => {
    const rankClass = i === 0 ? "r1" : i === 1 ? "r2" : i === 2 ? "r3" : "rn";
    const medals = ["🥇", "🥈", "🥉"];
    const rankDisplay = i < 3 ? medals[i] : "#" + (i + 1);
    const isMe = u.id === currentUser.id;

    const item = document.createElement("div");
    item.className = "lb-item";
    item.style.animationDelay = (i * 0.05) + "s";
    if (isMe) item.style.borderColor = "var(--gold)";

    item.innerHTML = `
      <div class="lb-rank ${rankClass}">${rankDisplay}</div>
      <div class="lb-avatar">${getUserEmoji(u.withdraw_balance)}</div>
      <div class="lb-name">${u.pseudo}${isMe ? ' <span style="color:var(--gold);font-size:11px">(vous)</span>' : ''}</div>
      <div class="lb-amount">${u.withdraw_balance.toLocaleString('fr-FR')} FCFA</div>
    `;
    list.appendChild(item);
  });
}

/* ═══════════════════════════════════════════════════
   DAILY BONUS
═══════════════════════════════════════════════════ */
async function claimDailyBonus() {
  if (!currentUser) return;
  const today = new Date().toDateString();
  if (currentUser.last_daily_bonus === today) return;

  await dbReadFresh();
  const idx = db.users.findIndex(u => u.id === currentUser.id);
  if (idx === -1) return;

  if (db.users[idx].last_daily_bonus === today) {
    showToast("Bonus déjà récupéré aujourd'hui.", "error");
    return;
  }

  playSound("correct");
  const bonusAmt = db.settings?.bonus_amount || 100;
  db.users[idx].game_balance += bonusAmt;
  db.users[idx].last_daily_bonus = today;

  db.transactions.push({
    id: uid(), user_id: currentUser.id,
    type: "bonus", amount: bonusAmt, created_at: Date.now(),
    description: "Bonus quotidien"
  });

  await dbWrite();
  dbLastFetch = Date.now(); // cache invalidation après écriture
  currentUser = db.users[idx];
  loadHome();
  showToast("🎁 +" + bonusAmt + " FCFA ajoutés à votre solde jeu !", "success");
}

/* ═══════════════════════════════════════════════════
   SOLO QUIZ
═══════════════════════════════════════════════════ */
async function startSoloGame() {
  playSound("click");
  if (!currentUser) return;

  await dbReadFresh();
  const idx = db.users.findIndex(u => u.id === currentUser.id);
  if (db.users[idx].game_balance < 100) {
    showToast("⚠️ Solde de jeu insuffisant ! Rechargez pour jouer.", "error");
    setTimeout(() => showScreen("recharge-screen"), 800);
    return;
  }

  // Deduct 100 FCFA
  db.users[idx].game_balance -= 100;
  db.transactions.push({
    id: uid(), user_id: currentUser.id,
    type: "game", amount: -100, created_at: Date.now(),
    description: "Mise Quiz Solo"
  });
  await dbWrite();
  dbLastFetch = Date.now(); // cache invalidation après écriture
  currentUser = db.users[idx];

  // Update pregame balance display
  document.getElementById("pregame-balance").textContent = currentUser.game_balance.toLocaleString('fr-FR');

  // Pick 10 random questions
  const allQ = [...db.questions];
  soloQuestions = allQ.sort(() => Math.random() - 0.5).slice(0, 10);

  soloCurrentQ    = 0;
  soloScore       = 0;
  soloSessionGain = 0;
  soloEncaissed   = 0;
  soloAnswered    = false;

  document.getElementById("solo-pregame").classList.add("hidden");
  document.getElementById("solo-result").classList.add("hidden");
  document.getElementById("solo-result-lose").classList.add("hidden");
  document.getElementById("solo-result-encaiss").classList.add("hidden");
  document.getElementById("solo-game").classList.remove("hidden");

  // Désactiver le bouton quitter pendant la partie
  const backBtn = document.querySelector("#solo-screen .btn-back");
  if (backBtn) {
    backBtn.disabled = true;
    backBtn.style.opacity = "0.35";
    backBtn.style.cursor = "not-allowed";
    backBtn.title = "Impossible de quitter pendant une partie";
  }

  renderQuestion();
}

function renderQuestion() {
  if (soloCurrentQ >= soloQuestions.length) {
    endSoloGame();
    return;
  }

  const q = soloQuestions[soloCurrentQ];
  soloAnswered = false;
  soloTimeLeft = 5;

  document.getElementById("q-current").textContent = soloCurrentQ + 1;
  document.getElementById("q-score").textContent   = soloScore;
  document.getElementById("q-category").textContent = q.category || "Général";
  document.getElementById("q-text").textContent    = q.text;

  // Update encaiss button
  updateEncaissBtn();

  // Render answers
  const grid = document.getElementById("answers-grid");
  grid.innerHTML = "";
  const labels = ["A", "B", "C", "D"];
  const keys   = ["a", "b", "c", "d"];
  keys.forEach((key, i) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.innerHTML = `<span class="answer-label">${labels[i]}</span>${q[key]}`;
    btn.onclick = () => handleAnswer(key, btn, q.correct);
    grid.appendChild(btn);
  });

  // Start timer
  clearInterval(soloTimer);
  updateTimerRing(5, 5);

  soloTimer = setInterval(() => {
    soloTimeLeft--;
    updateTimerRing(soloTimeLeft, 5);
    if (soloTimeLeft <= 0) {
      clearInterval(soloTimer);
      if (!soloAnswered) timeoutAnswer();
    }
  }, 1000);
}

function updateTimerRing(current, max) {
  const circumference = 113.1;
  const offset = circumference - (current / max) * circumference;
  const circle = document.getElementById("timer-circle");
  const display = document.getElementById("timer-display");
  circle.style.strokeDashoffset = offset;
  display.textContent = current;

  if (current <= 1) circle.style.stroke = "#e74c3c";
  else if (current <= 3) circle.style.stroke = "#f39c12";
  else circle.style.stroke = "#FFD700";
}

function handleAnswer(key, btn, correct) {
  if (soloAnswered) return;
  soloAnswered = true;
  clearInterval(soloTimer);

  const allBtns = document.querySelectorAll(".answer-btn");
  allBtns.forEach(b => b.disabled = true);

  if (key === correct) {
    playSound("correct");
    btn.classList.add("correct");
    soloScore++;
    soloSessionGain += 25;
    updateEncaissBtn();
    showToast("+25 FCFA 💰", "success");

    setTimeout(() => {
      soloCurrentQ++;
      if (soloCurrentQ >= soloQuestions.length) {
        endSoloGame();
      } else {
        renderQuestion();
      }
    }, 1200);
  } else {
    playSound("wrong");
    btn.classList.add("wrong");
    // Mark correct
    const keys = ["a", "b", "c", "d"];
    const correctIdx = keys.indexOf(correct);
    allBtns[correctIdx].classList.add("correct");

    // Wrong answer: lose all accumulated session gains, game over
    const lostGain = soloSessionGain;
    soloSessionGain = 0;
    updateEncaissBtn();
    if (lostGain > 0) {
      showToast("❌ Mauvaise réponse ! Vous perdez " + lostGain + " FCFA accumulés !", "error");
    } else {
      showToast("❌ Mauvaise réponse ! Partie terminée.", "error");
    }

    setTimeout(() => {
      endSoloGame(false, true, false, lostGain); // wrongAnswer = true
    }, 1800);
  }
}

function timeoutAnswer() {
  playSound("wrong");
  soloAnswered = true;
  const allBtns = document.querySelectorAll(".answer-btn");
  allBtns.forEach(b => b.disabled = true);

  const keys = ["a", "b", "c", "d"];
  const q = soloQuestions[soloCurrentQ];
  const correctIdx = keys.indexOf(q.correct);
  if (allBtns[correctIdx]) allBtns[correctIdx].classList.add("correct");

  const lostGain = soloSessionGain;
  soloSessionGain = 0;
  updateEncaissBtn();

  if (lostGain > 0) {
    showToast("⏱️ Temps écoulé ! Vous perdez " + lostGain + " FCFA accumulés !", "error");
  } else {
    showToast("⏱️ Temps écoulé ! Partie terminée.", "error");
  }

  setTimeout(() => {
    endSoloGame(false, true, false, lostGain); // wrongAnswer = true
  }, 1800);
}

function updateEncaissBtn() {
  document.getElementById("session-gain-display").textContent = currentUser ? currentUser.game_balance.toLocaleString('fr-FR') : 0;
  document.getElementById("encaiss-amount").textContent       = soloSessionGain;
}

async function encaisser() {
  if (soloSessionGain === 0) {
    showToast("Aucun gain à encaisser.", "info");
    return;
  }
  clearInterval(soloTimer);

  const gainToAdd = soloSessionGain;
  soloEncaissed  += gainToAdd;
  soloSessionGain = 0;
  updateEncaissBtn();

  // Credit to withdraw_balance
  await dbReadFresh();
  const idx = db.users.findIndex(u => u.id === currentUser.id);
  db.users[idx].withdraw_balance += gainToAdd;
  db.transactions.push({
    id: uid(), user_id: currentUser.id,
    type: "game", amount: gainToAdd, created_at: Date.now(),
    description: "Gains Quiz Solo encaissés → Solde retrait"
  });
  await dbWrite();
  dbLastFetch = Date.now(); // cache invalidation après écriture
  currentUser = db.users[idx];

  showToast("✅ " + gainToAdd + " FCFA encaissés !", "success");

  // End the game and show félicitations
  endSoloGame(false, false, true);
}

function confirmQuitSolo() {
  clearInterval(soloTimer);
  document.getElementById("modal-quit-gain").textContent = soloSessionGain;
  document.getElementById("modal-quit").classList.remove("hidden");
}

async function quitAndEncaiss() {
  closeModal("modal-quit");
  if (soloSessionGain > 0) {
    await encaisser();
  }
  endSoloGame(true);
}

async function endSoloGame(quit = false, wrongAnswer = false, encaissed = false, lostGain = 0) {
  clearInterval(soloTimer);

  // Hide game
  document.getElementById("solo-game").classList.add("hidden");
  document.getElementById("solo-pregame").classList.add("hidden");

  // Réactiver le bouton quitter
  const backBtn = document.querySelector("#solo-screen .btn-back");
  if (backBtn) {
    backBtn.disabled = false;
    backBtn.style.opacity = "";
    backBtn.style.cursor = "";
    backBtn.title = "";
  }

  // Transfer remaining session gains only if game ended naturally
  if (!quit && !wrongAnswer && !encaissed && soloSessionGain > 0) {
    const gainToAdd = soloSessionGain;
    soloEncaissed  += gainToAdd;
    soloSessionGain = 0;

    await dbReadFresh();
    const idx = db.users.findIndex(u => u.id === currentUser.id);
    db.users[idx].withdraw_balance += gainToAdd;
    db.transactions.push({
      id: uid(), user_id: currentUser.id,
      type: "game", amount: gainToAdd, created_at: Date.now(),
      description: "Gains Quiz Solo (fin de partie) → Solde retrait"
    });
    await dbWrite();
    dbLastFetch = Date.now();
    currentUser = db.users[idx];
  }

  const ratio = soloScore + "/" + soloQuestions.length;

  // === Page DÉFAITE ===
  if (wrongAnswer && !encaissed) {
    document.getElementById("solo-result").classList.add("hidden");
    document.getElementById("solo-result-encaiss").classList.add("hidden");
    document.getElementById("solo-result-lose").classList.remove("hidden");

    document.getElementById("lose-score").textContent = ratio;
    document.getElementById("lose-amount").textContent = lostGain > 0 ? lostGain + " FCFA" : "0 FCFA";
    document.getElementById("lose-subtitle").textContent =
      lostGain > 0 ? "Tu as perdu " + lostGain + " FCFA accumulés 😤" : "Pas de chance cette fois !";
    return;
  }

  // === Page ENCAISSEMENT ===
  if (encaissed) {
    document.getElementById("solo-result").classList.add("hidden");
    document.getElementById("solo-result-lose").classList.add("hidden");
    document.getElementById("solo-result-encaiss").classList.remove("hidden");

    document.getElementById("encaiss-final-amount").textContent = soloEncaissed + " FCFA";
    document.getElementById("encaiss-final-score").textContent = ratio;
    return;
  }

  // === Page résultat normal (fin des 10 questions ou quit) ===
  document.getElementById("solo-result-lose").classList.add("hidden");
  document.getElementById("solo-result-encaiss").classList.add("hidden");
  document.getElementById("solo-result").classList.remove("hidden");

  let emoji = "😅";
  if (soloScore >= 8) emoji = "🏆";
  else if (soloScore >= 5) emoji = "🎉";
  else if (soloScore >= 3) emoji = "👍";

  document.getElementById("result-emoji").textContent = emoji;
  document.getElementById("result-title").textContent = quit ? "Partie interrompue" : "Partie terminée !";
  document.getElementById("r-score").textContent = ratio;
  document.getElementById("r-gain").textContent  = soloEncaissed + " FCFA";
}

/* ═══════════════════════════════════════════════════
   TOURNAMENTS
═══════════════════════════════════════════════════ */
async function loadTournaments() {
  await dbReadFresh();
  const list = document.getElementById("tournament-list");
  list.innerHTML = "";

  if (!db.tournaments || db.tournaments.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);text-align:center;font-size:14px;padding:40px">Aucun tournoi disponible.</p>';
    return;
  }

  db.tournaments.forEach(t => {
    const isParticipant = t.participants && t.participants.includes(currentUser.id);
    const card = document.createElement("div");
    card.className = "tournament-card";
    card.innerHTML = `
      <h3>🏆 ${t.name}</h3>
      <p>${t.description}</p>
      <div class="tournament-meta">
        <span class="t-meta">💰 Mise: ${t.entry_fee} FCFA</span>
        <span class="t-meta">🎁 Prize: ${t.prize.toLocaleString('fr-FR')} FCFA</span>
        <span class="t-meta">👥 ${(t.participants || []).length} joueurs</span>
      </div>
      <div style="margin-top:14px">
        ${isParticipant
          ? '<button class="btn-secondary" disabled>✅ Inscrit</button>'
          : `<button class="btn-primary" onclick="joinTournament('${t.id}')">S'inscrire (${t.entry_fee} FCFA)</button>`
        }
      </div>
    `;
    list.appendChild(card);
  });
}

async function joinTournament(tid) {
  await dbReadFresh();
  const t = db.tournaments.find(x => x.id === tid);
  if (!t) return;

  const uIdx = db.users.findIndex(u => u.id === currentUser.id);
  if (db.users[uIdx].game_balance < t.entry_fee) {
    showToast("⚠️ Solde de jeu insuffisant ! Rechargez pour participer.", "error");
    setTimeout(() => showScreen("recharge-screen"), 800);
    return;
  }

  if (t.participants && t.participants.includes(currentUser.id)) {
    return showToast("Déjà inscrit à ce tournoi.", "info");
  }

  db.users[uIdx].game_balance -= t.entry_fee;
  if (!t.participants) t.participants = [];
  t.participants.push(currentUser.id);

  db.transactions.push({
    id: uid(), user_id: currentUser.id,
    type: "game", amount: -t.entry_fee, created_at: Date.now(),
    description: "Inscription tournoi: " + t.name
  });

  await dbWrite();
  dbLastFetch = Date.now(); // cache invalidation après écriture
  currentUser = db.users[uIdx];
  showToast("✅ Inscrit au tournoi !", "success");
  loadTournaments();
}

/* ═══════════════════════════════════════════════════
   WALLET
═══════════════════════════════════════════════════ */
async function loadWallet() {
  await dbReadFresh();
  currentUser = db.users.find(u => u.id === currentUser.id) || currentUser;

  document.getElementById("wallet-game").textContent     = currentUser.game_balance.toLocaleString('fr-FR');
  document.getElementById("wallet-withdraw").textContent = currentUser.withdraw_balance.toLocaleString('fr-FR');

  loadTransactions("all", document.querySelector(".filter-tab.active"));
}

async function loadTransactions(type, tabEl) {
  if (tabEl) {
    document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
    tabEl.classList.add("active");
  }

  await dbReadFresh();

  const allTx = [
    ...db.transactions.filter(t => t.user_id === currentUser.id),
    ...db.recharges.filter(r => r.user_id === currentUser.id).map(r => ({ ...r, type: "recharge" })),
    ...db.withdrawals.filter(w => w.user_id === currentUser.id).map(w => ({ ...w, type: "withdrawal" }))
  ].sort((a, b) => b.created_at - a.created_at);

  const filtered = type === "all" ? allTx : allTx.filter(t => t.type === type);

  const list = document.getElementById("transaction-list");
  list.innerHTML = "";

  if (filtered.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);text-align:center;font-size:14px;padding:30px">Aucune transaction.</p>';
    return;
  }

  const icons = { recharge: "⚡", withdrawal: "💸", game: "🎮", bonus: "🎁" };
  const labels = { recharge: "Recharge", withdrawal: "Retrait", game: "Jeu", bonus: "Bonus" };

  filtered.slice(0, 30).forEach(tx => {
    const isPos = tx.amount > 0;
    const item = document.createElement("div");
    item.className = "tx-item";
    item.innerHTML = `
      <div class="tx-left">
        <div class="tx-icon">${icons[tx.type] || "📝"}</div>
        <div class="tx-info">
          <span class="tx-type">${labels[tx.type] || tx.type}${tx.method ? " – " + tx.method : ""}${tx.description ? " – " + tx.description : ""}</span>
          <span class="tx-date">${formatDate(tx.created_at)}</span>
          ${tx.status ? `<span class="tx-status ${tx.status}">${tx.status}</span>` : ""}
        </div>
      </div>
      <div class="tx-amount ${isPos ? "positive" : "negative"}">${isPos ? "+" : ""}${tx.amount.toLocaleString('fr-FR')} FCFA</div>
    `;
    list.appendChild(item);
  });
}

/* ═══════════════════════════════════════════════════
   RECHARGE
═══════════════════════════════════════════════════ */
function selectPayment(method, el) {
  document.querySelectorAll(".payment-method").forEach(m => m.classList.remove("selected"));
  el.classList.add("selected");
  selectedPaymentMethod = method;

  const formSection = document.getElementById("recharge-form-section");
  formSection.classList.remove("hidden");
  document.getElementById("selected-method-title").textContent = "Paiement via " + method;
  document.getElementById("recharge-msg").classList.add("hidden");
}

function setAmount(amt) {
  document.getElementById("recharge-amount").value = amt;
}

async function processRecharge() {
  if (!selectedPaymentMethod) return showToast("Choisissez un mode de paiement.", "error");

  const amount = parseInt(document.getElementById("recharge-amount").value);
  if (!amount || amount < 100) return showToast("Montant minimum : 100 FCFA.", "error");
  if (amount > 10000) return showToast("Montant maximum : 10 000 FCFA.", "error");

  // Insert pending recharge immediately
  const recharge = {
    id: uid(),
    user_id: currentUser.id,
    pseudo: currentUser.pseudo,
    phone: currentUser.phone,
    email: currentUser.email,
    method: selectedPaymentMethod,
    amount,
    status: "pending",
    created_at: Date.now()
  };

  // Open payment link immediately (no wait)
  const msg = document.getElementById("recharge-msg");
  msg.classList.remove("hidden");
  msg.textContent = "✅ Demande envoyée ! Redirection vers le paiement…";
  window.open("https://pay.djamo.com/uij3p", "_blank");

  // Save to DB in background (no await)
  dbReadFresh().then(() => {
    db.recharges.push(recharge);
    dbWrite().then(() => { dbLastFetch = Date.now(); });
  });
}

function selectWithdrawMethod(method, el) {
  document.querySelectorAll(".withdraw-methods .payment-method").forEach(m => m.classList.remove("selected"));
  el.classList.add("selected");
  document.getElementById("withdraw-method").value = method;
}

/* ═══════════════════════════════════════════════════
   WITHDRAW
═══════════════════════════════════════════════════ */
async function loadWithdraw() {
  await dbReadFresh();
  currentUser = db.users.find(u => u.id === currentUser.id) || currentUser;
  document.getElementById("withdraw-phone").value = currentUser.phone;
  document.getElementById("withdraw-balance-display").textContent =
    currentUser.withdraw_balance.toLocaleString('fr-FR') + " FCFA";
  document.getElementById("withdraw-msg").classList.add("hidden");
  document.getElementById("withdraw-success").classList.add("hidden");
  // Reset method selection
  document.querySelectorAll(".withdraw-methods .payment-method").forEach(m => m.classList.remove("selected"));
  document.getElementById("withdraw-method").value = "";
}

async function processWithdraw() {
  const amount = parseInt(document.getElementById("withdraw-amount").value);
  const method = document.getElementById("withdraw-method").value;
  const msgEl  = document.getElementById("withdraw-msg");
  const okEl   = document.getElementById("withdraw-success");

  msgEl.classList.add("hidden");
  okEl.classList.add("hidden");

  if (!amount || amount < 500) {
    msgEl.textContent = "Montant minimum de retrait : 500 FCFA.";
    return msgEl.classList.remove("hidden");
  }
  if (!method) {
    msgEl.textContent = "Choisissez un mode de retrait.";
    return msgEl.classList.remove("hidden");
  }

  await dbReadFresh();
  const idx = db.users.findIndex(u => u.id === currentUser.id);
  if (db.users[idx].withdraw_balance < amount) {
    msgEl.textContent = "Solde de retrait insuffisant.";
    return msgEl.classList.remove("hidden");
  }

  // Deduct immediately
  db.users[idx].withdraw_balance -= amount;

  const withdrawal = {
    id: uid(),
    user_id: currentUser.id,
    pseudo: currentUser.pseudo,
    phone: currentUser.phone,
    method,
    amount,
    status: "pending",
    created_at: Date.now()
  };

  db.withdrawals.push(withdrawal);
  db.transactions.push({
    id: uid(), user_id: currentUser.id,
    type: "withdrawal", amount: -amount, created_at: Date.now(),
    description: "Retrait " + method
  });

  await dbWrite();
  dbLastFetch = Date.now(); // cache invalidation après écriture
  currentUser = db.users[idx];

  document.getElementById("withdraw-balance-display").textContent =
    currentUser.withdraw_balance.toLocaleString('fr-FR') + " FCFA";

  okEl.textContent = "✅ Demande de retrait envoyée ! Traitement sous 24h.";
  okEl.classList.remove("hidden");
  document.getElementById("withdraw-amount").value = "";
  showToast("Demande de retrait soumise !", "success");
}

/* ═══════════════════════════════════════════════════
   COMMUNITY
═══════════════════════════════════════════════════ */
async function loadCommunity() {
  if (!currentUser) return;
  await dbReadFresh();
  currentUser = db.users.find(u => u.id === currentUser.id) || currentUser;

  if (!currentUser.community_access) {
    document.getElementById("community-locked").classList.remove("hidden");
    document.getElementById("community-chat").classList.add("hidden");
  } else {
    document.getElementById("community-locked").classList.add("hidden");
    document.getElementById("community-chat").classList.remove("hidden");
    renderChatMessages();
    if (communityInterval) clearInterval(communityInterval);
    communityInterval = setInterval(fetchChatMessages, 5000);
  }
}

async function unlockCommunity() {
  await dbReadFresh();
  const idx = db.users.findIndex(u => u.id === currentUser.id);
  if (db.users[idx].game_balance < 1000) {
    showToast("⚠️ Solde de jeu insuffisant ! Rechargez pour débloquer.", "error");
    setTimeout(() => showScreen("recharge-screen"), 800);
    return;
  }
  db.users[idx].game_balance -= 1000;
  db.users[idx].community_access = true;
  db.transactions.push({
    id: uid(), user_id: currentUser.id,
    type: "game", amount: -1000, created_at: Date.now(),
    description: "Accès Communauté"
  });
  await dbWrite();
  dbLastFetch = Date.now(); // cache invalidation après écriture
  currentUser = db.users[idx];
  showToast("🎉 Accès Communauté débloqué !", "success");
  loadCommunity();
}

async function fetchChatMessages() {
  await dbReadFresh();
  renderChatMessages();
}

function renderChatMessages() {
  const msgs = (db.community_messages || []).slice(-50);
  const container = document.getElementById("chat-messages");
  const wasAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;

  container.innerHTML = "";
  msgs.forEach(m => {
    const isOwn = m.user_id === currentUser.id;
    const div = document.createElement("div");
    div.className = "chat-message" + (isOwn ? " own" : "");
    div.innerHTML = `
      <div class="cm-header">
        <span class="cm-pseudo">${m.pseudo}</span>
        <span class="cm-time">${formatDate(m.created_at)}</span>
      </div>
      <div class="cm-text">${escapeHtml(m.text)}</div>
    `;
    container.appendChild(div);
  });

  if (wasAtBottom) container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
  return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

async function sendCommunityMessage() {
  const input = document.getElementById("chat-input");
  const text  = input.value.trim();
  if (!text) return;

  input.value = "";
  await dbReadFresh();

  db.community_messages.push({
    id: uid(),
    user_id: currentUser.id,
    pseudo: currentUser.pseudo,
    text,
    created_at: Date.now()
  });

  // Keep last 200 messages
  if (db.community_messages.length > 200) {
    db.community_messages = db.community_messages.slice(-200);
  }

  await dbWrite();
  dbLastFetch = Date.now(); // cache invalidation après écriture
  renderChatMessages();
}

// Enter key to send
document.getElementById("chat-input").addEventListener("keydown", e => {
  if (e.key === "Enter") sendCommunityMessage();
});

/* ═══════════════════════════════════════════════════
   ADMIN
═══════════════════════════════════════════════════ */
async function loadAdmin() {
  if (!currentUser || !currentUser.is_admin) {
    showScreen("home-screen");
    return;
  }
  await dbReadFresh();
  showAdminTab("users", document.querySelector(".admin-tab.active"));
}

function showAdminTab(tab, el) {
  if (el) {
    document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
    el.classList.add("active");
  }
  document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.remove("active"));
  const target = document.getElementById("admin-" + tab);
  if (target) target.classList.add("active");

  if (tab === "users")       renderAdminUsers();
  if (tab === "recharges")   renderAdminRecharges();
  if (tab === "withdrawals") renderAdminWithdrawals();
  if (tab === "questions")   renderAdminQuestions();
  if (tab === "stats")       renderAdminStats();
}

function renderAdminUsers() {
  const list = document.getElementById("admin-users-list");
  list.innerHTML = "";
  const users = [...db.users].sort((a, b) => b.created_at - a.created_at);

  if (users.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted)">Aucun utilisateur.</p>';
    return;
  }

  users.forEach(u => {
    const card = document.createElement("div");
    card.className = "admin-user-card";
    card.innerHTML = `
      <div class="auc-header">
        <span class="auc-pseudo">${u.pseudo}</span>
        <span class="auc-badge ${u.banned ? "banned" : ""}">${u.banned ? "BANNI" : u.is_admin ? "ADMIN" : "Actif"}</span>
      </div>
      <div class="auc-info">
        📧 ${u.email} | 📱 ${u.phone}<br>
        🎮 Jeu: ${u.game_balance} FCFA | 💳 Retrait: ${u.withdraw_balance} FCFA<br>
        📅 Inscrit: ${formatDate(u.created_at)}
      </div>
      <div class="auc-actions">
        <button class="btn-admin edit" onclick="editBalance('${u.id}', '${u.pseudo}', ${u.game_balance}, ${u.withdraw_balance})">✏️ Solde</button>
        ${u.banned
          ? `<button class="btn-admin unban" onclick="toggleBan('${u.id}', false)">✅ Débannir</button>`
          : `<button class="btn-admin ban" onclick="toggleBan('${u.id}', true)">🚫 Bannir</button>`
        }
        ${!u.is_admin ? `<button class="btn-admin edit" onclick="makeAdmin('${u.id}')">⚙️ Admin</button>` : ""}
      </div>
    `;
    list.appendChild(card);
  });
}

function editBalance(uid, pseudo, gameB, withdrawB) {
  adminEditUserId = uid;
  document.getElementById("modal-edit-user-name").textContent = "Modifier le solde de " + pseudo;
  document.getElementById("modal-game-balance").value    = gameB;
  document.getElementById("modal-withdraw-balance").value = withdrawB;
  document.getElementById("modal-edit-balance").classList.remove("hidden");
}

async function saveBalance() {
  const gameB     = parseInt(document.getElementById("modal-game-balance").value) || 0;
  const withdrawB = parseInt(document.getElementById("modal-withdraw-balance").value) || 0;

  await dbReadFresh();
  const idx = db.users.findIndex(u => u.id === adminEditUserId);
  if (idx === -1) return;

  db.users[idx].game_balance     = gameB;
  db.users[idx].withdraw_balance = withdrawB;

  db.admin_logs.push({
    id: uid(), admin_id: currentUser.id, action: "edit_balance",
    target_id: adminEditUserId, data: { gameB, withdrawB }, created_at: Date.now()
  });

  await dbWrite();
  dbLastFetch = Date.now(); // cache invalidation après écriture
  closeModal("modal-edit-balance");
  renderAdminUsers();
  showToast("Solde modifié.", "success");
}

async function toggleBan(userId, ban) {
  await dbReadFresh();
  const idx = db.users.findIndex(u => u.id === userId);
  if (idx === -1) return;
  db.users[idx].banned = ban;
  db.admin_logs.push({
    id: uid(), admin_id: currentUser.id,
    action: ban ? "ban" : "unban", target_id: userId, created_at: Date.now()
  });
  await dbWrite();
  dbLastFetch = Date.now(); // cache invalidation après écriture
  renderAdminUsers();
  showToast(ban ? "Utilisateur banni." : "Utilisateur débanni.", "info");
}

async function makeAdmin(userId) {
  await dbReadFresh();
  const idx = db.users.findIndex(u => u.id === userId);
  if (idx === -1) return;
  db.users[idx].is_admin = true;
  await dbWrite();
  dbLastFetch = Date.now(); // cache invalidation après écriture
  renderAdminUsers();
  showToast("Utilisateur promu Admin.", "success");
}

function renderAdminRecharges() {
  const list = document.getElementById("admin-recharges-list");
  list.innerHTML = "";
  const recharges = [...db.recharges].sort((a, b) => b.created_at - a.created_at);

  if (recharges.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted)">Aucune recharge.</p>';
    return;
  }

  recharges.forEach(r => {
    const card = document.createElement("div");
    card.className = "admin-request-card";
    card.innerHTML = `
      <div class="arc-header">
        <span>${r.pseudo}</span>
        <span class="arc-amount">${r.amount.toLocaleString('fr-FR')} FCFA</span>
      </div>
      <div class="arc-info">
        Mode: ${r.method} | Statut: <span class="tx-status ${r.status}">${r.status}</span><br>
        Date: ${formatDate(r.created_at)}
      </div>
      ${r.status === "pending" ? `
      <div class="arc-actions">
        <button class="btn-admin confirm" onclick="validateRecharge('${r.id}', true)">✅ Valider</button>
        <button class="btn-admin reject" onclick="validateRecharge('${r.id}', false)">❌ Rejeter</button>
      </div>` : ""}
    `;
    list.appendChild(card);
  });
}

async function validateRecharge(rid, approve) {
  await dbReadFresh();
  const idx = db.recharges.findIndex(r => r.id === rid);
  if (idx === -1) return;
  const r = db.recharges[idx];

  db.recharges[idx].status = approve ? "confirmed" : "rejected";

  if (approve) {
    const uIdx = db.users.findIndex(u => u.id === r.user_id);
    if (uIdx !== -1) {
      db.users[uIdx].game_balance += r.amount;
      db.transactions.push({
        id: uid(), user_id: r.user_id,
        type: "recharge", amount: r.amount, created_at: Date.now(),
        description: "Recharge validée – " + r.method, status: "confirmed"
      });
    }
  }

  db.admin_logs.push({
    id: uid(), admin_id: currentUser.id,
    action: approve ? "confirm_recharge" : "reject_recharge",
    target_id: rid, created_at: Date.now()
  });

  await dbWrite();
  dbLastFetch = Date.now(); // cache invalidation après écriture
  renderAdminRecharges();
  showToast(approve ? "Recharge validée !" : "Recharge rejetée.", approve ? "success" : "error");
}

function renderAdminWithdrawals() {
  const list = document.getElementById("admin-withdrawals-list");
  list.innerHTML = "";
  const withdrawals = [...db.withdrawals].sort((a, b) => b.created_at - a.created_at);

  if (withdrawals.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted)">Aucun retrait.</p>';
    return;
  }

  withdrawals.forEach(w => {
    const card = document.createElement("div");
    card.className = "admin-request-card";
    card.innerHTML = `
      <div class="arc-header">
        <span>${w.pseudo}</span>
        <span class="arc-amount">${w.amount.toLocaleString('fr-FR')} FCFA</span>
      </div>
      <div class="arc-info">
        📱 ${w.phone} | Mode: ${w.method}<br>
        Statut: <span class="tx-status ${w.status}">${w.status}</span> | Date: ${formatDate(w.created_at)}
      </div>
      ${w.status === "pending" ? `
      <div class="arc-actions">
        <button class="btn-admin confirm" onclick="validateWithdrawal('${w.id}', true)">✅ Confirmer envoi</button>
        <button class="btn-admin reject" onclick="validateWithdrawal('${w.id}', false)">↩️ Rembourser</button>
      </div>` : ""}
    `;
    list.appendChild(card);
  });
}

async function validateWithdrawal(wid, confirm) {
  await dbReadFresh();
  const idx = db.withdrawals.findIndex(w => w.id === wid);
  if (idx === -1) return;
  const w = db.withdrawals[idx];

  db.withdrawals[idx].status = confirm ? "confirmed" : "rejected";

  if (!confirm) {
    // Refund
    const uIdx = db.users.findIndex(u => u.id === w.user_id);
    if (uIdx !== -1) {
      db.users[uIdx].withdraw_balance += w.amount;
      db.transactions.push({
        id: uid(), user_id: w.user_id,
        type: "withdrawal", amount: w.amount, created_at: Date.now(),
        description: "Retrait remboursé – " + w.method, status: "rejected"
      });
    }
  }

  db.admin_logs.push({
    id: uid(), admin_id: currentUser.id,
    action: confirm ? "confirm_withdrawal" : "reject_withdrawal",
    target_id: wid, created_at: Date.now()
  });

  await dbWrite();
  dbLastFetch = Date.now(); // cache invalidation après écriture
  renderAdminWithdrawals();
  showToast(confirm ? "Retrait confirmé !" : "Retrait remboursé.", confirm ? "success" : "info");
}

function renderAdminQuestions() {
  const list = document.getElementById("admin-questions-list");
  list.innerHTML = "";
  const questions = db.questions || [];

  questions.forEach(q => {
    const item = document.createElement("div");
    item.className = "admin-question-item";
    item.innerHTML = `
      <div class="aq-q">❓ ${q.text}</div>
      <div class="aq-answers">
        <span ${q.correct === 'a' ? 'class="aq-correct"' : ''}>A: ${q.a}</span> |
        <span ${q.correct === 'b' ? 'class="aq-correct"' : ''}>B: ${q.b}</span> |
        <span ${q.correct === 'c' ? 'class="aq-correct"' : ''}>C: ${q.c}</span> |
        <span ${q.correct === 'd' ? 'class="aq-correct"' : ''}>D: ${q.d}</span>
      </div>
      <div style="margin-top:6px;font-size:11px;color:var(--text-muted)">${q.category || ""}</div>
    `;
    list.appendChild(item);
  });
}

async function addQuestion() {
  const text    = document.getElementById("aq-text").value.trim();
  const a       = document.getElementById("aq-a").value.trim();
  const b       = document.getElementById("aq-b").value.trim();
  const c       = document.getElementById("aq-c").value.trim();
  const d       = document.getElementById("aq-d").value.trim();
  const correct = document.getElementById("aq-correct").value;
  const cat     = document.getElementById("aq-cat").value.trim() || "Général";
  const msgEl   = document.getElementById("aq-msg");

  if (!text || !a || !b || !c || !d) {
    return showToast("Tous les champs sont obligatoires.", "error");
  }

  await dbReadFresh();
  db.questions.push({ id: uid(), text, a, b, c, d, correct, category: cat });
  await dbWrite();
  dbLastFetch = Date.now(); // cache invalidation après écriture

  ["aq-text","aq-a","aq-b","aq-c","aq-d","aq-cat"].forEach(id => document.getElementById(id).value = "");
  msgEl.textContent = "✅ Question ajoutée !";
  msgEl.classList.remove("hidden");
  setTimeout(() => msgEl.classList.add("hidden"), 3000);

  renderAdminQuestions();
  showToast("Question ajoutée !", "success");
}

function renderAdminStats() {
  const content = document.getElementById("admin-stats-content");
  const totalUsers     = db.users.length;
  const totalGame      = db.users.reduce((s, u) => s + u.game_balance, 0);
  const totalWithdraw  = db.users.reduce((s, u) => s + u.withdraw_balance, 0);
  const pendingR       = db.recharges.filter(r => r.status === "pending").length;
  const pendingW       = db.withdrawals.filter(w => w.status === "pending").length;
  const totalMessages  = db.community_messages.length;
  const totalQuestions = db.questions.length;
  const totalTx        = db.transactions.length;

  content.innerHTML = `
    <div class="stats-grid">
      <div class="stat-box"><div class="sb-value">${totalUsers}</div><div class="sb-label">Joueurs</div></div>
      <div class="stat-box"><div class="sb-value">${totalQuestions}</div><div class="sb-label">Questions</div></div>
      <div class="stat-box"><div class="sb-value">${totalGame.toLocaleString('fr-FR')}</div><div class="sb-label">Soldes Jeu (FCFA)</div></div>
      <div class="stat-box"><div class="sb-value">${totalWithdraw.toLocaleString('fr-FR')}</div><div class="sb-label">Soldes Retrait (FCFA)</div></div>
      <div class="stat-box"><div class="sb-value">${pendingR}</div><div class="sb-label">Recharges en attente</div></div>
      <div class="stat-box"><div class="sb-value">${pendingW}</div><div class="sb-label">Retraits en attente</div></div>
      <div class="stat-box"><div class="sb-value">${totalTx}</div><div class="sb-label">Transactions</div></div>
      <div class="stat-box"><div class="sb-value">${totalMessages}</div><div class="sb-label">Messages communauté</div></div>
    </div>
  `;
}
