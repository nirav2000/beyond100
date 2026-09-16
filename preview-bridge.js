(() => {
  if(!new URLSearchParams(location.search).has('version-preview'))return;
  let applying=false,lastRatio=-1;
  const ratio=()=>{const d=document.documentElement,max=Math.max(0,d.scrollHeight-innerHeight);return max?Math.max(0,Math.min(1,scrollY/max)):0};
  const send=()=>{if(applying)return;const r=ratio();if(Math.abs(r-lastRatio)<.001)return;lastRatio=r;parent.postMessage({type:'beyond100-preview-scroll',ratio:r},'*')};
  let frame=0;addEventListener('scroll',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(send)},{passive:true});
  addEventListener('message',e=>{const m=e.data;if(!m||m.type!=='beyond100-set-scroll'||typeof m.ratio!=='number')return;const d=document.documentElement,max=Math.max(0,d.scrollHeight-innerHeight);applying=true;scrollTo(0,max*Math.max(0,Math.min(1,m.ratio)));lastRatio=m.ratio;setTimeout(()=>{applying=false},60)});
  addEventListener('load',()=>parent.postMessage({type:'beyond100-preview-ready'},'*'));
})();