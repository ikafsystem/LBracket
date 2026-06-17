import { createWinnersBracketTournament, completeMatch, getRounds } from '@/lib/engine';
import type { Tournament } from '@/types';

function simulateBracket(n: number): void {
    console.log(`\n========== TEST: ${n} participants ==========`);

    const participants = Array.from({ length: n }, (_, i) => ({
        name: `Player ${i + 1}`,
        teamName: `Team ${i + 1}`,
    }));

    const t = createWinnersBracketTournament({
        name: `Test ${n}`,
        participants,
    });

    console.log(`Matches created: ${t.matches.length}`);
    console.log(`Upper rounds: ${getRounds(t.matches, 'upper').length}`);
    console.log(`Lower rounds: ${getRounds(t.matches, 'lower').length}`);
    console.log(`Grand final: ${t.matches.filter(m => m.bracket === 'grand-final').length}`);

    // Show initial state
    console.log('\nInitial matches:');
    for (const m of t.matches) {
        console.log(`  ${m.bracket} R${m.round} P${m.position}: ${m.participant1Id ? 'P1' : '--'} vs ${m.participant2Id ? 'P2' : '--'} ${m.completed ? '(done)' : ''} ${m.bye ? '(bye)' : ''}`);
    }

    // Show participants
    console.log('\nParticipants:');
    for (const p of t.participants) {
        console.log(`  ${p.name} (${p.id.substring(0, 6)}): status=${p.status}, losses=${p.losses}`);
    }
}

// Test with 8, 16, 12, 10, 6, 3 participants
[8, 16, 12, 10, 6, 4, 3].forEach(simulateBracket);