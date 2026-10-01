let book = null;
let currentChapter = null;
let languageChapter = null;
let showMeaning = true;
let fontStep = 0;
let selectedLanguage = "hi";

const digits = ["०","१","२","३","४","५","६","७","८","९"];
const hn = n => String(n).split("").map(x => digits[Number(x)]).join("");

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

function render(blocks) {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const knByVerse = {};
  if (languageChapter) {
    languageChapter.blocks.forEach(b => b.shlokas.forEach(s => {
      knByVerse[s.number] = b.meaning;
    }));
  }

  const filtered = blocks.map(b => ({
    ...b,
    shlokas: b.shlokas.filter(s =>
      !q || `${(s.lines || []).join(" ")} ${b.meaning || ""}`.toLowerCase().includes(q)
    )
  })).filter(b => b.shlokas.length);

  const count = filtered.reduce((n, b) => n + b.shlokas.length, 0);
  document.getElementById("verseCount").textContent =
    q ? `${count} श्लोक मिले` : `इस अध्याय में ${count} श्लोक`;

  let lastSpeaker = null;
  document.getElementById("verseList").innerHTML = filtered.map(b => {
    const showSpeaker = b.speaker && b.speaker !== lastSpeaker;
    if (b.speaker) lastSpeaker = b.speaker;
    const languageMeaning = selectedLanguage === "kn"
      ? knByVerse[b.shlokas[0]?.number]
      : b.meaning;

    return `
    <article class="verse-group">
      ${showSpeaker ? `<div class="verse-top"><span class="speaker">${esc(b.speaker)}</span></div>` : ""}
      <div class="verse-body">
        <div class="sanskrit-group">
          ${b.shlokas.map(s => `
            <div class="shloka" id="shloka-${s.number}">
              <span class="shloka-number">॥ ${hn(s.number)} ॥</span>
              <div class="shloka-text">
                ${(s.lines || []).map(line => `<div>${esc(line)}</div>`).join("")}
              </div>
            </div>`).join("")}
        </div>
        ${showMeaning && languageMeaning ? `
          <div class="meaning">
            <div class="meaning-label">${selectedLanguage === "kn" ? "ಕನ್ನಡ ಅರ್ಥ / ವಿವರಣೆ" : "हिन्दी अर्थ"}</div>
            <div>${esc(languageMeaning)}</div>
          </div>` : ""}
      </div>
    </article>`;
  }).join("") + (currentChapter.colophon && !q ? `
    <article class="colophon">
      <div class="colophon-sanskrit">${esc(currentChapter.colophon.sanskrit)}</div>
      ${showMeaning && selectedLanguage === "hi" ? `<div class="meaning"><div class="meaning-label">हिन्दी अर्थ</div><div>${esc(currentChapter.colophon.meaning)}</div></div>` : ""}
    </article>` : "");

  if (selectedLanguage === "kn" && !languageChapter) {
    document.getElementById("verseList").insertAdjacentHTML("afterbegin",
      `<div class="verse-group"><div class="verse-body"><div class="meaning">
      <div class="meaning-label">ಕನ್ನಡ</div>
      <div>ಈ ಅಧ್ಯಾಯದ ಕನ್ನಡ ಪಠ್ಯ ಇನ್ನೂ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ.</div>
      </div></div></div>`);
  }

  updateReadingFontSizes();
}

function renderChapters() {
  const box = document.getElementById("chapterList");
  const chapters = book.sections[0].chapters;
  box.innerHTML = chapters.map(c => `
    <button class="chapter-link ${c.number === currentChapter.chapter ? "active":""}" data-id="${c.id}">
      <span>अध्याय ${hn(c.number)}</span>
    </button>`).join("");

  box.querySelectorAll("button").forEach(b => b.onclick = async () => {
    const index = chapters.findIndex(x => x.id === b.dataset.id);
    await goToChapterByIndex(index);
  });
}

function updateChapterPager() {
  const chapters = book.sections[0].chapters;
  const index = chapters.findIndex(c => c.number === currentChapter.chapter);
  const prevBtn = document.getElementById("prevChapterBtn");
  const nextBtn = document.getElementById("nextChapterBtn");

  prevBtn.disabled = index <= 0;
  nextBtn.disabled = index < 0 || index >= chapters.length - 1;
  prevBtn.textContent = index > 0 ? `← अध्याय ${hn(chapters[index - 1].number)}` : "← पिछला अध्याय";
  nextBtn.textContent = index < chapters.length - 1 ? `अध्याय ${hn(chapters[index + 1].number)} →` : "अगला अध्याय →";
}

async function goToChapterByIndex(index) {
  const chapters = book.sections[0].chapters;
  if (index < 0 || index >= chapters.length) return;
  const c = chapters[index];
  currentChapter = await loadJSON(`books/shivamahapurana/mahatmya/${c.id}.json`);
  await loadLanguageChapter();
  document.getElementById("chapterTitle").textContent = `अध्याय ${hn(currentChapter.chapter)}`;
  document.getElementById("chapterDescription").textContent = currentChapter.title;
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
  await loadLanguageChapter();
  document.getElementById("bookTitle").textContent = book.title;
  document.getElementById("chapterTitle").textContent = `अध्याय ${hn(currentChapter.chapter)}`;
  document.getElementById("chapterDescription").textContent = currentChapter.title;
  renderChapters();
  render(currentChapter.blocks);
  updateChapterPager();
}

document.getElementById("searchInput").oninput = () => render(currentChapter.blocks);

document.getElementById("languageBtn").onclick = async () => {
  selectedLanguage = selectedLanguage === "hi" ? "kn" : "hi";
  document.getElementById("languageBtn").textContent = selectedLanguage === "hi" ? "हिन्दी" : "ಕನ್ನಡ";
  await loadLanguageChapter();
  render(currentChapter.blocks);
};

document.getElementById("meaningBtn").onclick = () => {
  showMeaning = !showMeaning;
  document.getElementById("meaningBtn").classList.toggle("active", showMeaning);
  render(currentChapter.blocks);
};

function updateReadingFontSizes() {
  const isMobile = window.matchMedia("(max-width: 700px)").matches;
  const shlokaSizes = ["1.28rem", "1.42rem", "1.58rem", "1.76rem"];
  const meaningSizes = isMobile ? ["21px", "23px", "25px", "27px"] : ["18.24px", "20.16px", "22.40px", "24.96px"];
  document.documentElement.style.setProperty("--reading", shlokaSizes[fontStep]);
  document.documentElement.style.setProperty("--meaning-size", meaningSizes[fontStep]);
  document.querySelectorAll(".meaning").forEach(el => el.style.setProperty("font-size", meaningSizes[fontStep], "important"));
}
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