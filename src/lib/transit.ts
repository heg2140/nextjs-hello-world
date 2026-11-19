// The AI writes transit directions as one free-text sentence or two, e.g.
// "Take the 1 train from 116 St to 14 St, then walk west 10 minutes. This is
// an AI estimate, double check before heading out." This splits that into
// timeline steps and pulls the disclaimer out as a separate note.

const STEP_VERBS = "walk|take|transfer|switch|ride|get off|exit|board|catch|hop on|continue|head";

export type TransitStepKind = "walk" | "subway" | "bus" | "ferry" | "transfer" | "arrive" | "other";

export type TransitStep = { kind: TransitStepKind; text: string };

const NOTE_PATTERN = /\b(estimate|double[- ]check|verify|confirm|may vary|subject to change)\b/i;

function kindOf(text: string): TransitStepKind {
  const t = text.toLowerCase();
  // The leading verb wins: "Walk to the ferry terminal" is a walk.
  if (/^(walk|head (north|south|east|west|up|down))\b/.test(t)) return "walk";
  if (/^(transfer|switch)\b/.test(t)) return "transfer";
  if (/\bferry\b/.test(t)) return "ferry";
  if (/\bbus\b|\b(m|bx|b|q|s)\d{1,3}\b|\bsbs\b/.test(t)) return "bus";
  if (/\btransfer\b|\bswitch\b|\bchange to\b/.test(t)) return "transfer";
  if (/\btrain\b|\bsubway\b|\bline\b|\bpath\b|\blirr\b|\bmetro-north\b|\bexpress\b|\blocal\b/.test(t)) return "subway";
  // "Take the 1 to 96 St", "ride the A/C uptown": a bare subway line name.
  if (/\b(take|ride|catch|board|hop on) the [1-7a-z](\/[1-7a-z])*\b(?![a-z])/.test(t)) return "subway";
  if (/\bwalk\b|\bwalking\b|\bhead (north|south|east|west)\b|\bblocks?\b|\bon foot\b/.test(t)) return "walk";
  if (/\barrive\b|\byou'?ll (reach|see|find)\b|\bentrance\b|\bdestination\b/.test(t)) return "arrive";
  return "other";
}

function clean(part: string) {
  return part
    .trim()
    .replace(/^(and|then|and then|from there|next|finally|after that)[,\s]+/i, "")
    .replace(/^[,;:\-–—\s]+|[,;:\s]+$/g, "")
    .replace(/\.$/, "")
    .trim();
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Older suggestions sometimes offer a second route ("Alternatively, take the
// M4 bus..."). Only the first route is shown.
const ALTERNATIVE_PATTERN =
  /^(alternatively|alternative(ly)?( route)?:|another (option|route|way)|or,? you (can|could)|you (can|could) also|if you prefer|or take|or ride|or walk|or catch|option 2|\(or\b)/i;

export function withoutAlternatives(directions: string) {
  const text = (directions ?? "").replace(/\s+/g, " ").trim();
  return text
    // Parenthetical alternatives: "...to 14 St (or the 2/3 to 14 St)".
    .replace(/\s*\((?:or|alternatively)\b[^)]*\)/gi, "")
    // Clause-level alternatives: "...to 14 St, or take the bus to ...".
    .replace(/[,;]\s*(?:or\s+(?:take|ride|catch|walk|hop on)|alternatively)\b[^.;]*(?=[.;]|$)/gi, "")
    .split(/(?<=[.!?])\s+(?=[A-Z(])/)
    .filter((sentence) => !ALTERNATIVE_PATTERN.test(sentence.trim()))
    .join(" ")
    .trim();
}

// The AI often puts the route and the disclaimer in one sentence:
// "AI estimate (double check): Take the 1 train..., then walk..." or
// "Take the 1 to 66 St and walk east; this is an AI estimate, so double check."
// Pull out only the disclaimer pieces so the route isn't thrown away with them.
function splitDisclaimer(sentence: string): { route: string; notes: string[] } {
  // A plain label like "Estimated route:" or "Directions:" isn't a step.
  let text = sentence.trim().replace(/^(?:estimated |suggested |transit )?(?:route|directions)\s*:\s*/i, "");
  if (!NOTE_PATTERN.test(text)) return { route: text, notes: [] };

  const notes: string[] = [];
  // Parentheticals: "(AI estimate - please double check)".
  text = text.replace(/\s*\(([^)]*)\)/g, (match, inner: string) => {
    if (NOTE_PATTERN.test(inner)) {
      notes.push(inner.trim());
      return "";
    }
    return match;
  });
  // A leading label: "AI estimate:", "Estimated route (double check):".
  text = text.replace(/^([^:]{0,60}):\s*/, (match, label: string) => {
    if (NOTE_PATTERN.test(label)) notes.push(label.trim());
    if (NOTE_PATTERN.test(label) || /\b(estimated|route|directions)\b/i.test(label)) return "";
    return match;
  });

  const routeClauses: string[] = [];
  for (const clause of text.split(/\s*;\s*|\s+[–—-]\s+|,\s*(?=(?:this|which|but|note|please)\b)/i)) {
    const trimmed = clause.trim();
    if (!trimmed) continue;
    if (NOTE_PATTERN.test(trimmed)) notes.push(trimmed);
    else routeClauses.push(trimmed);
  }
  return { route: routeClauses.join(", "), notes };
}

export function parseTransit(directions: string): { steps: TransitStep[]; note: string | null } {
  const text = withoutAlternatives(directions);
  if (!text) return { steps: [], note: null };

  // Sentences first, so the disclaimer can be separated out. Don't split on
  // the period in abbreviations like "St." or "Ave.".
  const sentences = text
    .split(/(?<!\b(?:St|Ave|Blvd|Pl|Rd|Dr|Sq|Pkwy|Hwy|approx|min|mins|Mt|Ft|Jr))[.!?]\s+(?=[A-Z(])/)
    // "...at Whitehall St. Ride the ferry": an abbreviation can still end a
    // sentence when the next word starts a new step.
    .flatMap((s) => s.split(new RegExp(`\\.\\s+(?=(?:${STEP_VERBS})\\b)`, "i")))
    .map((s) => s.trim())
    .filter(Boolean);

  const noteParts: string[] = [];
  const routeParts: string[] = [];
  for (const sentence of sentences) {
    const { route, notes } = splitDisclaimer(sentence);
    noteParts.push(...notes);
    if (route) routeParts.push(route);
  }

  const steps = routeParts
    .flatMap((sentence) =>
      sentence.split(
        new RegExp(`\\s*(?:;|→|->|,?\\s+then\\s+|,?\\s+and then\\s+|(?:,|\\s+and)\\s+(?=(?:${STEP_VERBS})\\b))`, "i")
      )
    )
    .map(clean)
    .filter((part) => part.length > 2)
    // "From 116 St, take the 1..." -> keep the starting point with its step.
    .reduce<string[]>((parts, part) => {
      const previous = parts[parts.length - 1];
      if (previous && /^from\b/i.test(previous) && !new RegExp(`\\b(?:${STEP_VERBS})\\b`, "i").test(previous)) {
        parts[parts.length - 1] = `${part.charAt(0).toUpperCase()}${part.slice(1)} ${previous.charAt(0).toLowerCase()}${previous.slice(1)}`;
      } else {
        parts.push(part);
      }
      return parts;
    }, [])
    .map((part) => ({ kind: kindOf(part), text: capitalize(part) }));

  const note = noteParts
    .map((n) => capitalize(n.replace(/^note:\s*/i, "").replace(/\.$/, "").trim()))
    .filter(Boolean)
    .join(". ");

  return { steps, note: note ? `${note}.` : null };
}

export const STEP_ICONS: Record<TransitStepKind, string> = {
  walk: "🚶",
  subway: "🚇",
  bus: "🚌",
  ferry: "⛴️",
  transfer: "🔄",
  arrive: "📍",
  other: "➡️",
};
