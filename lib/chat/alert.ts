import { writeStore } from "@/lib/data/store";
import { notifyMaxOfChatOutage } from "@/lib/email";

const THROTTLE_MS = 6 * 60 * 60 * 1000; // at most one alert every 6 hours

// Emails Max when the chat assistant fails. The "last sent" time is claimed
// in the shared database first, so even if several visitors hit the error at
// once (on different servers), only one email goes out per 6 hours.
// Never throws — an alert problem must not affect the visitor's reply.
export async function alertChatOutage(err: unknown): Promise<void> {
  try {
    const reason = (err instanceof Error ? err.message : String(err)).slice(0, 500);
    const now = Date.now();
    let claimed = false;
    let previous: string | undefined;
    await writeStore((store) => {
      const last = store.chatAlertLastSentAt ? Date.parse(store.chatAlertLastSentAt) : 0;
      if (now - last >= THROTTLE_MS) {
        previous = store.chatAlertLastSentAt;
        store.chatAlertLastSentAt = new Date(now).toISOString();
        claimed = true;
      }
    });
    if (!claimed) return;
    const sent = await notifyMaxOfChatOutage(reason);
    if (!sent) {
      // Release the claim so the next failure can try again.
      await writeStore((store) => {
        store.chatAlertLastSentAt = previous;
      });
    }
  } catch (alertErr) {
    console.error("alertChatOutage failed:", alertErr);
  }
}
