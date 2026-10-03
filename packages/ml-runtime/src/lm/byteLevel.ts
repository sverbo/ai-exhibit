/**
 * Character offsets for byte-level BPE tokenizers (GPT-2, SmolLM2).
 *
 * Transformers.js does not return offsets, but byte-level vocabularies encode
 * every UTF-8 byte as one printable character (the GPT-2 `bytes_to_unicode`
 * table). Mapping each token string back to bytes lets us locate every token in
 * the original text exactly, including tokens that hold only part of a
 * multi-byte character (an emoji split in three, for instance).
 */

let byteDecoder: Map<string, number> | null = null;

/** GPT-2 bytes_to_unicode, reversed: printable char -> byte value. */
export function getByteDecoder(): Map<string, number> {
  if (byteDecoder) return byteDecoder;
  const bs: number[] = [];
  for (let i = 0x21; i <= 0x7e; i++) bs.push(i);
  for (let i = 0xa1; i <= 0xac; i++) bs.push(i);
  for (let i = 0xae; i <= 0xff; i++) bs.push(i);
  const cs = [...bs];
  let n = 0;
  for (let b = 0; b < 256; b++) {
    if (!bs.includes(b)) {
      bs.push(b);
      cs.push(256 + n);
      n++;
    }
  }
  byteDecoder = new Map(bs.map((b, i) => [String.fromCodePoint(cs[i]!), b]));
  return byteDecoder;
}

/** Bytes a byte-level token string stands for, or null for non byte-level tokens. */
export function tokenStringToBytes(token: string): number[] | null {
  const dec = getByteDecoder();
  const out: number[] = [];
  for (const ch of token) {
    const b = dec.get(ch);
    if (b === undefined) return null;
    out.push(b);
  }
  return out;
}

export interface TokenSpan {
  /** UTF-16 offsets into the original text, end exclusive. */
  start: number;
  end: number;
  /** True when the token holds only part of a character's bytes. */
  partial: boolean;
  bytes: number[];
}

/**
 * Locates each byte-level token in `text`. Returns null when the tokens do not
 * spell the text byte for byte (normalizers, added special tokens), in which
 * case callers fall back to approximate offsets.
 */
export function byteLevelSpans(text: string, tokenStrings: string[]): TokenSpan[] | null {
  const textBytes = new TextEncoder().encode(text);
  // For every byte offset, the UTF-16 index of the character it belongs to,
  // and whether it starts that character.
  const charOfByte = new Int32Array(textBytes.length + 1);
  const isCharStart = new Uint8Array(textBytes.length + 1);
  let b = 0;
  for (let i = 0; i < text.length; ) {
    const cp = text.codePointAt(i)!;
    const units = cp > 0xffff ? 2 : 1;
    const len = cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
    for (let k = 0; k < len; k++) charOfByte[b + k] = i;
    isCharStart[b] = 1;
    b += len;
    i += units;
  }
  charOfByte[textBytes.length] = text.length;
  isCharStart[textBytes.length] = 1;

  const spans: TokenSpan[] = [];
  let cursor = 0;
  for (const token of tokenStrings) {
    const bytes = tokenStringToBytes(token);
    if (!bytes || bytes.length === 0) return null;
    const startByte = cursor;
    const endByte = cursor + bytes.length;
    if (endByte > textBytes.length) return null;
    for (let k = 0; k < bytes.length; k++) if (textBytes[startByte + k] !== bytes[k]) return null;
    const start = charOfByte[startByte]!;
    let end: number;
    if (isCharStart[endByte]) end = charOfByte[endByte]!;
    else {
      // Ends inside a character: extend to the end of that character.
      const cpStart = charOfByte[endByte - 1]!;
      end = cpStart + (text.codePointAt(cpStart)! > 0xffff ? 2 : 1);
    }
    spans.push({ start, end, partial: !isCharStart[startByte] || !isCharStart[endByte], bytes });
    cursor = endByte;
  }
  return cursor === textBytes.length ? spans : null;
}

/** "F0 9F 90" style label for partial tokens. */
export function bytesLabel(bytes: number[]): string {
  return bytes.map((x) => x.toString(16).toUpperCase().padStart(2, "0")).join(" ");
}
