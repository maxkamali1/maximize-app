import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { createContact, createClientGoal, logLeadEvent } from "@/lib/data/repo";
import type { GoalType } from "@/lib/data/types";
import { CHAT_SYSTEM_PROMPT } from "@/lib/chat/prompt";
import { alertChatOutage } from "@/lib/chat/alert";

// The website assistant. Runs through Vercel AI Gateway, which authenticates
// automatically on Vercel deployments (OIDC) — no API key to manage. Set
// AI_GATEWAY_API_KEY only if you ever run this outside Vercel.
// Default is covered by Vercel's free monthly AI Gateway credit. Override with
// the CHAT_MODEL env var in Vercel to switch models without a code change.
const MODEL = process.env.CHAT_MODEL || "openai/gpt-4.1-mini";

const MAX_MESSAGES = 30;
const MAX_CHARS = 1500;

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(MAX_CHARS),
      })
    )
    .min(1)
    .max(MAX_MESSAGES),
  leadSaved: z.boolean().optional(),
});

// Light abuse guard: a public chat endpoint costs money per message. This is
// per server instance (not global), which is enough to stop casual spam.
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 12;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json(
      { reply: "You're sending messages a little fast — give it a moment and try again." },
      { status: 429 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const { messages, leadSaved: alreadySaved } = parsed.data;

  let leadSaved = Boolean(alreadySaved);

  const saveLead = tool({
    description:
      "Save the visitor as a lead for Max once you have their name, at least one way to reach them (phone or email), and their consent to be contacted. Call this only once per conversation.",
    inputSchema: z.object({
      name: z.string().min(1).describe("Visitor's full name"),
      email: z.string().optional().describe("Email address, if given"),
      phone: z.string().optional().describe("Phone number, if given"),
      preferredContactMethod: z.enum(["email", "phone", "text"]).optional(),
      goal: z
        .enum(["buying", "selling", "homeowner", "investing", "exploring"])
        .describe("What the visitor is trying to do"),
      area: z.string().optional().describe("Neighbourhood/city they're interested in or selling in"),
      timeline: z.string().optional().describe("When they want to move/buy/sell"),
      budget: z.string().optional().describe("Budget or expected price range, in their words"),
      financingStatus: z.string().optional().describe("Mortgage pre-approval status, for buyers"),
      propertyAddress: z.string().optional().describe("Address of the home they want to sell or have evaluated, if given"),
      wantsHomeEvaluation: z
        .boolean()
        .optional()
        .describe("True if they asked for Max's free home evaluation"),
      summary: z.string().describe("2–3 sentence summary of the conversation for Max"),
    }),
    execute: async (lead) => {
      if (leadSaved) return { ok: true, note: "Already saved earlier in this conversation." };
      if (!lead.email && !lead.phone) {
        return { ok: false, note: "Need a phone number or email before saving." };
      }
      const contact = await createContact({
        name: lead.name.trim(),
        email: (lead.email ?? "").trim(),
        phone: (lead.phone ?? "").trim(),
        source: "website_chatbot",
        preferredContactMethod: lead.preferredContactMethod ?? (lead.phone ? "phone" : "email"),
        consentMarketing: false,
      });
      await createClientGoal({
        contactId: contact.id,
        goalType: lead.goal as GoalType,
        context: {
          preferredArea: lead.area,
          timeline: lead.timeline,
          budget: lead.budget,
          financingStatus: lead.financingStatus,
          address: lead.propertyAddress,
        },
      });
      // Logging the event is what triggers the email to Max (see lib/email.ts).
      await logLeadEvent({
        contactId: contact.id,
        eventType: lead.wantsHomeEvaluation ? "requested_valuation" : "chatbot_lead",
        eventMeta: {
          summary: lead.summary,
          homeEvaluation: lead.wantsHomeEvaluation ? "Yes — requested a free home evaluation" : undefined,
        },
      });
      leadSaved = true;
      return { ok: true };
    },
  });

  try {
    const result = await generateText({
      model: MODEL,
      system: CHAT_SYSTEM_PROMPT,
      messages,
      tools: { saveLead },
      activeTools: alreadySaved ? [] : ["saveLead"],
      stopWhen: stepCountIs(3),
      maxOutputTokens: 500,
    });

    const reply =
      result.text.trim() ||
      (leadSaved
        ? "Thanks — I've passed your details to Max and he'll be in touch shortly."
        : "Sorry, could you say that another way?");

    return Response.json({ reply, leadSaved });
  } catch (err) {
    console.error("chat route failed:", err);
    // Awaited so the email isn't cut off when the serverless function freezes.
    await alertChatOutage(err);
    return Response.json(
      {
        reply:
          "Sorry, I'm having trouble right now. You can reach Max directly at 416-723-0353.",
        leadSaved,
      },
      { status: 500 }
    );
  }
}
