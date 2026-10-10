import { VALIDATED_SIGNS, type ValidatedSign } from './types';

export const SIGN_NOTICE =
  'Limited experimental SASL vocabulary only: HELLO, YES, NO, THANK YOU, PLEASE, HELP, NAME, REPEAT, SLOW. Unity does not invent detections. You confirm every sign before it is sent.';

export function isValidatedSign(value: string): value is ValidatedSign {
  return (VALIDATED_SIGNS as readonly string[]).includes(value);
}

export async function describeImageFallback() {
  return 'Add a description so people who cannot see the image know what it contains.';
}
