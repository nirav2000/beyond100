(() => {
  const releases=window.BEYOND100_RELEASES;
  const data=window.BEYOND100_DATA;
  if(!releases||!data)return;
  const version=releases.currentVersion;
  data.meta.version=version;
  document.documentElement.dataset.appVersion=version;
  window.addEventListener('DOMContentLoaded',()=>{
    const footer=[...document.querySelectorAll('footer span')].find(el=>/Beyond 100/.test(el.textContent));
    if(footer)footer.textContent=`Beyond 100 · v${version}`;
  });
})();
