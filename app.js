let book = null;
let currentChapter = null;
let currentNav = null;
let languageChapter = null;
let showMeaning = true;
let fontStep = 0;
let selectedLanguage = "hi";
let navigation = [];
let collapsedNav = {};

const digits = ["०","१","२","३","४","५","६","७","८","९"];
const knDigits = ["೦","೧","೨","೩","೪","೫","೬","೭","೮","೯"];
const hn = n => String(n).split("").map(x => digits[Number(x)]).join("");
const kn = n => String(n).split("").map(x => knDigits[Number(x)]).join("");
const langNum = n => selectedLanguage === "kn" ? kn(n) : hn(n);

const UI = {
  hi: {
    lang:"hi", htmlLang:"hi", bookTitle:"शिवमहापुराण", bookLabel:"पुस्तक", chapterLabel:"अध्याय", font:"अ / अ+",
    subtitle:"सरल डिजिटल पाठ", search:"इस अध्याय में खोजें…",
    toc:"श्लोक आरम्भ", count:n => `इस अध्याय में ${n} श्लोक`, countSearch:n => `${n} श्लोक मिले`,
    prev:"← पिछला अध्याय", next:"अगला अध्याय →", pager:"पूरा अध्याय एक ही पृष्ठ पर",
    meaning:"हिन्दी अर्थ", unavailable:"इस अध्याय का हिन्दी अर्थ उपलब्ध नहीं है।"
  },
  kn: {
    lang:"kn", htmlLang:"kn", bookTitle:"ಶಿವಮಹಾಪುರಾಣ", bookLabel:"ಗ್ರಂಥ", chapterLabel:"ಅಧ್ಯಾಯ", font:"ಅ / ಅ+",
    subtitle:"ಸರಳ ಡಿಜಿಟಲ್ ಪಠಣ", search:"ಈ ಅಧ್ಯಾಯದಲ್ಲಿ ಹುಡುಕಿ…",
    toc:"ಶ್ಲೋಕ ಆರಂಭ", count:n => `ಈ ಅಧ್ಯಾಯದಲ್ಲಿ ${n} ಶ್ಲೋಕಗಳು`, countSearch:n => `${n} ಶ್ಲೋಕಗಳು ದೊರೆತಿವೆ`,
    prev:"← ಹಿಂದಿನ ಅಧ್ಯಾಯ", next:"ಮುಂದಿನ ಅಧ್ಯಾಯ →", pager:"ಸಂಪೂರ್ಣ ಅಧ್ಯಾಯ ಒಂದೇ ಪುಟದಲ್ಲಿ",
    meaning:"ಕನ್ನಡ ಅರ್ಥ / ವಿವರಣೆ", unavailable:"ಈ ಅಧ್ಯಾಯದ ಕನ್ನಡ ಪಠ್ಯ ಇನ್ನೂ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ."
  }
};

const chapterTitles = {
  hi: {
    1:"शौनकजीके साधनविषयक प्रश्न करनेपर सूतजीका उन्हें शिवमहापुराणकी महिमा सुनाना",
    2:"शिवपुराणके श्रवणसे देवराजको शिवलोककी प्राप्ति",
    3:"चञ्चुलाका पापसे भय एवं संसारसे वैराग्य",
    4:"चंचुलाकी प्रार्थनासे ब्राह्मणका उसे पूरा शिवपुराण सुनाना और समयानुसार शरीर छोड़कर शिवलोकमें जा चंचुलाका पार्वतीजीकी सखी होना",
    5:"चंचुलाके प्रयत्नसे पार्वतीजीकी आज्ञा पाकर तुम्बुरुका विन्ध्यपर्वतपर शिवपुराणकी कथा सुनाकर बिन्दुगका पिशाचयोनिसे उद्धार करना तथा उन दोनों दम्पतीका शिवधाममें सुखी होना",
    6:"शिवपुराणके श्रवणकी विधि",
    7:"श्रोताओंके पालन करनेयोग्य नियमोंका वर्णन"
  }
};

async function loadJSON(path) {
  const r = await fetch(`${path}?v=20261002-hindi-menu-kn-preserve`);
  if (!r.ok) throw new Error(path);
  return r.json();
}

function esc(s = "") {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function buildFlatNavigation() {
  const items = [];

  function walkSections(sections, group, parentIds = [], parentTitles = []) {
    for (const section of sections || []) {
      const ids = [...parentIds, section.id];
      const titles = [...parentTitles, section.title];

      for (const c of section.chapters || []) {
        items.push({
          ...c,
          groupId: group.id,
          groupTitle: group.title,
          sectionId: section.id,
          sectionTitle: section.title,
          sectionIds: ids,
          sectionTitles: titles,
          parentType: "khanda"
        });
      }

      if (section.sections?.length) walkSections(section.sections, group, ids, titles);
    }
  }

  for (const group of navigation) {
    if (group.type === "section") {
      for (const c of group.chapters || []) {
        items.push({...c, groupId: group.id, groupTitle: group.title, parentType: "section"});
      }
    } else if (group.type === "khanda") {
      walkSections(group.sections, group);
    }
  }
  return items;
}

function isNavCollapsed(key) {
  return collapsedNav[key] === true;
}

function saveNavState() {
  try { localStorage.setItem("hinduGranthalayaCollapsedNav", JSON.stringify(collapsedNav)); } catch {}
}

function ensureCurrentNavOpen() {
  if (!currentNav) return;
  collapsedNav[currentNav.groupId] = false;
  for (const id of currentNav.sectionIds || (currentNav.sectionId ? [currentNav.sectionId] : [])) {
    collapsedNav[id] = false;
  }
  saveNavState();
}

function toggleNavSection(key) {
  const group = navigation.find(g => g.id === key);

  if (group) {
    const willOpen = isNavCollapsed(key);
    for (const g of navigation) collapsedNav[g.id] = true;
    collapsedNav[key] = !willOpen;
    saveNavState();
    renderChapters();
    return;
  }

  collapsedNav[key] = !isNavCollapsed(key);
  saveNavState();
  renderChapters();
}

async function loadLanguageChapter() {
  languageChapter = null;
  if (selectedLanguage !== "kn" || !currentNav || currentNav.parentType !== "section") return;
  try {
    languageChapter = await loadJSON(`books/shivamahapurana/mahatmya/chapter-${String(currentChapter.chapter).padStart(2,"0")}-kn.json`);
  } catch (e) {
    languageChapter = null;
  }
}

function currentSectionLabel() {
  if (!currentNav) return selectedLanguage === "kn" ? "ಮಾಹಾತ್ಮ್ಯ" : "माहात्म्य";
  if (selectedLanguage === "kn") {
    if (currentNav.parentType === "section") return "ಮಾಹಾತ್ಮ್ಯ";
    return currentNav.sectionTitles?.at(-1) || currentNav.sectionTitle || currentNav.groupTitle || "";
  }
  return currentNav.sectionTitles?.at(-1) || currentNav.groupTitle || "";
}

function applyLocale() {
  const t = UI[selectedLanguage];
  document.documentElement.lang = t.htmlLang;
  document.body.dataset.lang = selectedLanguage;
  document.getElementById("bookTitle").textContent = t.bookTitle;
  document.querySelector(".book-card strong").textContent = t.bookTitle;
  document.getElementById("brandSubtitle").textContent = t.subtitle;
  document.getElementById("fontBtn").textContent = t.font;
  document.getElementById("mobileBookLabel").textContent = t.bookLabel;
  document.getElementById("bookLabel").textContent = t.bookLabel;
  document.getElementById("chapterLabel").textContent = t.chapterLabel;
  document.getElementById("sectionLabel").textContent = currentSectionLabel();
  document.getElementById("breadcrumbs").textContent = selectedLanguage === "kn"
    ? [t.bookTitle, currentSectionLabel()].filter(Boolean).join(" › ")
    : [book.title, ...(currentNav?.parentType === "khanda"
      ? [currentNav.groupTitle, ...(currentNav.sectionTitles || [])]
      : [currentNav?.groupTitle || ""])].filter(Boolean).join(" › ");
  document.getElementById("searchInput").placeholder = t.search;
  document.getElementById("tocBtn").textContent = t.toc;
  document.getElementById("prevChapterBtn").textContent = t.prev;
  document.getElementById("nextChapterBtn").textContent = t.next;
  document.getElementById("pagerLabel").textContent = t.pager;
  document.querySelector("footer").textContent = selectedLanguage === "kn" ? "ಓಂ ನಮಃ ಶಿವಾಯ" : "ॐ नमः शिवाय";
  document.getElementById("chapterTitle").textContent = `${t.chapterLabel} ${langNum(currentChapter.chapter)}`;
  document.getElementById("chapterDescription").textContent =
    selectedLanguage === "hi"
      ? (currentChapter.opening_subtitle || currentChapter.title || chapterTitles.hi[currentChapter.chapter] || "")
      : (languageChapter?.title || chapterTitles.hi[currentChapter.chapter] || currentChapter.title || "");
  document.getElementById("menuBtn").setAttribute("aria-label", selectedLanguage === "kn" ? "ಮೆನು ತೆರೆಯಿರಿ" : "मेनू खोलें");
  document.getElementById("closeMenuBtn").setAttribute("aria-label", selectedLanguage === "kn" ? "ಮೆನು ಮುಚ್ಚಿರಿ" : "मेनू बंद करें");
}

function render(blocks) {
  const t = UI[selectedLanguage];
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const knByVerse = {};
  if (languageChapter) {
    languageChapter.blocks.forEach(b => b.shlokas.forEach(s => { knByVerse[s.number] = b.meaning; }));
  }

  const filtered = blocks.map(b => ({
    ...b,
    shlokas: b.shlokas.filter(s => {
      const knMeaning = knByVerse[s.number] || "";
      return !q || `${(s.lines || []).join(" ")} ${b.meaning || ""} ${knMeaning}`.toLowerCase().includes(q);
    })
  })).filter(b => b.shlokas.length);

  const count = filtered.reduce((n, b) => n + b.shlokas.length, 0);
  document.getElementById("verseCount").textContent = q ? t.countSearch(count) : t.count(count);

  let lastSpeaker = null;
  let html = filtered.map(b => {
    const firstNumber = b.shlokas[0]?.number;
    const knBlock = selectedLanguage === "kn"
      ? languageChapter?.blocks.find(lb => lb.shlokas.some(s => s.number === firstNumber))
      : null;
    const speaker = selectedLanguage === "kn" ? (knBlock?.speaker || "") : (b.speaker || "");
    const showSpeaker = speaker && speaker !== lastSpeaker;
    if (speaker) lastSpeaker = speaker;
    const languageMeaning = selectedLanguage === "kn" ? knByVerse[firstNumber] : b.meaning;

    return `
    <article class="verse-group">
      ${showSpeaker ? `<div class="verse-top"><span class="speaker">${esc(speaker)}</span></div>` : ""}
      <div class="verse-body">
        <div class="sanskrit-group">
          ${b.shlokas.map(s => {
            const knVerse = selectedLanguage === "kn"
              ? languageChapter?.blocks.flatMap(lb => lb.shlokas).find(ks => ks.number === s.number)
              : null;
            const lines = selectedLanguage === "kn" && knVerse?.lines ? knVerse.lines : (s.lines || []);
            return `
            <div class="shloka" id="shloka-${s.number}">
              <span class="shloka-number">॥ ${langNum(s.number)} ॥</span>
              <div class="shloka-text">${lines.map(line => `<div>${esc(line)}</div>`).join("")}</div>
            </div>`;
          }).join("")}
        </div>
        <div class="meaning">
          <div class="meaning-label">${t.meaning}</div>
          <div>${esc(languageMeaning || t.unavailable)}</div>
        </div>
      </div>
    </article>`;
  }).join("");

  if (currentChapter.opening_context && !q && selectedLanguage === "hi") {
    html = `<article class="opening-context">
      <div class="opening-sanskrit">${currentChapter.opening_context.sanskrit.map(x => `<div>${esc(x)}</div>`).join("")}</div>
      ${showMeaning && currentChapter.opening_context.meaning ? `<div class="meaning"><div class="meaning-label">हिन्दी अर्थ</div><div>${esc(currentChapter.opening_context.meaning)}</div></div>` : ""}
    </article>` + html;
  }

  if (currentChapter.colophon && !q && selectedLanguage === "hi") {
    html += `<article class="colophon"><div class="colophon-sanskrit">${esc(currentChapter.colophon.sanskrit)}</div>${showMeaning ? `<div class="meaning"><div class="meaning-label">हिन्दी अर्थ</div><div>${esc(currentChapter.colophon.meaning)}</div></div>` : ""}</article>`;
  }

  document.getElementById("verseList").innerHTML = html;
  updateReadingFontSizes();
}

function renderSection(section, group, level = 0) {
  const sectionCollapsed = isNavCollapsed(section.id);
  const chapters = (section.chapters || []).map(c => chapterButton(c)).join("");
  const childSections = (section.sections || []).map(child => renderSection(child, group, level + 1)).join("");
  const titleClass = level === 0 ? "nav-samhita-title" : "nav-nested-title";
  const wrapperClass = level === 0 ? "nav-samhita" : "nav-nested";

  return `
    <div class="${wrapperClass} ${sectionCollapsed ? "is-collapsed" : ""}">
      <button class="nav-collapse-btn ${titleClass}" data-nav-key="${esc(section.id)}" aria-expanded="${!sectionCollapsed}">
        <span class="nav-toggle-icon" aria-hidden="true">${sectionCollapsed ? "+" : "−"}</span>
        <span class="nav-header-text">${esc(section.title)}</span>
      </button>
      <div class="nav-collapse-content" ${sectionCollapsed ? "hidden" : ""}>
        ${chapters ? `<div class="nav-chapters">${chapters}</div>` : ""}
        ${childSections}
      </div>
    </div>`;
}

function chapterButton(c) {
  const active = currentNav && currentNav.path === c.path;
  return `<button class="chapter-link ${active ? "active" : ""}" data-path="${esc(c.path)}">
    <span class="chapter-link-number">${UI[selectedLanguage].chapterLabel} ${langNum(c.number)}</span>
  </button>`;
}

function renderChapters() {
  const box = document.getElementById("chapterList");
  let html = "";

  for (const group of navigation) {
    const groupCollapsed = isNavCollapsed(group.id);

    if (group.type === "section") {
      html += `<div class="nav-group nav-group-section ${groupCollapsed ? "is-collapsed" : ""}">
        <button class="nav-collapse-btn nav-group-title" data-nav-key="${esc(group.id)}" aria-expanded="${!groupCollapsed}">
          <span class="nav-toggle-icon" aria-hidden="true">${groupCollapsed ? "+" : "−"}</span>
          <span class="nav-header-text">${esc(group.title)}</span>
        </button>
        <div class="nav-collapse-content" ${groupCollapsed ? "hidden" : ""}>
          <div class="nav-chapters">${(group.chapters || []).map(c => chapterButton(c)).join("")}</div>
        </div>
      </div>`;
    } else if (group.type === "khanda") {
      html += `<div class="nav-group nav-khanda ${groupCollapsed ? "is-collapsed" : ""}">
        <button class="nav-collapse-btn nav-khanda-title" data-nav-key="${esc(group.id)}" aria-expanded="${!groupCollapsed}">
          <span class="nav-toggle-icon" aria-hidden="true">${groupCollapsed ? "+" : "−"}</span>
          <span class="nav-header-text">${esc(group.title)}</span>
        </button>
        <div class="nav-collapse-content" ${groupCollapsed ? "hidden" : ""}>
          ${(group.sections || []).map(section => renderSection(section, group)).join("")}
        </div>
      </div>`;
    }
  }

  box.innerHTML = html;
  box.querySelectorAll(".nav-collapse-btn").forEach(b => b.onclick = () => toggleNavSection(b.dataset.navKey));
  box.querySelectorAll("button[data-path]").forEach(b => b.onclick = async () => await goToChapter(b.dataset.path));
}

function updateReadingFontSizes() {
  const isMobile = window.matchMedia("(max-width: 700px)").matches;
  const shlokaSizes = ["1.28rem", "1.42rem", "1.58rem", "1.76rem"];
  const meaningSizes = isMobile ? ["21px", "23px", "25px", "27px"] : ["18.24px", "20.16px", "22.40px", "24.96px"];
  document.documentElement.style.setProperty("--reading", shlokaSizes[fontStep]);
  document.documentElement.style.setProperty("--meaning-size", meaningSizes[fontStep]);
  document.querySelectorAll(".meaning").forEach(el => el.style.setProperty("font-size", meaningSizes[fontStep], "important"));
}

function updateChapterPager() {
  const flat = buildFlatNavigation();
  const index = flat.findIndex(c => c.path === currentNav?.path);
  const prevBtn = document.getElementById("prevChapterBtn");
  const nextBtn = document.getElementById("nextChapterBtn");
  prevBtn.disabled = index <= 0;
  nextBtn.disabled = index < 0 || index >= flat.length - 1;
  prevBtn.textContent = index > 0 ? `${UI[selectedLanguage].prev.split(" ")[0]} ${UI[selectedLanguage].chapterLabel} ${langNum(flat[index - 1].number)}` : UI[selectedLanguage].prev;
  nextBtn.textContent = index >= 0 && index < flat.length - 1 ? `${UI[selectedLanguage].chapterLabel} ${langNum(flat[index + 1].number)} →` : UI[selectedLanguage].next;
}

function updateBreadcrumbs() {
  const t = UI[selectedLanguage];
  const parts = [t.bookTitle];
  if (currentNav?.parentType === "section") {
    parts.push(currentSectionLabel());
  } else if (currentNav?.parentType === "khanda") {
    parts.push(currentNav.groupTitle, ...(currentNav.sectionTitles || []).filter(Boolean));
  }
  document.getElementById("breadcrumbs").textContent = parts.join(" › ");
}

async function goToChapter(path, openParents = true) {
  const flat = buildFlatNavigation();
  const nav = flat.find(c => c.path === path);
  if (!nav) return;

  currentNav = nav;
  if (openParents) ensureCurrentNavOpen();
  currentChapter = await loadJSON(nav.path);
  await loadLanguageChapter();
  applyLocale();
  updateBreadcrumbs();
  renderChapters();
  render(currentChapter.blocks);
  updateChapterPager();
  closeSidebar();
  window.scrollTo({top:0, behavior:"smooth"});
}

function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebarBackdrop").classList.add("show");
  document.body.classList.add("menu-open");
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarBackdrop").classList.remove("show");
  document.body.classList.remove("menu-open");
}

async function init() {
  book = await loadJSON("books/shivamahapurana/metadata.json");
  navigation = book.navigation || [];

  collapsedNav = {};
  function collapseSections(sections) {
    for (const section of sections || []) {
      collapsedNav[section.id] = true;
      collapseSections(section.sections);
    }
  }
  for (const group of navigation) {
    collapsedNav[group.id] = true;
    collapseSections(group.sections);
  }

  const flat = buildFlatNavigation();
  if (!flat.length) throw new Error("No chapters configured");
  await goToChapter(flat[0].path, false);
}

document.getElementById("searchInput").oninput = () => render(currentChapter.blocks);

document.getElementById("languageSelect").onchange = async (e) => {
  selectedLanguage = e.target.value;
  await loadLanguageChapter();
  applyLocale();
  updateBreadcrumbs();
  renderChapters();
  render(currentChapter.blocks);
};

document.getElementById("fontBtn").onclick = () => { fontStep = (fontStep + 1) % 4; updateReadingFontSizes(); };
window.addEventListener("resize", updateReadingFontSizes);
document.getElementById("menuBtn").onclick = () => {
  document.getElementById("sidebar").classList.contains("open") ? closeSidebar() : openSidebar();
};
document.getElementById("sidebarBackdrop").onclick = closeSidebar;
document.getElementById("closeMenuBtn").onclick = closeSidebar;
document.getElementById("tocBtn").onclick = () => document.getElementById("verseList").scrollIntoView({behavior:"smooth"});
document.getElementById("prevChapterBtn").onclick = async () => {
  const flat = buildFlatNavigation();
  const i = flat.findIndex(c => c.path === currentNav?.path);
  if (i > 0) await goToChapter(flat[i - 1].path);
};
document.getElementById("nextChapterBtn").onclick = async () => {
  const flat = buildFlatNavigation();
  const i = flat.findIndex(c => c.path === currentNav?.path);
  if (i >= 0 && i < flat.length - 1) await goToChapter(flat[i + 1].path);
};

init().catch(e => {
  console.error(e);
  document.getElementById("verseList").innerHTML = `<div class="verse-group"><div class="verse-body">सामग्री लोड नहीं हो सकी।</div></div>`;
});