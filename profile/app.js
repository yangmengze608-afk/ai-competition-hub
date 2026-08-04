const button=document.getElementById('lang');
const nodes=document.querySelectorAll('[data-zh][data-en]');
let language=localStorage.getItem('ym-profile-language')||'zh';
function apply(next){language=next;document.documentElement.lang=language==='zh'?'zh-CN':'en';nodes.forEach(node=>node.textContent=node.dataset[language]);button.textContent=language==='zh'?'EN':'中文';localStorage.setItem('ym-profile-language',language)}
button.addEventListener('click',()=>apply(language==='zh'?'en':'zh'));
apply(language);
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.1});
document.querySelectorAll('.reveal').forEach(node=>observer.observe(node));