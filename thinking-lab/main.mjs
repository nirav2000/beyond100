import {mountPanel} from './panel.mjs';
const ready=mountPanel();
if(ready){import('./app.mjs').catch(error=>{console.error('Maths Thinking Lab could not start',error);const root=document.getElementById('thinkingLabRoot');if(root)root.textContent='Maths Thinking Lab could not load; please refresh the page.';});}
