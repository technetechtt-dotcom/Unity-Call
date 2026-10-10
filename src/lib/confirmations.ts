export interface ConfirmationCard {
  id: string;
  kind: 'amount' | 'date' | 'address' | 'appointment';
  value: string;
}

const amount = /\b(?:R|ZAR|\$|USD)\s?\d[\d\s,.]{1,12}\b/i;
const date = /\b(?:\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/i;
const time = /\b(?:[01]?\d|2[0-3])[:.]\d{2}\s?(?:am|pm)?\b/i;
const address = /\b(?:street|straat|road|rd|avenue|ave|lane|drive|dorp|township|municipality)\b/i;

export function detectConfirmations(text: string): ConfirmationCard[] {
  const cards: ConfirmationCard[] = [];
  const amountMatch = text.match(amount);
  if (amountMatch) {
    cards.push({ id: `amount-${amountMatch[0]}`, kind: 'amount', value: amountMatch[0] });
  }
  const dateMatch = text.match(date);
  const timeMatch = text.match(time);
  if (dateMatch || timeMatch) {
    cards.push({
      id: `date-${dateMatch?.[0] || timeMatch?.[0]}`,
      kind: timeMatch && !dateMatch ? 'appointment' : 'date',
      value: [dateMatch?.[0], timeMatch?.[0]].filter(Boolean).join(' ')
    });
  }
  if (address.test(text)) {
    cards.push({ id: `address-${text.slice(0, 24)}`, kind: 'address', value: text });
  }
  return cards;
}

export function sourceLabel(source: string) {
  switch (source) {
    case 'speech':
      return 'Original speech';
    case 'typed':
      return 'Typed reply';
    case 'sign':
      return 'Signed';
    case 'correction':
      return 'Corrected caption';
    case 'translation':
      return 'Translation';
    case 'ai':
      return 'AI suggestion';
    case 'transcription':
      return 'Transcription';
    default:
      return 'Original';
  }
}
