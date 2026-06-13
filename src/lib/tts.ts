const phrasesFirstLoss = [
  '{name} kok goblok banget bisa kalah!!',
  'Ya Allah.. {name} kalah...',
  'aduh.. {name} kebanyakan makan MBG ya jadi kalah?',
  'lah.. {name} kalah? bisa main ga sih!!?',
  'mending {name} main sama kucing aja diluar ya',
];

const phrasesSecondLoss = [
  'astaga... {name} kalah mulu !!',
  'busetdah!!! {name} kalah lagi aja!!!',
  'mending {name} tidur ya, main fifa kalah mulu!',
  'idiiiihh {name} kalah melulu kerjaannya',
];

let lastPhrase = -1;
let lastSet: 'first' | 'second' | null = null;

function getPhrase(name: string, losses: number): string {
  const set = losses === 0 ? phrasesFirstLoss : phrasesSecondLoss;
  const currentSet: 'first' | 'second' = losses === 0 ? 'first' : 'second';
  let idx: number;
  do {
    idx = Math.floor(Math.random() * set.length);
  } while (idx === lastPhrase && lastSet === currentSet && set.length > 1);
  lastPhrase = idx;
  lastSet = currentSet;
  return set[idx].replace('{name}', name);
}

function speakViaSpeechSynthesis(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'id-ID';
    u.rate = 1.1;
    u.pitch = 1.05;
    u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const idVoices = voices.filter((v) => v.lang.startsWith('id'));
    const idFemale = idVoices.find(
      (v) => /female|sari|ayu|google|perempuan/i.test(v.name)
    );
    const idAny = idVoices[0] ?? null;
    u.voice = idFemale ?? idAny;
    u.onend = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

function speakViaGoogleTTS(text: string): Promise<void> {
  return new Promise((resolve) => {
    const url =
      'https://translate.google.com/translate_tts?' +
      'ie=UTF-8&client=tw-ob&tl=id&q=' +
      encodeURIComponent(text);
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    const ac = new AudioContext();
    const source = ac.createMediaElementSource(audio);
    const gain = ac.createGain();
    gain.gain.value = 1.25;
    source.connect(gain);
    gain.connect(ac.destination);
    audio.play().catch(() => resolve());
  });
}

export async function speakLoser(name: string, losses: number): Promise<void> {
  const phrase = getPhrase(name, losses);
  try {
    await speakViaSpeechSynthesis(phrase);
  } catch {
    await speakViaGoogleTTS(phrase);
  }
}

export async function speakLosersComplete(names: string[]): Promise<void> {
  if (names.length === 0) return;
  let phrase: string;
  if (names.length === 1) {
    phrase = `goblok! ${names[0]} mau pilih hukuman apa nih??`;
  } else {
    phrase = `ini berdua tololnya barengan, ${names[0]} sama ${names[1]} mau hukuman yang mana?? cepet!`;
  }
  try {
    await speakViaSpeechSynthesis(phrase);
  } catch {
    await speakViaGoogleTTS(phrase);
  }
}
