/**
 * Ember & Scale — Dragon Sanctuary dataset + tool layer.
 *
 * This is the single source of truth for the demo's "data- and functionality-set".
 * Tool SPECS (name/description/schema) are shipped to the browser so the OpenUI
 * island can bake them into the LLM system prompt. Tool HANDLERS run here on the
 * server and are what the OpenUI runtime calls (via /api/tools/:name) when the
 * generated UI executes a Query() or Mutation().
 */

export interface ToolSpec {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

export interface Dragon {
  id: string;
  name: string;
  nickname: string;
  element: 'Fire' | 'Ice' | 'Storm' | 'Earth' | 'Shadow';
  ageYears: number;
  wingspanM: number;
  /** 0-100. Raw destructive power. */
  firePower: number;
  /** 0-100. Puzzle-solving, trick-learning, riddle-speaking smarts. */
  intelligenceScore: number;
  /** Top cruising speed in km/h. */
  flightSpeedKph: number;
  /** Roar volume in decibels — for reference, a rock concert is ~110dB. */
  roarDecibels: number;
  /** 0-100. How much visitors want to hug it (survival not guaranteed). */
  cuddlinessScore: number;
  /** Number of distinct items in its hoard (not the same as gold value — a hoard can be huge and worthless, or small and priceless). */
  treasureHoardCount: number;
  /** hoard value in gold coins */
  hoardValue: number;
  dietType: 'Carnivore' | 'Herbivore' | 'Omnivore' | 'Treasure-eater';
  temperament: 'Cuddly' | 'Grumpy' | 'Mischievous' | 'Regal' | 'Chaotic';
  status: 'Available' | 'Sponsored' | 'Rewilding';
  rescuedSeason: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  /** Years living at Ember & Scale specifically (always <= ageYears). */
  yearsAtSanctuary: number;
  /** Number of people currently chipping in — sponsorship isn't exclusive; dragons can (and do) have many sponsors at once, like a real adopt-an-animal program. */
  sponsorCount: number;
  /** Suggested monthly contribution per sponsor, in gold. */
  monthlySponsorshipGold: number;
  emoji: string;
  funFact: string;
}

// ── The roster ───────────────────────────────────────────────────────────────
// Mutable so sponsor_dragon/update_dragon can actually change state during a demo.
const dragons: Dragon[] = [
  { id: 'd01', name: 'Cinderbelle', nickname: 'The Marshmallow Queen', element: 'Fire', ageYears: 42, wingspanM: 9.1, firePower: 88, intelligenceScore: 88, flightSpeedKph: 95, roarDecibels: 140, cuddlinessScore: 55, treasureHoardCount: 340, hoardValue: 128000, dietType: 'Treasure-eater', temperament: 'Regal', status: 'Available', rescuedSeason: 'Summer', yearsAtSanctuary: 12, sponsorCount: 23, monthlySponsorshipGold: 65, emoji: '🐉', funFact: 'Toasts marshmallows for visitors on request.' },
  { id: 'd02', name: 'Pyrrha', nickname: 'Newsletter Nemesis', element: 'Fire', ageYears: 17, wingspanM: 5.4, firePower: 74, intelligenceScore: 52, flightSpeedKph: 165, roarDecibels: 132, cuddlinessScore: 30, treasureHoardCount: 90, hoardValue: 44000, dietType: 'Carnivore', temperament: 'Chaotic', status: 'Available', rescuedSeason: 'Spring', yearsAtSanctuary: 4, sponsorCount: 9, monthlySponsorshipGold: 35, emoji: '🔥', funFact: 'Once set a rival sanctuary\'s newsletter on fire. Twice.' },
  { id: 'd03', name: 'Emberwyn', nickname: 'Monday Hater', element: 'Fire', ageYears: 63, wingspanM: 11.2, firePower: 95, intelligenceScore: 74, flightSpeedKph: 40, roarDecibels: 158, cuddlinessScore: 20, treasureHoardCount: 510, hoardValue: 210000, dietType: 'Treasure-eater', temperament: 'Grumpy', status: 'Sponsored', rescuedSeason: 'Winter', yearsAtSanctuary: 25, sponsorCount: 31, monthlySponsorshipGold: 80, emoji: '🌋', funFact: 'Refuses to fly on Mondays.' },
  { id: 'd04', name: 'Frostfang', nickname: 'The Purrfrost', element: 'Ice', ageYears: 28, wingspanM: 7.8, firePower: 22, intelligenceScore: 61, flightSpeedKph: 110, roarDecibels: 95, cuddlinessScore: 92, treasureHoardCount: 210, hoardValue: 96000, dietType: 'Omnivore', temperament: 'Cuddly', status: 'Available', rescuedSeason: 'Winter', yearsAtSanctuary: 15, sponsorCount: 27, monthlySponsorshipGold: 55, emoji: '❄️', funFact: 'Purrs. Loudly. It is unsettling.' },
  { id: 'd05', name: 'Glacia', nickname: 'Frost Duchess', element: 'Ice', ageYears: 51, wingspanM: 8.9, firePower: 15, intelligenceScore: 85, flightSpeedKph: 70, roarDecibels: 110, cuddlinessScore: 58, treasureHoardCount: 380, hoardValue: 154000, dietType: 'Herbivore', temperament: 'Regal', status: 'Available', rescuedSeason: 'Autumn', yearsAtSanctuary: 20, sponsorCount: 19, monthlySponsorshipGold: 70, emoji: '🧊', funFact: 'Sneezes hailstones.' },
  { id: 'd06', name: 'Zephyra', nickname: 'Umbrella Bandit', element: 'Storm', ageYears: 34, wingspanM: 10.5, firePower: 61, intelligenceScore: 79, flightSpeedKph: 185, roarDecibels: 118, cuddlinessScore: 48, treasureHoardCount: 150, hoardValue: 72000, dietType: 'Omnivore', temperament: 'Mischievous', status: 'Available', rescuedSeason: 'Spring', yearsAtSanctuary: 8, sponsorCount: 14, monthlySponsorshipGold: 40, emoji: '⚡', funFact: 'Steals umbrellas. Returns them soggy.' },
  { id: 'd07', name: 'Tempest', nickname: 'Lightning Scribe', element: 'Storm', ageYears: 46, wingspanM: 12.4, firePower: 69, intelligenceScore: 66, flightSpeedKph: 210, roarDecibels: 152, cuddlinessScore: 33, treasureHoardCount: 260, hoardValue: 118000, dietType: 'Carnivore', temperament: 'Chaotic', status: 'Rewilding', rescuedSeason: 'Summer', yearsAtSanctuary: 18, sponsorCount: 22, monthlySponsorshipGold: 60, emoji: '🌩️', funFact: 'Can spell its own name in lightning.' },
  { id: 'd08', name: 'Boulderjaw', nickname: 'Old Rockpile', element: 'Earth', ageYears: 88, wingspanM: 6.2, firePower: 40, intelligenceScore: 81, flightSpeedKph: 25, roarDecibels: 165, cuddlinessScore: 12, treasureHoardCount: 850, hoardValue: 320000, dietType: 'Herbivore', temperament: 'Grumpy', status: 'Sponsored', rescuedSeason: 'Autumn', yearsAtSanctuary: 40, sponsorCount: 17, monthlySponsorshipGold: 90, emoji: '🪨', funFact: 'Hoard is 90% interesting rocks.' },
  { id: 'd09', name: 'Mossheart', nickname: 'Garden Buddy', element: 'Earth', ageYears: 23, wingspanM: 5.9, firePower: 33, intelligenceScore: 58, flightSpeedKph: 55, roarDecibels: 78, cuddlinessScore: 95, treasureHoardCount: 60, hoardValue: 51000, dietType: 'Herbivore', temperament: 'Cuddly', status: 'Available', rescuedSeason: 'Spring', yearsAtSanctuary: 10, sponsorCount: 33, monthlySponsorshipGold: 25, emoji: '🌿', funFact: 'Grows a small garden on its back.' },
  { id: 'd10', name: 'Nyx', nickname: 'The Smudge', element: 'Shadow', ageYears: 71, wingspanM: 9.7, firePower: 58, intelligenceScore: 91, flightSpeedKph: 130, roarDecibels: 88, cuddlinessScore: 24, treasureHoardCount: 420, hoardValue: 188000, dietType: 'Treasure-eater', temperament: 'Regal', status: 'Available', rescuedSeason: 'Winter', yearsAtSanctuary: 35, sponsorCount: 12, monthlySponsorshipGold: 75, emoji: '🌑', funFact: 'Only appears in photos as a smudge.' },
  { id: 'd11', name: 'Umbra', nickname: 'Riddlewing', element: 'Shadow', ageYears: 39, wingspanM: 8.1, firePower: 52, intelligenceScore: 87, flightSpeedKph: 175, roarDecibels: 100, cuddlinessScore: 45, treasureHoardCount: 190, hoardValue: 99000, dietType: 'Omnivore', temperament: 'Mischievous', status: 'Available', rescuedSeason: 'Autumn', yearsAtSanctuary: 9, sponsorCount: 16, monthlySponsorshipGold: 45, emoji: '🦇', funFact: 'Communicates exclusively in ominous riddles.' },
  { id: 'd12', name: 'Scorchling', nickname: "Lil' Scorch", element: 'Fire', ageYears: 4, wingspanM: 2.1, firePower: 47, intelligenceScore: 38, flightSpeedKph: 140, roarDecibels: 105, cuddlinessScore: 68, treasureHoardCount: 15, hoardValue: 8000, dietType: 'Carnivore', temperament: 'Chaotic', status: 'Available', rescuedSeason: 'Summer', yearsAtSanctuary: 1, sponsorCount: 41, monthlySponsorshipGold: 15, emoji: '🐲', funFact: 'Still learning. Please label your snacks.' },
  { id: 'd13', name: 'Aurora', nickname: 'Aurora Borealis', element: 'Ice', ageYears: 60, wingspanM: 10.1, firePower: 19, intelligenceScore: 93, flightSpeedKph: 90, roarDecibels: 120, cuddlinessScore: 80, treasureHoardCount: 460, hoardValue: 176000, dietType: 'Treasure-eater', temperament: 'Regal', status: 'Sponsored', rescuedSeason: 'Winter', yearsAtSanctuary: 22, sponsorCount: 8, monthlySponsorshipGold: 85, emoji: '🌌', funFact: 'Wings shimmer like the northern lights.' },
  { id: 'd14', name: 'Gustwing', nickname: 'Upside-Down Gus', element: 'Storm', ageYears: 12, wingspanM: 6.7, firePower: 55, intelligenceScore: 55, flightSpeedKph: 195, roarDecibels: 92, cuddlinessScore: 88, treasureHoardCount: 45, hoardValue: 29000, dietType: 'Omnivore', temperament: 'Mischievous', status: 'Available', rescuedSeason: 'Spring', yearsAtSanctuary: 3, sponsorCount: 29, monthlySponsorshipGold: 20, emoji: '🪁', funFact: 'Naps upside down in thermals.' },
];

const SEASON_ORDER = ['Spring', 'Summer', 'Autumn', 'Winter'] as const;

const DRAGON_ROW_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    nickname: { type: 'string' },
    element: { type: 'string' },
    ageYears: { type: 'number' },
    wingspanM: { type: 'number' },
    firePower: { type: 'number' },
    intelligenceScore: { type: 'number' },
    flightSpeedKph: { type: 'number' },
    roarDecibels: { type: 'number' },
    cuddlinessScore: { type: 'number' },
    treasureHoardCount: { type: 'number' },
    hoardValue: { type: 'number' },
    dietType: { type: 'string' },
    temperament: { type: 'string' },
    status: { type: 'string' },
    rescuedSeason: { type: 'string' },
    yearsAtSanctuary: { type: 'number' },
    sponsorCount: { type: 'number' },
    monthlySponsorshipGold: { type: 'number' },
    emoji: { type: 'string' },
    funFact: { type: 'string' },
  },
} as const;

// ── Tool specifications (shipped to the browser for prompt generation) ─────────
export const toolSpecs: ToolSpec[] = [
  {
    name: 'list_dragons',
    description:
      'List dragons in the sanctuary, optionally filtered by element and/or adoption status. Returns one row per dragon with the FULL profile — physical stats (age, wingspan, firePower, flightSpeedKph, roarDecibels), personality stats (intelligenceScore, cuddlinessScore, temperament), hoard info (hoardValue gold, treasureHoardCount items, dietType), and sponsorship info (sponsorCount, monthlySponsorshipGold). With ~10 independent numeric stats per dragon, this is the right source for scatter/correlation charts (e.g. intelligenceScore vs flightSpeedKph, cuddlinessScore vs firePower) as well as lists and tables — pluck two numeric fields from the rows for X/Y, or a third for bubble size. IMPORTANT for ScatterChart: ScatterSeries only has ONE label (its name), shown on hover — there is no separate per-point label. So to identify WHICH dragon a point is, build one ScatterSeries per dragon named after it (e.g. `@Each(dragons.rows, "d", ScatterSeries(d.name, [Point(d.intelligenceScore, d.firePower)]))`) rather than grouping several dragons into one series — grouping (e.g. by element) hides individual dragon identity on hover.',
    inputSchema: {
      type: 'object',
      properties: {
        element: { type: 'string', enum: ['Fire', 'Ice', 'Storm', 'Earth', 'Shadow'], description: 'Filter by elemental type' },
        status: { type: 'string', enum: ['Available', 'Sponsored', 'Rewilding'], description: 'Filter by adoption status' },
      },
    },
    outputSchema: {
      type: 'object',
      properties: { rows: { type: 'array', items: DRAGON_ROW_SCHEMA } },
    },
  },
  {
    name: 'sanctuary_stats',
    description:
      'Headline KPIs for the whole sanctuary: total dragons, how many are available/sponsored/rewilding, average fire power, total hoard value (gold), dragons rescued this season, and community sponsorship totals (active sponsors across all dragons, and the resulting total monthly gold raised).',
    inputSchema: { type: 'object', properties: {} },
    outputSchema: {
      type: 'object',
      properties: {
        totalDragons: { type: 'number' },
        available: { type: 'number' },
        sponsored: { type: 'number' },
        rewilding: { type: 'number' },
        avgFirePower: { type: 'number' },
        totalHoard: { type: 'number' },
        rescuedThisSeason: { type: 'number' },
        season: { type: 'string' },
        totalActiveSponsors: { type: 'number' },
        totalMonthlySponsorshipGold: { type: 'number' },
      },
    },
  },
  {
    name: 'element_breakdown',
    description:
      'Aggregate stats grouped by elemental type. One row per element with the dragon count, combined hoard value, average fire power, and average intelligence/cuddliness. Great for pie/bar charts.',
    inputSchema: { type: 'object', properties: {} },
    outputSchema: {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              count: { type: 'number' },
              totalHoard: { type: 'number' },
              avgFirePower: { type: 'number' },
              avgIntelligence: { type: 'number' },
              avgCuddliness: { type: 'number' },
            },
          },
        },
      },
    },
  },
  {
    name: 'rescues_by_season',
    description:
      'Time-series of rescue activity across the four seasons (Spring→Winter). One row per season with dragons rescued and how many of those are now sponsored. Great for line/area charts.',
    inputSchema: { type: 'object', properties: {} },
    outputSchema: {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              season: { type: 'string' },
              rescued: { type: 'number' },
              sponsored: { type: 'number' },
            },
          },
        },
      },
    },
  },
  {
    name: 'top_dragons',
    description:
      'Return the top N dragons ranked by a numeric metric. Defaults to firePower, limit 5. Metrics: firePower, hoardValue, wingspanM, intelligenceScore, flightSpeedKph, roarDecibels, cuddlinessScore, treasureHoardCount, sponsorCount, monthlySponsorshipGold — e.g. sponsorCount for "most-loved dragons", roarDecibels for "loudest".',
    inputSchema: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          enum: [
            'firePower',
            'hoardValue',
            'wingspanM',
            'intelligenceScore',
            'flightSpeedKph',
            'roarDecibels',
            'cuddlinessScore',
            'treasureHoardCount',
            'sponsorCount',
            'monthlySponsorshipGold',
          ],
          description: 'Metric to rank by',
        },
        limit: { type: 'number', description: 'How many dragons to return (default 5)' },
      },
    },
    outputSchema: {
      type: 'object',
      properties: { rows: { type: 'array', items: DRAGON_ROW_SCHEMA } },
    },
  },
  {
    name: 'sponsor_dragon',
    description:
      'Sponsor a dragon by id — like a real adopt-an-animal program, sponsorship is NOT exclusive: any number of people can sponsor the same dragon at once, each chipping in that dragon\'s monthlySponsorshipGold. Calling this adds ONE more sponsor and returns the dragon\'s new sponsorCount plus a thank-you message. Only dragons with status "Rewilding" (being released back to the wild) can\'t be sponsored. This is a write action — trigger it from a Button, not on load.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'The dragon id, e.g. "d01"' } },
      required: ['id'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        id: { type: 'string' },
        name: { type: 'string' },
        status: { type: 'string' },
        sponsorCount: { type: 'number' },
        monthlySponsorshipGold: { type: 'number' },
        message: { type: 'string' },
      },
    },
  },
  {
    name: 'update_dragon',
    description:
      'Edit an existing dragon\'s profile: rename it, change nickname/temperament/status/dietType, or rewrite its fun fact. Pass only the fields being changed. This is a write action — trigger it from a Form/Button, not on load.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The dragon id, e.g. "d01"' },
        name: { type: 'string', description: 'New name' },
        nickname: { type: 'string', description: 'New nickname' },
        temperament: {
          type: 'string',
          enum: ['Cuddly', 'Grumpy', 'Mischievous', 'Regal', 'Chaotic'],
          description: 'New temperament',
        },
        status: {
          type: 'string',
          enum: ['Available', 'Sponsored', 'Rewilding'],
          description: 'New adoption status',
        },
        dietType: {
          type: 'string',
          enum: ['Carnivore', 'Herbivore', 'Omnivore', 'Treasure-eater'],
          description: 'New diet type',
        },
        funFact: { type: 'string', description: 'New fun fact' },
      },
      required: ['id'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        id: { type: 'string' },
        name: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
];

// ── Tool handlers ─────────────────────────────────────────────────────────────
type Args = Record<string, unknown>;
type Handler = (args: Args) => unknown;

const round = (n: number, d = 0) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

function currentSeason(): Dragon['rescuedSeason'] {
  const m = new Date().getMonth(); // 0-11
  if (m <= 1 || m === 11) return 'Winter';
  if (m <= 4) return 'Spring';
  if (m <= 7) return 'Summer';
  return 'Autumn';
}

export const handlers: Record<string, Handler> = {
  list_dragons: (args) => {
    const element = typeof args.element === 'string' ? args.element : undefined;
    const status = typeof args.status === 'string' ? args.status : undefined;
    const rows = dragons.filter(
      (d) => (!element || d.element === element) && (!status || d.status === status),
    );
    return { rows };
  },

  sanctuary_stats: () => {
    const season = currentSeason();
    return {
      totalDragons: dragons.length,
      available: dragons.filter((d) => d.status === 'Available').length,
      sponsored: dragons.filter((d) => d.status === 'Sponsored').length,
      rewilding: dragons.filter((d) => d.status === 'Rewilding').length,
      avgFirePower: round(dragons.reduce((s, d) => s + d.firePower, 0) / dragons.length),
      totalHoard: dragons.reduce((s, d) => s + d.hoardValue, 0),
      rescuedThisSeason: dragons.filter((d) => d.rescuedSeason === season).length,
      season,
      totalActiveSponsors: dragons.reduce((s, d) => s + d.sponsorCount, 0),
      totalMonthlySponsorshipGold: dragons.reduce((s, d) => s + d.sponsorCount * d.monthlySponsorshipGold, 0),
    };
  },

  element_breakdown: () => {
    const byEl = new Map<string, Dragon[]>();
    for (const d of dragons) {
      const arr = byEl.get(d.element) ?? [];
      arr.push(d);
      byEl.set(d.element, arr);
    }
    const rows = [...byEl.entries()].map(([element, ds]) => ({
      element,
      count: ds.length,
      totalHoard: ds.reduce((s, d) => s + d.hoardValue, 0),
      avgFirePower: round(ds.reduce((s, d) => s + d.firePower, 0) / ds.length),
      avgIntelligence: round(ds.reduce((s, d) => s + d.intelligenceScore, 0) / ds.length),
      avgCuddliness: round(ds.reduce((s, d) => s + d.cuddlinessScore, 0) / ds.length),
    }));
    rows.sort((a, b) => b.count - a.count);
    return { rows };
  },

  rescues_by_season: () => {
    const rows = SEASON_ORDER.map((season) => {
      const ds = dragons.filter((d) => d.rescuedSeason === season);
      return {
        season,
        rescued: ds.length,
        sponsored: ds.filter((d) => d.status === 'Sponsored').length,
      };
    });
    return { rows };
  },

  top_dragons: (args) => {
    const metric = (typeof args.metric === 'string' ? args.metric : 'firePower') as keyof Dragon;
    const limit = typeof args.limit === 'number' && args.limit > 0 ? Math.floor(args.limit) : 5;
    const rows = [...dragons].sort((a, b) => (b[metric] as number) - (a[metric] as number)).slice(0, limit);
    return { rows };
  },

  sponsor_dragon: (args) => {
    const id = typeof args.id === 'string' ? args.id : '';
    const d = dragons.find((x) => x.id === id);
    if (!d) {
      return { success: false, id, name: '', status: '', sponsorCount: 0, monthlySponsorshipGold: 0, message: `No dragon with id "${id}".` };
    }
    if (d.status === 'Rewilding') {
      return {
        success: false,
        id: d.id,
        name: d.name,
        status: d.status,
        sponsorCount: d.sponsorCount,
        monthlySponsorshipGold: d.monthlySponsorshipGold,
        message: `${d.name} is being rewilded and can no longer be sponsored.`,
      };
    }
    d.sponsorCount += 1;
    d.status = 'Sponsored';
    return {
      success: true,
      id: d.id,
      name: d.name,
      status: d.status,
      sponsorCount: d.sponsorCount,
      monthlySponsorshipGold: d.monthlySponsorshipGold,
      message: `You're now one of ${d.sponsorCount} sponsors chipping in ${d.monthlySponsorshipGold}g/month for ${d.name} ${d.emoji}!`,
    };
  },

  update_dragon: (args) => {
    const id = typeof args.id === 'string' ? args.id : '';
    const d = dragons.find((x) => x.id === id);
    if (!d) return { success: false, id, name: '', message: `No dragon with id "${id}".` };
    if (typeof args.name === 'string' && args.name.trim()) d.name = args.name.trim();
    if (typeof args.nickname === 'string' && args.nickname.trim()) d.nickname = args.nickname.trim();
    if (typeof args.temperament === 'string') d.temperament = args.temperament as Dragon['temperament'];
    if (typeof args.status === 'string') d.status = args.status as Dragon['status'];
    if (typeof args.dietType === 'string') d.dietType = args.dietType as Dragon['dietType'];
    if (typeof args.funFact === 'string' && args.funFact.trim()) d.funFact = args.funFact.trim();
    return { success: true, id: d.id, name: d.name, message: `Updated ${d.name}'s profile.` };
  },
};

export function runTool(name: string, args: Args): unknown {
  const fn = handlers[name];
  if (!fn) throw new Error(`Unknown tool: ${name}`);
  return fn(args ?? {});
}
