import{S as I,i as K,s as L,U as N,G as C,H as O,C as o,M as F,g as Q,E,J as u,aj as m,a1 as b,W as V,X as Z,Y as x,p as $,t as ee,q as ae,$ as le,r as te,y,b as ie}from"./index-56e7be3e.js";import{b as ne}from"./ModifyUpload.svelte_svelte_type_style_lang-d2acacf0.js";function re(l){let a,n,r,c,g,f,i,k,p;const w=l[15].default,d=N(w,l,l[14],null);return{c(){a=C("div"),d&&d.c(),n=O(),r=C("input"),o(r,"type","file"),o(r,"accept",l[0]),r.multiple=c=l[4]==="multiple"||void 0,o(r,"webkitdirectory",g=l[4]==="directory"||void 0),o(r,"mozdirectory",f=l[4]==="directory"||void 0),o(r,"class","svelte-116rqfv"),o(a,"class","svelte-116rqfv"),F(a,"center",l[2]),F(a,"boundedheight",l[1]),F(a,"flex",l[3])},m(t,s){Q(t,a,s),d&&d.m(a,null),E(a,n),E(a,r),l[23](r),i=!0,k||(p=[u(r,"change",l[8]),u(a,"drag",m(b(l[16]))),u(a,"dragstart",m(b(l[17]))),u(a,"dragend",m(b(l[18]))),u(a,"dragover",m(b(l[19]))),u(a,"dragenter",m(b(l[20]))),u(a,"dragleave",m(b(l[21]))),u(a,"drop",m(b(l[22]))),u(a,"click",l[7]),u(a,"drop",l[9]),u(a,"dragenter",l[6]),u(a,"dragleave",l[6])],k=!0)},p(t,[s]){d&&d.p&&(!i||s&16384)&&V(d,w,t,t[14],i?x(w,t[14],s,null):Z(t[14]),null),(!i||s&1)&&o(r,"accept",t[0]),(!i||s&16&&c!==(c=t[4]==="multiple"||void 0))&&(r.multiple=c),(!i||s&16&&g!==(g=t[4]==="directory"||void 0))&&o(r,"webkitdirectory",g),(!i||s&16&&f!==(f=t[4]==="directory"||void 0))&&o(r,"mozdirectory",f),(!i||s&4)&&F(a,"center",t[2]),(!i||s&2)&&F(a,"boundedheight",t[1]),(!i||s&8)&&F(a,"flex",t[3])},i(t){i||($(d,t),i=!0)},o(t){ee(d,t),i=!1},d(t){t&&ae(a),d&&d.d(t),l[23](null),k=!1,le(p)}}}function de(l,a,n){let{$$slots:r={},$$scope:c}=a,{filetype:g=null}=a,{include_file_metadata:f=!0}=a,{dragging:i=!1}=a,{boundedheight:k=!0}=a,{center:p=!0}=a,{flex:w=!0}=a,{file_count:d="single"}=a,{disable_click:t=!1}=a,{parse_to_data_url:s=!0}=a,v;const S=te(),j=()=>{n(10,i=!i)},A=()=>{t||(n(5,v.value="",v),v.click())},D=async e=>{let h=Array.from(e);if(!(!e.length||!window.FileReader)){if(d==="single"&&(h=[e[0]]),f)var T=h.map(_=>({name:_.name,size:_.size}));var z=[],U=[];s?U=await Promise.all(h.map(_=>ne(_))):U=h,f?s?z=U.map((_,q)=>({data:_,...T[q]})):z=U.map((_,q)=>({data:"",blob:_,...T[q]})):z=U,S("load",d==="single"?z[0]:z)}},B=async e=>{const h=e.target;h.files&&await D(h.files)},G=async e=>{n(10,i=!1),e.dataTransfer?.files&&await D(e.dataTransfer.files)};function H(e){y.call(this,l,e)}function J(e){y.call(this,l,e)}function M(e){y.call(this,l,e)}function P(e){y.call(this,l,e)}function R(e){y.call(this,l,e)}function W(e){y.call(this,l,e)}function X(e){y.call(this,l,e)}function Y(e){ie[e?"unshift":"push"](()=>{v=e,n(5,v)})}return l.$$set=e=>{"filetype"in e&&n(0,g=e.filetype),"include_file_metadata"in e&&n(11,f=e.include_file_metadata),"dragging"in e&&n(10,i=e.dragging),"boundedheight"in e&&n(1,k=e.boundedheight),"center"in e&&n(2,p=e.center),"flex"in e&&n(3,w=e.flex),"file_count"in e&&n(4,d=e.file_count),"disable_click"in e&&n(12,t=e.disable_click),"parse_to_data_url"in e&&n(13,s=e.parse_to_data_url),"$$scope"in e&&n(14,c=e.$$scope)},[g,k,p,w,d,v,j,A,B,G,i,f,t,s,c,r,H,J,M,P,R,W,X,Y]}class fe extends I{constructor(a){super(),K(this,a,de,re,L,{filetype:0,include_file_metadata:11,dragging:10,boundedheight:1,center:2,flex:3,file_count:4,disable_click:12,parse_to_data_url:13})}}export{fe as U};
//# sourceMappingURL=Upload-25321626.js.map