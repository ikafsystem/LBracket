const { createWinnersBracketTournament } = require("../src/lib/engine");
const participants = [];
for (let i = 0; i < 18; i++) {
  participants.push({ id: "p" + (i+1), name: "Player " + (i+1), seed: i+1 });
}
const t = createWinnersBracketTournament(participants, "Test", "WB");
const lbR1 = t.matches.filter(m => m.bracket === "lower" && m.round === 1).sort((a,b) => a.position - b.position);
const lbR2 = t.matches.filter(m => m.bracket === "lower" && m.round === 2).sort((a,b) => a.position - b.position);
console.log("=== LB R1 ===");
lbR1.forEach(m => console.log(m.label, "pos:", m.position, "id:", m.id.slice(0,8), "winnerNext:", m.winnerNextMatchId ? m.winnerNextMatchId.slice(0,8) : "null"));
console.log("=== LB R2 ===");
lbR2.forEach(m => console.log(m.label, "pos:", m.position, "id:", m.id.slice(0,8)));
console.log("=== LB R1 -> R2 routing ===");
lbR1.forEach(m1 => {
  const target = lbR2.find(m2 => m2.id === m1.winnerNextMatchId);
  console.log(m1.label, "->", target ? target.label : "N/A");
});
