(() => {
  function validate(catalogue = window.BEYOND100_MATHS_CATALOGUE) {
    const errors = [], warnings = [], ids = new Map();
    if (!catalogue) return { ok:false, errors:["Catalogue not loaded"], warnings, stats:{} };
    const register = (id, kind) => {
      if (!id || typeof id !== "string") errors.push(kind + " missing stable id");
      else if (ids.has(id)) errors.push("Duplicate id: " + id + " (" + ids.get(id) + " and " + kind + ")");
      else ids.set(id, kind);
    };
    catalogue.domains.forEach(d => {
      register(d.id, "domain");
      if (!d.topics?.length) warnings.push("Domain has no topics: " + d.id);
      d.topics?.forEach(t => {
        register(t.id, "topic");
        if (!t.subtopics?.length) warnings.push("Topic has no subtopics: " + t.id);
        t.subtopics?.forEach(s => {
          register(s.id, "subtopic");
          if (!s.skills?.length) warnings.push("Subtopic has no skills: " + s.id);
          s.skills?.forEach(k => {
            register(k.id, "skill");
            if (!k.name) errors.push("Skill missing name: " + k.id);
            if (!Array.isArray(k.layers) || !k.layers.length) errors.push("Skill missing layer: " + k.id);
            (k.tags || []).forEach(tag => {
              if (!catalogue.thinkingTags[tag]) errors.push("Unknown thinking tag " + tag + " on " + k.id);
            });
          });
        });
      });
    });
    const levels = catalogue.attainmentBands?.map(b => b.level) || [];
    if (levels.join(",") !== "0,1,2,3,4,5") errors.push("Attainment bands must define levels 0-5 in order");
    const skillIds = catalogue.skills?.map(s => s.id) || [];
    if (new Set(skillIds).size !== skillIds.length) errors.push("Flattened skill index contains duplicate IDs");
    return {
      ok: errors.length === 0,
      errors, warnings,
      stats: {
        domains: catalogue.domains.length,
        topics: catalogue.domains.reduce((n,d)=>n+d.topics.length,0),
        subtopics: catalogue.domains.reduce((n,d)=>n+d.topics.reduce((m,t)=>m+t.subtopics.length,0),0),
        skills: skillIds.length
      }
    };
  }
  window.Beyond100CatalogueValidator = { validate };
  const result = validate();
  window.BEYOND100_CATALOGUE_VALIDATION = result;
  if (!result.ok) console.error("[Beyond100 catalogue] validation failed", result);
  else if (result.warnings.length) console.warn("[Beyond100 catalogue] validation warnings", result);
  else console.info("[Beyond100 catalogue] valid", result.stats);
})();