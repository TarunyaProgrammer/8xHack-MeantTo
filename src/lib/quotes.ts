/**
 * Rotating line on the landing screen. Attributed where the line is a real
 * quotation; unattributed lines are our own copy, never a fabricated source.
 */
export interface Quote {
  text: string;
  by?: string;
}

export const QUOTES: Quote[] = [
  { text: 'Fashion fades, only style remains the same.', by: 'Coco Chanel' },
  { text: 'Style is a way to say who you are without having to speak.', by: 'Rachel Zoe' },
  { text: 'You only get one life. Wear the colour.' },
  { text: 'Dressing well is a form of good manners.', by: 'Tom Ford' },
  { text: 'The best colour in the whole world is the one that looks good on you.', by: 'Coco Chanel' },
  { text: 'Clothes mean nothing until someone lives in them.', by: 'Marc Jacobs' },
  { text: 'Nobody remembers the safe outfit.' },
  { text: 'Simplicity is the keynote of all true elegance.', by: 'Coco Chanel' },
];

export function quoteForToday(index: number): Quote {
  return QUOTES[index % QUOTES.length];
}
