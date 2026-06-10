const n=(()=>{const{host:e}=window.location;return["--","local"].some(o=>e.includes(o))?["--"].some(o=>e.includes(o))?"stage":"dev":"prod"})();export{n as E};
