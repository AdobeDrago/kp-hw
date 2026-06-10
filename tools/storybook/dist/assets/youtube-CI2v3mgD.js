const n=new IntersectionObserver((e,o)=>{e.forEach(async t=>{t.isIntersecting&&(o.unobserve(t.target),t.target.callback(t.target))})});function a(e,o){e.callback=o,n.observe(e)}function r(e){e.innerHTML=`<iframe src="${e.dataset.src}" class="youtube"
  webkitallowfullscreen mozallowfullscreen allowfullscreen
  allow="encrypted-media; accelerometer; gyroscope; picture-in-picture"
  scrolling="no"
  title="Youtube Video">`}function s(e){const o=document.createElement("div");o.className="video";const t=new URLSearchParams(e.search),c=t.get("v")||e.pathname.split("/").pop();t.append("rel","0"),t.delete("v"),o.dataset.src=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(c)}?${t.toString()}`,e.parentElement.replaceChild(o,e),a(o,r)}export{s as default};
