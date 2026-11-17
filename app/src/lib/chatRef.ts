/**
 * The WhatsApp chat an enquiry answers (17-Nov-2026). Sales sends this page from WhatsApp Chats in the ERP ("Send
 * enquiry form"); the link carries ?chat=<code>, a code the ERP signed (App\Support\Wa\EnquiryChatLink). The form
 * sends it back as `chat_ref`, so the enquiry lands in the Enquiry Inbox tied to that conversation instead of
 * being retyped from a text block.
 *
 * Kept for the browser session so a reload or a detour through the catalogue does not lose it. The code names no
 * person; a malformed value is never stored, and the ERP ignores a code it did not sign.
 */

const KEY = 'ask_chat_ref';
const PATTERN = /^\d{1,12}-\d{1,12}-[a-f0-9]{16}$/;

/** Read ?chat= of the current URL (remembering it), else the code remembered earlier this session. */
export function captureChatRef(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  const fresh = (new URLSearchParams(window.location.search).get('chat') ?? '').trim();
  if (PATTERN.test(fresh)) {
    try {
      sessionStorage.setItem(KEY, fresh);
    } catch {
      /* private mode / storage blocked — the code still travels with this page view */
    }
    return fresh;
  }

  try {
    const stored = sessionStorage.getItem(KEY) ?? '';
    return PATTERN.test(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
}
