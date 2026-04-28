const m=137,n=997;

const r=[
18642,19103,18755,19211,18888,
19002,18911,19333,18777,18821,
19290,19111,18845,18976,19088,
18701,19302,18867,18990,19123
];

const s=[
154,216,178,199,210,165,233,190,205,222,
188,176,240,201,167,219,182,211,193,207,
226,185,199,214,168,230,177,202,216,189,
208,224,173,196,212,187,229,181,203,217
];

function x(a,b){
return a.map((v,i)=>{
let t=v;
t=(t-(i*b))%251;
if(t<0)t+=251;
t=t^b;
return String.fromCharCode(t);
}).join('');
}

export function u(){
return r.map((x,i)=>{
let t=x;
t=(t-(i*m))%n;
if(t<0)t+=n;
t=t^m;
return String.fromCharCode(t);
}).join('');
}

export function y(){
return x(s,73);
}