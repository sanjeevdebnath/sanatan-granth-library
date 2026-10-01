let book = null;
let currentChapter = null;
let languageChapter = null;
let showMeaning = true;
let fontStep = 0;
let selectedLanguage = "hi";

const digits = ["०","१","२","३","४","५","६","७","८","९"];
const hn = n => String(n).split("").map(x => digits[Number(x)]).join("");

const UI = {
  hi: {
    lang:"hi", htmlLang:"hi", bookLabel:"पुस्तक", chapterLabel:"अध्याय",
    subtitle:"सरल डिजिटल पाठ", section:"माहात्म्य", search:"इस अध्याय में खोजें…",
    toc:"श्लोक आरम्भ", count:n => `इस अध्याय में ${n} श्लोक`, countSearch:n => `${n} श्लोक मिले`,
    prev:"← पिछला अध्याय", next:"अगला अध्याय →", pager:"पूरा अध्याय एक ही पृष्ठ पर",
    meaning:"हिन्दी अर्थ", unavailable:"इस अध्याय का हिन्दी अर्थ उपलब्ध नहीं है।"
  },
  kn: {
    lang:"kn", htmlLang:"kn", bookLabel:"ಗ್ರಂಥ", chapterLabel:"ಅಧ್ಯಾಯ",
    subtitle:"ಸರಳ ಡಿಜಿಟಲ್ ಪಠಣ", section:"ಮಾಹಾತ್ಮ್ಯ", search:"ಈ ಅಧ್ಯಾಯದಲ್ಲಿ ಹುಡುಕಿ…",
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
    6:"शिवपुराणके श्रवणकी विधि"
  },
  kn: {
    1:"ಶೌನಕ ಮಹರ್ಷಿಗಳ ಪ್ರಶ್ನೆಗಳಿಗೆ ಸೂತರು ಶಿವಮಹಾಪುರಾಣದ ಮಹಿಮೆಯನ್ನು ವಿವರಿಸುವುದು",
    2:"ಶಿವಪುರಾಣ ಶ್ರವಣದಿಂದ ದೇವರಾಜನಿಗೆ ಶಿವಲೋಕದ ಪ್ರಾಪ್ತಿ",
    3:"ಚಂಚುಳೆಗೆ ಪಾಪದ ಭಯ ಮತ್ತು ಸಂಸಾರದಿಂದ ವೈರಾಗ್ಯ",
    4:"ಚಂಚುಳೆಯ ಪ್ರಾರ್ಥನೆಯಿಂದ ಬ್ರಾಹ್ಮಣನು ಸಂಪೂರ್ಣ ಶಿವಪುರಾಣವನ್ನು ಹೇಳುವುದು ಮತ್ತು ಚಂಚುಳೆಗೆ ಪಾರ್ವತಿಯ ಸಖಿಯಾಗುವಿಕೆ",
    5:"ಚಂಚುಳೆಯ ಪ್ರಯತ್ನದಿಂದ ತುಂಭುರುವು ಶಿವಪುರಾಣ ಕಥೆಯನ್ನು ಹೇಳಿ ಬಿಂದುಗನನ್ನು ಪಿಶಾಚ ಯೋನಿಯಿಂದ ಉದ್ಧರಿಸುವುದು",
    6:"ಶಿವಪುರಾಣ ಶ್ರವಣದ ವಿಧಾನ"
  }
};

async function loadJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(path);
  return r.json();
}

function esc(s = "") {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

async function loadLanguageChapter() {
  languageChapter = null;
  if (selectedLanguage !== "kn") return;
  try {
    languageChapter = await loadJSON(`books/shivamahapurana/mahatmya/chapter-${String(currentChapter.chapter).padStart(2,"0")}-kn.json`);
  } catch (e) {
    languageChapter = null;
  }
}

function applyLocale() {
  const t = UI[selectedLanguage];
  document.documentElement.lang = t.htmlLang;
  document.body.dataset.lang = selectedLanguage;
  document.getElementById("brandSubtitle").textContent = t.subtitle;
  document.getElementById("mobileBookLabel").textContent = t.bookLabel;
  document.getElementById("bookLabel").textContent = t.bookLabel;
  document.getElementById("chapterLabel").textContent = t.chapterLabel;
  document.getElementById("sectionLabel").textContent = t.section;
  document.getElementById("breadcrumbs").textContent = `शिवमहापुराण › ${t.section}`;
  document.getElementById("searchInput").placeholder = t.search;
  document.getElementById("tocBtn").textContent = t.toc;
  document.getElementById("prevChapterBtn").textContent = t.prev;
  document.getElementById("nextChapterBtn").textContent = t.next;
  document.getElementById("pagerLabel").textContent = t.pager;
  document.getElementById("chapterTitle").textContent = `${t.chapterLabel} ${selectedLanguage === "hi" ? hn(currentChapter.chapter) : String(currentChapter.chapter).replace(/[0-9]/g, d => ["೦","೧","೨","೩","೪","೫","೬","೭","೮","೯"][Number(d)])}`;
  document.getElementById("chapterDescription").textContent = chapterTitles[selectedLanguage][currentChapter.chapter] || currentChapter.title;
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
      const kn = knByVerse[s.number] || "";
      return !q || `${(s.lines || []).join(" ")} ${b.meaning || ""} ${kn}`.toLowerCase().includes(q);
    })
  })).filter(b => b.shlokas.length);

  const count = filtered.reduce((n, b) => n + b.shlokas.length, 0);
  document.getElementById("verseCount").textContent = q ? t.countSearch(count) : t.count(count);

  let lastSpeaker = null;
  document.getElementById("verseList").innerHTML = filtered.map(b => {
    const showSpeaker = b.speaker && b.speaker !== lastSpeaker;
    if (b.speaker) lastSpeaker = b.speaker;
    const languageMeaning = selectedLanguage === "kn" ? knByVerse[b.shlokas[0]?.number] : b.meaning;

    return `
    <article class="verse-group">
      ${showSpeaker ? `<div class="verse-top"><span class="speaker">${esc(b.speaker)}</span></div>` : ""}
      <div class="verse-body">
        <div class="sanskrit-group">
          ${b.shlokas.map(s => `
            <div class="shloka" id="shloka-${s.number}">
              <span class="shloka-number">॥ ${hn(s.number)} ॥</span>
              <div class="shloka-text">${(s.lines || []).map(line => `<div>${esc(line)}</div>`).join("")}</div>
            </div>`).join("")}
        </div>
        <div class="meaning">
          <div class="meaning-label">${t.meaning}</div>
          <div>${esc(languageMeaning || t.unavailable)}</div>
        </div>
      </div>
    </article>`;
  }).join("");

  updateReadingFontSizes();
}

function renderChapters() {
  const box = document.getElementById("chapterList");
  const chapters = book.sections[0].chapters;
  box.innerHTML = chapters.map(c => `
    <button class="chapter-link ${c.number === currentChapter.chapter ? "active":""}" data-id="${c.id}">
      <span>${UI[selectedLanguage].chapterLabel} ${selectedLanguage === "hi" ? hn(c.number) : String(c.number).replace(/[0-9]/g, d => ["೦","೧","೨","೩","೪","೫","೬","೭","೮","೯"][Number(d)])}</span>
    </button>`).join("");
  box.querySelectorAll("button").forEach(b => b.onclick = async () => {
    const index = chapters.findIndex(x => x.id === b.dataset.id);
    await goToChapterByIndex(index);
  });
}

function updateChapterPager() {
  const chapters = book.sections[0].chapters;
  const index = chapters.findIndex(c => c.number === currentChapter.chapter);
  document.getElementById("prevChapterBtn").disabled = index <= 0;
  document.getElementById("nextChapterBtn").disabled = index < 0 || index >= chapters.length - 1;
}

async function goToChapterByIndex(index) {
  const chapters = book.sections[0].chapters;
  if (index < 0 || index >= chapters.length) return;
  const c = chapters[index];
  currentChapter = await loadJSON(`books/shivamahapurana/mahatmya/${c.id}.json`);
  await loadLanguageChapter();
  applyLocale();
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
  currentChapter = await loadJSON("books/shivamahapurana/mahatmya/chapter-01.json");
  applyLocale();
  renderChapters();
  await loadLanguageChapter();
  render(currentChapter.blocks);
  updateChapterPager();
}

document.getElementById("searchInput").oninput = () => render(currentChapter.blocks);

document.getElementById("languageSelect").onchange = async (e) => {
  selectedLanguage = e.target.value;
  await loadLanguageChapter();
  applyLocale();
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
  const i = book.sections[0].chapters.findIndex(c => c.number === currentChapter.chapter);
  if (i > 0) await goToChapterByIndex(i - 1);
};
document.getElementById("nextChapterBtn").onclick = async () => {
  const i = book.sections[0].chapters.findIndex(c => c.number === currentChapter.chapter);
  if (i >= 0 && i < book.sections[0].chapters.length - 1) await goToChapterByIndex(i + 1);
};
init().catch(e => {
  console.error(e);
  document.getElementById("verseList").innerHTML = `<div class="verse-group"><div class="verse-body">सामग्री लोड नहीं हो सकी।</div></div>`;
});