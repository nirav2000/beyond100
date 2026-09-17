// Public Firebase client configuration shared with the user's learning apps.
// Firebase API keys identify the project; access is protected by Firebase Authentication
// and Firestore security rules. Never place passwords or private service-account keys here.
window.BEYOND100_CLOUD = {
  firebase: {
    apiKey: 'AIzaSyDrreK9rhsoOpIYNr4QeNZ7CsXgQiMPW0E',
    authDomain: 'kk-syllabus.firebaseapp.com',
    projectId: 'kk-syllabus',
    storageBucket: 'kk-syllabus.firebasestorage.app',
    messagingSenderId: '821660665663',
    appId: '1:821660665663:web:c708860329bb97dc24758a'
  },
  ownerUid: '2AJSfYdtg5URWHv7HCzpNMmKIlg2',

  // Beyond 100 is the app. Sai's learner identity is resolved separately from
  // the shared Firebase learner catalogue after the parent signs in.
  appId: 'beyond100',
  appName: 'Beyond 100',
  appMeaning: 'going beyond the average',
  learnerLookup: {
    preferredLabel: 'Sai',
    legacyId: 'sai-beyond100'
  },

  // Kept only so existing Beyond 100 data can be discovered and migrated.
  // New writes use learnerProgressBase once learner-profile.js resolves Sai's
  // existing learner record in the shared kk-syllabus project.
  legacyLearnerId: 'sai-beyond100',
  legacyFirestoreBase: ['families', '2AJSfYdtg5URWHv7HCzpNMmKIlg2', 'learners', 'sai-beyond100', 'progress'],
  learnerId: 'sai-beyond100',
  firestoreBase: ['families', '2AJSfYdtg5URWHv7HCzpNMmKIlg2', 'learners', 'sai-beyond100', 'progress']
};

(() => {
  const version = window.BEYOND100_RELEASES?.currentVersion || window.BEYOND100_DATA?.meta?.version || '0.0.0';
  if (window.BEYOND100_DATA?.meta) window.BEYOND100_DATA.meta.version = version;
  const style = document.createElement('style');
  style.textContent = '.version-pill{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 11px;border:1px solid var(--line);border-radius:999px;background:var(--paper);color:var(--ink);font-size:11px;font-weight:700;text-decoration:none;white-space:nowrap}.version-pill:hover{border-color:#9b9e96;background:#f1f2ed}@media(max-width:640px){.version-pill{padding:0 9px}.version-pill .version-word{display:none}}';
  document.head.appendChild(style);
  const bar = document.querySelector('.topbar'), nav = document.querySelector('#openNav');
  if (bar && nav && !document.querySelector('#versionLabLink')) {
    const link = document.createElement('a');
    link.id = 'versionLabLink'; link.className = 'version-pill'; link.href = 'versions.html'; link.title = 'Open Version Lab';
    link.innerHTML = `<span class="version-word">Versions · </span>v${version}`;
    bar.insertBefore(link, nav);
  }
  const footerVersion = document.querySelector('footer span:first-child');
  if (footerVersion) footerVersion.textContent = `Beyond 100 · v${version}`;
})();