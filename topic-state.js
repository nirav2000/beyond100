(() => {
  const DEFAULT_TOPIC = "Place Value & Number Structure";
  let activeName = DEFAULT_TOPIC;

  function data(){ return window.BEYOND100_DATA; }
  function has(name){ return Boolean(data()?.detailedTopics?.[name]); }
  function getName(){ return has(activeName) ? activeName : DEFAULT_TOPIC; }
  function getTopic(){ return data()?.detailedTopics?.[getName()] || null; }

  function setTopic(name, options = {}) {
    if (!has(name)) return false;
    const previous = getName();
    activeName = name;
    try { sessionStorage.setItem("beyond100.active-topic", name); } catch {}
    if (!options.silent && previous !== name) {
      window.dispatchEvent(new CustomEvent("beyond100-topic-changed", {
        detail: { name, previous, topic: getTopic() }
      }));
    }
    return true;
  }

  try {
    const saved = sessionStorage.getItem("beyond100.active-topic");
    if (saved && has(saved)) activeName = saved;
  } catch {}

  window.BEYOND100_TOPIC_STATE = { defaultTopic: DEFAULT_TOPIC, getName, getTopic, setTopic, has };
})();