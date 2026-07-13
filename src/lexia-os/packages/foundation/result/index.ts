import { Result } from '../contracts/index.js';

export const success = <T, E = Error>(value: T): Result<T, E> => ({
  ok: true,
  value
});

export const failure = <T, E = Error>(error: E): Result<T, E> => ({
  ok: false,
  error
});
