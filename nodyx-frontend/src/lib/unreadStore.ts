import { writable } from 'svelte/store';

/** Nombre de messages non lus par channel ID */
export const unreadCountsStore = writable<Record<string, number>>({});

/** Channel ID qui vient de recevoir un message (flash temporaire, ~650ms) */
export const flashChannelIdStore = writable<string | null>(null);
