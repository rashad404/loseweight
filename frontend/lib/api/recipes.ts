import { API_URL } from './base.ts';

/**
 * Record that someone accepted a proposed dish composition.
 *
 * Deliberately fire-and-forget. A confirmation is a signal for later review,
 * not something the page depends on, and it must never block or fail the
 * routine the user is in the middle of correcting.
 *
 * Acceptance is counted, never promoted: agreement with a default is not
 * evidence that the default is right, so only a named reviewer can make a
 * composition authoritative for everyone.
 */
export async function confirmRecipe(id: number): Promise<void> {
  try {
    await fetch(`${API_URL}/recipes/${id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: '{}',
    });
  } catch {
    // Nothing to recover: the figure the user sees is unchanged either way.
  }
}
