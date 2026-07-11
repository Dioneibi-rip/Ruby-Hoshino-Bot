let R = Math.random;
let Fl = Math.floor;
let toM = (a) => "@" + a.split("@")[0];
function handler(m, {groupMetadata}) {
let ps = groupMetadata.participants.map((v) => v.id);
let a = ps[Fl(R() * ps.length)];
let b;
do b = ps[Fl(R() * ps.length)];
while (b === a);
let c;
do c = ps[Fl(R() * ps.length)];
while (b === a);
let d;
do d = ps[Fl(R() * ps.length)];
while (b === a);
let e;
do e = ps[Fl(R() * ps.length)];
while (b === a);
let f;
do f = ps[Fl(R() * ps.length)];
while (b === a);
let g;
do g = ps[Fl(R() * ps.length)];
while (b === a);
let h;
do h = ps[Fl(R() * ps.length)];
while (b === a);
let i;
do i = ps[Fl(R() * ps.length)];
while (b === a);
let j;
do j = ps[Fl(R() * ps.length)];
while (b === a);
m.reply(
`*😍_Las 5 mejores parejas del grupo_😍*

*_1.- ${toM(a)} y ${toM(b)}_*
- Esta pareja esta destinada a estar junta 💙

*_2.- ${toM(c)} y ${toM(d)}_*
- Esta pareja son dos pequeños tortolitos enamorados ✨

*_3.- ${toM(e)} y ${toM(f)}_*
- Ufff y que decir de esta pareja, ya hasta familia deberian tener 🤱🧑‍🍼

*_4.- ${toM(g)} y ${toM(h)}_*
- Estos ya se casaron en secreto 💍

*_5.- ${toM(i)} y ${toM(j)}_*
- Esta pareja se esta de luna de miel ✨🥵😍❤️*`,
null,
{
mentions: [a, b, c, d, e, f, g, h, i, j],
}
);
}
handler.help = ["formarpareja5"];
handler.tags = ["fun"];
handler.command = ["formarpareja5"];
handler.register = true;
handler.group = true;

export default handler;
