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
  learnerId: 'sai-beyond100',
  appId: 'beyond100',
  firestoreBase: ['families', '2AJSfYdtg5URWHv7HCzpNMmKIlg2', 'learners', 'sai-beyond100', 'progress']
};

// Release identity is set before notes.js loads so annotations carry the exact app version.
window.BEYOND100_CURRENT_VERSION = '0.4.0';
if (window.BEYOND100_DATA?.meta) window.BEYOND100_DATA.meta.version = window.BEYOND100_CURRENT_VERSION;

(() => {
  const version = window.BEYOND100_CURRENT_VERSION;
  const style = document.createElement('style');
  style.textContent = '.version-pill{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 11px;border:1px solid var(--line);border-radius:999px;background:var(--paper);color:var(--ink);font-size:11px;font-weight:700;text-decoration:none;white-space:nowrap}.version-pill:hover{border-color:#9b9e96;background:#f1f2ed}@media(max-width:640px){.version-pill{padding:0 9px}.version-pill .version-word{display:none}}';
  document.head.appendChild(style);
  const bar = document.querySelector('.topbar');
  const nav = document.querySelector('#openNav');
  if (bar && !document.querySelector('#versionLabLink')) {
    const link = document.createElement('a');
    link.id = 'versionLabLink';
    link.className = 'version-pill';
    link.href = 'versions.html';
    link.title = 'Open Version Lab';
    link.innerHTML = `<span class="version-word">Versions · </span>v${version}`;
    bar.insertBefore(link, nav || null);
  }
  const footerVersion = document.querySelector('footer span:first-child');
  if (footerVersion) footerVersion.textContent = `Beyond 100 · v${version}`;
})();
