(() => {
  const data = window.BEYOND100_DATA;
  const topic = data.detailedTopics["Place Value & Number Structure"];
  let activeSubject = "maths";

  const $ = (id) => document.getElementById(id);
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

  function subjectKeyFromName(name) {
    return Object.keys(data.subjects).find(k => data.subjects[k].name === name) || "maths";
  }

  function renderHero() {
    $("topicSubject").textContent = `${topic.subject.toUpperCase()} · TOPIC-FIRST PROGRESSION`;
    $("topicTitle").textContent = "Place Value & Number Structure";
    $("topicSummary").textContent = topic.summary;
    $("whyText").textContent = topic.whyItMatters;
    $("masteryRule").textContent = topic.mastery.rule;
  }

  function renderSubjectTabs() {
    $("subjectTabs").innerHTML = Object.entries(data.subjects).map(([key, subject]) =>
      `<button data-subject="${key}" class="${key === activeSubject ? "active" : ""}">${subject.name}</button>`
    ).join("");
    qsa("[data-subject]").forEach(btn => btn.addEventListener("click", () => {
      activeSubject = btn.dataset.subject;
      renderSubjectTabs();
      renderTopicList();
    }));
  }

  function renderTopicList() {
    const query = $("topicSearch").value.trim().toLowerCase();
    const items = data.subjects[activeSubject].topics
      .filter(t => t.toLowerCase().includes(query));
    $("topicList").innerHTML = items.map(name => {
      const detailed = Boolean(data.detailedTopics[name]);
      return `<button class="topic-item ${detailed ? "active" : "placeholder"}" data-topic="${escapeHtml(name)}">${escapeHtml(name)}</button>`;
    }).join("") || `<div class="empty-state">No matching topics.</div>`;

    qsa("[data-topic]").forEach(btn => btn.addEventListener("click", () => {
      if (data.detailedTopics[btn.dataset.topic]) {
        closeSidebar();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        openFactory(btn.dataset.topic, activeSubject);
      }
    }));
  }

  function renderProgression() {
    $("progressionGrid").innerHTML = topic.stages.map(stage => {
      const isCurrent = stage.year === "Y5";
      return `
        <article class="stage-card ${isCurrent ? "current open" : ""}">
          <div class="stage-head" role="button" tabindex="0" aria-expanded="${isCurrent}">
            <div class="year-pill"><strong>${stage.year}</strong></div>
            <div class="stage-title"><strong>${escapeHtml(stage.label)}</strong><span>Age ${escapeHtml(stage.age)}${isCurrent ? " · Sai's current year" : ""}</span></div>
            <span class="stage-toggle">＋</span>
          </div>
          <div class="stage-body">
            <div>
              <h4>Understand & do</h4>
              <ul>${stage.skills.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
            </div>
            <div class="quick-checks">
              <h4>Quick diagnostic</h4>
              <ol>${stage.quickChecks.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ol>
            </div>
            ${stage.note ? `<div class="stage-note">${escapeHtml(stage.note)}</div>` : ""}
          </div>
        </article>`;
    }).join("");

    qsa(".stage-head").forEach(head => {
      const toggle = () => {
        const card = head.closest(".stage-card");
        card.classList.toggle("open");
        head.setAttribute("aria-expanded", card.classList.contains("open"));
      };
      head.addEventListener("click", toggle);
      head.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    });
  }

  function renderMastery() {
    $("masteryGrid").innerHTML = topic.mastery.dimensions.map(d => `
      <article class="mastery-card" tabindex="0" aria-expanded="false">
        <div class="mastery-front">
          <h3>${escapeHtml(d.name)}</h3>
          <p>Double-click the card to reveal the examples.</p>
          <button type="button" class="mastery-flip-button">Reveal examples</button>
        </div>
        <div class="mastery-back" aria-hidden="true">
          <h3>${escapeHtml(d.name)}</h3>
          <ul>${d.examples.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
          <button type="button" class="mastery-flip-button">Hide examples</button>
        </div>
      </article>`).join("");

    $("thresholds").innerHTML = topic.mastery.thresholds.map(t => `
      <div class="threshold"><strong>${escapeHtml(t.status)}</strong><p>${escapeHtml(t.rule)}</p></div>`).join("");

    qsa(".mastery-card").forEach(card => {
      const flip = () => {
        if (document.body.classList.contains("annotating")) return;
        const on = !card.classList.contains("is-flipped");
        card.classList.toggle("is-flipped", on);
        card.setAttribute("aria-expanded", String(on));
        qs(".mastery-back", card)?.setAttribute("aria-hidden", String(!on));
      };
      card.addEventListener("dblclick", e => { e.preventDefault(); flip(); });
      qsa(".mastery-flip-button", card).forEach(btn => btn.addEventListener("click", e => { e.stopPropagation(); flip(); }));
      card.addEventListener("keydown", e => {
        if (e.key === "Enter") { e.preventDefault(); flip(); }
      });
    });
  }

  function renderMisconceptions() {
    $("misconceptionList").innerHTML = topic.misconceptions.map((m, i) => `
      <div class="misconception"><span>${i + 1}</span><div>${escapeHtml(m)}</div></div>`).join("");
  }

  function populateYearSelects() {
    const years = topic.stages.map(s => s.year);
    $("diagnosticYear").innerHTML = years.map(y => `<option ${y === "Y5" ? "selected" : ""}>${y}</option>`).join("");
    $("questionYear").innerHTML = `<option value="all">All years</option>` + years.map(y => `<option>${y}</option>`).join("");
  }

  function questionCard(q, diagnostic = false) {
    return `<article class="question-card ${diagnostic ? "diagnostic" : ""}" data-qid="${q.id}">
      <div class="question-card-head">
        <div class="badges"><span class="badge">${q.year}</span><span class="badge ${q.type}">${q.type === "short" ? "direct" : q.type}</span><span class="badge">${escapeHtml(q.skill)}</span></div>
      </div>
      <p class="question-prompt">${escapeHtml(q.prompt)}</p>
      <button class="reveal">Reveal answer</button>
      <div class="answer"><strong>Answer</strong><br>${escapeHtml(q.answer)}</div>
      ${diagnostic ? `<div class="score-row">
        ${["✓ Secure","K Knowledge","C Concept","Q Question","P Procedure","F Fluency","R Reasoning","A Attention"].map(x => `<button class="score-btn">${x}</button>`).join("")}
      </div>` : ""}
    </article>`;
  }

  function bindQuestionActions(root = document) {
    qsa(".reveal", root).forEach(btn => btn.addEventListener("click", () => {
      const answer = btn.nextElementSibling;
      answer.classList.toggle("show");
      btn.textContent = answer.classList.contains("show") ? "Hide answer" : "Reveal answer";
    }));
    qsa(".score-btn", root).forEach(btn => btn.addEventListener("click", () => {
      const row = btn.closest(".score-row");
      qsa(".score-btn", row).forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    }));
  }

  function renderQuestionBank() {
    const year = $("questionYear").value;
    const type = $("questionType").value;
    const filtered = topic.questions.filter(q => (year === "all" || q.year === year) && (type === "all" || q.type === type));
    $("questionBank").innerHTML = filtered.map(q => questionCard(q)).join("") || `<div class="empty-state">No questions match those filters.</div>`;
    bindQuestionActions($("questionBank"));
  }

  function buildDiagnostic() {
    const targetYear = $("diagnosticYear").value;
    const count = Number($("diagnosticCount").value);
    const yearNum = Number(targetYear.slice(1));
    const eligible = topic.questions.filter(q => Math.abs(Number(q.year.slice(1)) - yearNum) <= 1);
    const priority = [...eligible].sort((a, b) => {
      const ad = Math.abs(Number(a.year.slice(1)) - yearNum);
      const bd = Math.abs(Number(b.year.slice(1)) - yearNum);
      return ad - bd || Math.random() - .5;
    });
    const chosen = priority.slice(0, count);
    $("diagnosticSet").classList.remove("empty-state");
    $("diagnosticSet").innerHTML = `
      <div class="why-card" style="margin-bottom:8px"><span class="why-icon">${targetYear}</span><div><strong>Cold diagnostic</strong><p>Ask these without teaching first. If he answers quickly, probe “why?” or ask for another method. Mark the dominant error cause, not merely right/wrong.</p></div></div>
      ${chosen.map(q => questionCard(q, true)).join("")}`;
    bindQuestionActions($("diagnosticSet"));
  }

  function randomQuestion() {
    const cards = qsa("#questionBank .question-card");
    if (!cards.length) return;
    const card = cards[Math.floor(Math.random() * cards.length)];
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.animate([{ transform:"scale(1)" }, { transform:"scale(1.015)" }, { transform:"scale(1)" }], { duration: 450 });
  }

  function setSection(id) {
    qsa(".content-section").forEach(s => s.classList.toggle("active", s.id === id));
    qsa(".section-nav button").forEach(b => b.classList.toggle("active", b.dataset.section === id));
    const target = $(id);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function buildFactoryOptions() {
    $("factorySubject").innerHTML = Object.entries(data.subjects).map(([key,s]) => `<option value="${key}">${s.name}</option>`).join("");
    updateFactoryTopics();
  }

  function updateFactoryTopics(selected) {
    const key = $("factorySubject").value || "maths";
    $("factoryTopic").innerHTML = data.subjects[key].topics.map(t => `<option ${t === selected ? "selected" : ""}>${escapeHtml(t)}</option>`).join("");
  }

  function makeFactoryPack() {
    const subjectKey = $("factorySubject").value;
    const subject = data.subjects[subjectKey].name;
    const name = $("factoryTopic").value;
    const currentYear = $("factoryCurrentYear").value;
    const prompt = `Create a Beyond 100 topic-first syllabus entry for “${name}” in ${subject}, using the Place Value & Number Structure topic as the quality benchmark.\n\nLearner context: current ${currentYear}, but show the full developmental road from the earliest meaningful foundation through Y7. For KS3, do not pretend the England National Curriculum assigns statutory content specifically to Y7 when it is specified across KS3; label practical early-KS3 progression clearly.\n\nFor EACH year/stage include:\n- age band\n- a concise developmental label\n- 5–8 precise skills/understandings, cumulative rather than repetitive\n- 4–6 quick cold-diagnostic questions that can distinguish procedural success from conceptual understanding\n- deliberate boundary/trap examples where useful\n\nThen include:\n1. a 1-paragraph summary and “why it matters”\n2. a deep mastery section with multiple dimensions such as represent, reverse, explain, compare, manipulate, apply, transfer and retain, adapted appropriately to this topic\n3. 8–12 common misconceptions that a superficially correct child may still hold\n4. at least 20 varied question-bank items across years, tagged direct / explain / reasoning, each with an answer and atomic skill label\n5. clear distinction between curriculum expectation, useful extension and 11+ technique where relevant\n6. no filler, duplicated objectives or artificial year progression\n\nReturn ONLY a JavaScript object matching the schema below, suitable for inserting into window.BEYOND100_DATA.detailedTopics[“${name}”].`;

    const schema = {
      id: `${subjectKey}-${slugify(name)}`,
      subject,
      summary: "",
      whyItMatters: "",
      stages: ["Y1","Y2","Y3","Y4","Y5","Y6","Y7"].map(year => ({
        year,
        age: "",
        label: "",
        skills: [""],
        quickChecks: [""]
      })),
      mastery: {
        rule: "",
        dimensions: [{ name: "", examples: [""] }],
        thresholds: topic.mastery.thresholds
      },
      misconceptions: [""],
      questions: [{ id: "", year: currentYear, prompt: "", answer: "", type: "short", skill: "" }],
      sourceNotes: [""]
    };
    $("factoryPrompt").textContent = prompt;
    $("factorySchema").textContent = JSON.stringify(schema, null, 2);
  }

  function openFactory(selectedTopic, subjectKey) {
    if (subjectKey) {
      $("factorySubject").value = subjectKey;
      updateFactoryTopics(selectedTopic);
    }
    $("factory").hidden = false;
    $("scrim").classList.add("show");
    makeFactoryPack();
    closeSidebar();
  }

  function closeFactory() {
    $("factory").hidden = true;
    $("scrim").classList.remove("show");
  }

  function openSidebar() {
    $("sidebar").classList.add("open");
    $("scrim").classList.add("show");
  }
  function closeSidebar() {
    $("sidebar").classList.remove("open");
    if ($("factory").hidden) $("scrim").classList.remove("show");
  }

  function copyText(text, button) {
    navigator.clipboard.writeText(text).then(() => {
      const old = button.textContent;
      button.textContent = "Copied ✓";
      setTimeout(() => button.textContent = old, 1400);
    });
  }

  function slugify(str) {
    return str.toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
  }

  function bindGlobalEvents() {
    $("topicSearch").addEventListener("input", renderTopicList);
    qsa(".section-nav button").forEach(b => b.addEventListener("click", () => setSection(b.dataset.section)));
    qsa("[data-jump]").forEach(b => b.addEventListener("click", () => setSection(b.dataset.jump)));
    $("questionYear").addEventListener("change", renderQuestionBank);
    $("questionType").addEventListener("change", renderQuestionBank);
    $("buildDiagnostic").addEventListener("click", buildDiagnostic);
    $("randomQuestion").addEventListener("click", randomQuestion);
    $("openFactory").addEventListener("click", () => openFactory());
    $("closeFactory").addEventListener("click", closeFactory);
    $("factorySubject").addEventListener("change", () => { updateFactoryTopics(); makeFactoryPack(); });
    $("factoryTopic").addEventListener("change", makeFactoryPack);
    $("factoryCurrentYear").addEventListener("change", makeFactoryPack);
    $("makeFactory").addEventListener("click", makeFactoryPack);
    $("copyPrompt").addEventListener("click", e => copyText($("factoryPrompt").textContent, e.currentTarget));
    $("copySchema").addEventListener("click", e => copyText($("factorySchema").textContent, e.currentTarget));
    $("openNav").addEventListener("click", openSidebar);
    $("closeNav").addEventListener("click", closeSidebar);
    $("scrim").addEventListener("click", () => { closeFactory(); closeSidebar(); });
  }

  function init() {
    renderHero();
    renderSubjectTabs();
    renderTopicList();
    renderProgression();
    renderMastery();
    renderMisconceptions();
    populateYearSelects();
    renderQuestionBank();
    buildFactoryOptions();
    makeFactoryPack();
    bindGlobalEvents();
  }

  init();
})();
