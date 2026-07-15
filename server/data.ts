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
  element: 'Fire' | 'Ice' | 'Storm' | 'Earth' | 'Shadow';
  ageYears: number;
  wingspanM: number;
  /** 0-100 */
  firePower: number;
  /** hoard value in gold coins */
  hoardValue: number;
  temperament: 'Cuddly' | 'Grumpy' | 'Mischievous' | 'Regal' | 'Chaotic';
  status: 'Available' | 'Sponsored' | 'Rewilding';
  rescuedSeason: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  emoji: string;
  funFact: string;
}

// ── The roster ───────────────────────────────────────────────────────────────
// Mutable so the sponsor_dragon mutation can actually change state during a demo.
const dragons: Dragon[] = [
  { id: 'd01', name: 'Cinderbelle', element: 'Fire', ageYears: 42, wingspanM: 9.1, firePower: 88, hoardValue: 128000, temperament: 'Regal', status: 'Available', rescuedSeason: 'Summer', emoji: '🐉', funFact: 'Toasts marshmallows for visitors on request.' },
  { id: 'd02', name: 'Pyrrha', element: 'Fire', ageYears: 17, wingspanM: 5.4, firePower: 74, hoardValue: 44000, temperament: 'Chaotic', status: 'Available', rescuedSeason: 'Spring', emoji: '🔥', funFact: 'Once set a rival sanctuary\'s newsletter on fire. Twice.' },
  { id: 'd03', name: 'Emberwyn', element: 'Fire', ageYears: 63, wingspanM: 11.2, firePower: 95, hoardValue: 210000, temperament: 'Grumpy', status: 'Sponsored', rescuedSeason: 'Winter', emoji: '🌋', funFact: 'Refuses to fly on Mondays.' },
  { id: 'd04', name: 'Frostfang', element: 'Ice', ageYears: 28, wingspanM: 7.8, firePower: 22, hoardValue: 96000, temperament: 'Cuddly', status: 'Available', rescuedSeason: 'Winter', emoji: '❄️', funFact: 'Purrs. Loudly. It is unsettling.' },
  { id: 'd05', name: 'Glacia', element: 'Ice', ageYears: 51, wingspanM: 8.9, firePower: 15, hoardValue: 154000, temperament: 'Regal', status: 'Available', rescuedSeason: 'Autumn', emoji: '🧊', funFact: 'Sneezes hailstones.' },
  { id: 'd06', name: 'Zephyra', element: 'Storm', ageYears: 34, wingspanM: 10.5, firePower: 61, hoardValue: 72000, temperament: 'Mischievous', status: 'Available', rescuedSeason: 'Spring', emoji: '⚡', funFact: 'Steals umbrellas. Returns them soggy.' },
  { id: 'd07', name: 'Tempest', element: 'Storm', ageYears: 46, wingspanM: 12.4, firePower: 69, hoardValue: 118000, temperament: 'Chaotic', status: 'Rewilding', rescuedSeason: 'Summer', emoji: '🌩️', funFact: 'Can spell its own name in lightning.' },
  { id: 'd08', name: 'Boulderjaw', element: 'Earth', ageYears: 88, wingspanM: 6.2, firePower: 40, hoardValue: 320000, temperament: 'Grumpy', status: 'Sponsored', rescuedSeason: 'Autumn', emoji: '🪨', funFact: 'Hoard is 90% interesting rocks.' },
  { id: 'd09', name: 'Mossheart', element: 'Earth', ageYears: 23, wingspanM: 5.9, firePower: 33, hoardValue: 51000, temperament: 'Cuddly', status: 'Available', rescuedSeason: 'Spring', emoji: '🌿', funFact: 'Grows a small garden on its back.' },
  { id: 'd10', name: 'Nyx', element: 'Shadow', ageYears: 71, wingspanM: 9.7, firePower: 58, hoardValue: 188000, temperament: 'Regal', status: 'Available', rescuedSeason: 'Winter', emoji: '🌑', funFact: 'Only appears in photos as a smudge.' },
  { id: 'd11', name: 'Umbra', element: 'Shadow', ageYears: 39, wingspanM: 8.1, firePower: 52, hoardValue: 99000, temperament: 'Mischievous', status: 'Available', rescuedSeason: 'Autumn', emoji: '🦇', funFact: 'Communicates exclusively in ominous riddles.' },
  { id: 'd12', name: 'Scorchling', element: 'Fire', ageYears: 4, wingspanM: 2.1, firePower: 47, hoardValue: 8000, temperament: 'Chaotic', status: 'Available', rescuedSeason: 'Summer', emoji: '🐲', funFact: 'Still learning. Please label your snacks.' },
  { id: 'd13', name: 'Aurora', element: 'Ice', ageYears: 60, wingspanM: 10.1, firePower: 19, hoardValue: 176000, temperament: 'Regal', status: 'Sponsored', rescuedSeason: 'Winter', emoji: '🌌', funFact: 'Wings shimmer like the northern lights.' },
  { id: 'd14', name: 'Gustwing', element: 'Storm', ageYears: 12, wingspanM: 6.7, firePower: 55, hoardValue: 29000, temperament: 'Mischievous', status: 'Available', rescuedSeason: 'Spring', emoji: '🪁', funFact: 'Naps upside down in thermals.' },
];

const SEASON_ORDER = ['Spring', 'Summer', 'Autumn', 'Winter'] as const;

// ── Tool specifications (shipped to the browser for prompt generation) ─────────
export const toolSpecs: ToolSpec[] = [
  {
    name: 'list_dragons',
    description:
      'List dragons in the sanctuary, optionally filtered by element and/or adoption status. Returns one row per dragon with all profile fields.',
    inputSchema: {
      type: 'object',
      properties: {
        element: { type: 'string', enum: ['Fire', 'Ice', 'Storm', 'Earth', 'Shadow'], description: 'Filter by elemental type' },
        status: { type: 'string', enum: ['Available', 'Sponsored', 'Rewilding'], description: 'Filter by adoption status' },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              element: { type: 'string' },
              ageYears: { type: 'number' },
              wingspanM: { type: 'number' },
              firePower: { type: 'number' },
              hoardValue: { type: 'number' },
              temperament: { type: 'string' },
              status: { type: 'string' },
              rescuedSeason: { type: 'string' },
              emoji: { type: 'string' },
              funFact: { type: 'string' },
            },
          },
        },
      },
    },
  },
  {
    name: 'sanctuary_stats',
    description:
      'Headline KPIs for the whole sanctuary: total dragons, how many are available vs sponsored, average fire power, total hoard value (gold), and dragons rescued this season.',
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
      },
    },
  },
  {
    name: 'element_breakdown',
    description:
      'Aggregate stats grouped by elemental type. One row per element with the dragon count, combined hoard value, and average fire power. Great for pie/bar charts.',
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
      'Return the top N dragons ranked by a numeric metric (firePower, hoardValue, or wingspanM). Defaults to firePower, limit 5.',
    inputSchema: {
      type: 'object',
      properties: {
        metric: { type: 'string', enum: ['firePower', 'hoardValue', 'wingspanM'], description: 'Metric to rank by' },
        limit: { type: 'number', description: 'How many dragons to return (default 5)' },
      },
    },
    outputSchema: {
      type: 'object',
      properties: { rows: { type: 'array', items: { type: 'object' } } },
    },
  },
  {
    name: 'sponsor_dragon',
    description:
      'Sponsor an available dragon by id. Flips its status to "Sponsored". Returns the updated dragon summary. This is a write action — trigger it from a Button, not on load.',
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
        message: { type: 'string' },
      },
    },
  },
  {
    name: 'update_dragon',
    description:
      'Edit an existing dragon\'s profile: rename it, change temperament or status, or rewrite its fun fact. Pass only the fields being changed. This is a write action — trigger it from a Form/Button, not on load.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The dragon id, e.g. "d01"' },
        name: { type: 'string', description: 'New name' },
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
    const metric = (typeof args.metric === 'string' ? args.metric : 'firePower') as
      | 'firePower'
      | 'hoardValue'
      | 'wingspanM';
    const limit = typeof args.limit === 'number' && args.limit > 0 ? Math.floor(args.limit) : 5;
    const rows = [...dragons].sort((a, b) => b[metric] - a[metric]).slice(0, limit);
    return { rows };
  },

  sponsor_dragon: (args) => {
    const id = typeof args.id === 'string' ? args.id : '';
    const d = dragons.find((x) => x.id === id);
    if (!d) return { success: false, id, name: '', status: '', message: `No dragon with id "${id}".` };
    if (d.status === 'Sponsored') {
      return { success: true, id: d.id, name: d.name, status: d.status, message: `${d.name} is already sponsored — thank you again!` };
    }
    d.status = 'Sponsored';
    return { success: true, id: d.id, name: d.name, status: d.status, message: `You are now sponsoring ${d.name} ${d.emoji}!` };
  },

  update_dragon: (args) => {
    const id = typeof args.id === 'string' ? args.id : '';
    const d = dragons.find((x) => x.id === id);
    if (!d) return { success: false, id, name: '', message: `No dragon with id "${id}".` };
    if (typeof args.name === 'string' && args.name.trim()) d.name = args.name.trim();
    if (typeof args.temperament === 'string') d.temperament = args.temperament as Dragon['temperament'];
    if (typeof args.status === 'string') d.status = args.status as Dragon['status'];
    if (typeof args.funFact === 'string' && args.funFact.trim()) d.funFact = args.funFact.trim();
    return { success: true, id: d.id, name: d.name, message: `Updated ${d.name}'s profile.` };
  },
};

export function runTool(name: string, args: Args): unknown {
  const fn = handlers[name];
  if (!fn) throw new Error(`Unknown tool: ${name}`);
  return fn(args ?? {});
}
