const a="c2stRXdjZ2VpTGJUZl9IOTVkR3FkUjRYdw==";
const b="aHR0cHM6Ly9hcGkua29ib2lsbG0uY29tL3YxL2NoYXQvY29tcGxldGlvbnM=";

function d(x){
return atob(x).split('').map((c,i)=>{
return String.fromCharCode(c.charCodeAt(0)-(i%3));
}).join('');
}

export function u(){
return d(a).split('').map((c,i)=>{
return String.fromCharCode(c.charCodeAt(0)+(i%3));
}).join('');
}

export function y(){
return d(b).split('').map((c,i)=>{
return String.fromCharCode(c.charCodeAt(0)+(i%3));
}).join('');
}