let id=1
let str="";
for(let i=1;i<81;i++){
    str+="<div class=\"grid-row\">\n";
    let l=81;
    if(i%2==0)
        l=80;
    for(let j=0;j<l;j++){
        str+="\t<abbr id='abbr-"+id+"' title='Province: null'><div onclick=\"clc(this)\" id=\"tile-"+id+"\" class=\"tile\"></div></abbr>";
        id++;
    }
    str+="</div>\n";
}
console.log(str);
