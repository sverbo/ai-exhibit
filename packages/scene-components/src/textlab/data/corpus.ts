import { tr, type Locale } from "@ai-exhibit/presentation-core";
import { mulberry32 } from "../../learning/ml/mlp.ts";
import type { LabelledSentence, Sport } from "./text.ts";

/**
 * Many more labelled sentences, for the neural network: generated from
 * templates with a seeded random generator, so the same seed always gives the
 * same sentences. A sentence is a player, an action and sometimes a moment
 * ("The winger hit the crossbar in stoppage time."), or a casual one ("My son
 * plays football in the park."). An action is a verb and an object from the
 * same group ("missed" + "both free throws"), so new sentences are new
 * combinations. Many words belong to both sports (missed, free, shot, ball,
 * rebound, net, final seconds...), which is why the network still makes
 * mistakes on sentences that are obvious to us.
 *
 * Unlike the small hand-written set, these football sentences do mention the
 * net, and French football sentences sometimes mention sneakers ("en baskets").
 */

/** "verb|verb" x "object|object": every verb fits every object of its group. */
type Group = [verbs: string, objects: string];

interface SportPools {
  subjects: string[];
  actions: Group[];
  tails: string[];
  casual: (r: () => number) => string;
}

interface Pools {
  shared: { subjects: string[]; tails: string[] };
  sport: Record<Sport, SportPools>;
}

const pick = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;
const split = (s: string) => s.split("|");

const EN_KIDS = ["My son", "My daughter", "Our neighbour", "My little brother", "My cousin"];
const FR_KIDS = ["Mon fils", "Ma fille", "Notre voisin", "Mon petit frère", "Ma cousine"];

const EN: Pools = {
  shared: {
    subjects: [
      "The captain",
      "Our best player",
      "The new signing",
      "The veteran",
      "The youngster",
      "The substitute",
      "Their top scorer",
      "The rookie",
      "She",
      "He",
      "The young forward",
      "The defender",
    ],
    tails: [
      "in the final minutes",
      "late in the game",
      "in front of a sold-out crowd",
      "after the break",
      "in the final seconds",
      "to win the game",
      "on Saturday night",
      "to tie the game",
      "against the champions",
      "in the first half",
    ],
  },
  sport: {
    football: {
      subjects: ["The striker", "The goalkeeper", "The winger", "The left back", "The midfielder", "The centre forward", "The keeper"],
      actions: [
        ["scored|missed|took|converted|saved", "the penalty|a free kick|the spot kick|a late penalty"],
        ["headed|volleyed|fired|slotted|smashed|curled", "the ball into the net|the ball into the top corner|the ball past the keeper|the ball into the back of the net|the ball just wide"],
        ["won|took|defended|cleared", "a corner|the corner|a throw-in|the long throw"],
        ["hit|rattled|struck", "the post|the crossbar|the goalpost|the bar"],
        ["was booked for|was sent off for|conceded a free kick for", "a late tackle|a reckless challenge|a handball|diving|time-wasting"],
        ["beat|chipped|rounded|nutmegged", "the keeper|the goalkeeper|the last defender|the full back"],
        ["was caught offside|made a sliding tackle|crossed the ball into the box|tapped in the rebound|scored an own goal|jumped highest to head it in", ""],
      ],
      tails: [
        "in stoppage time",
        "just before half time",
        "in extra time",
        "on the muddy pitch",
        "in the derby",
        "in the cup final",
        "from outside the box",
        "at the far post",
        "in the penalty shootout",
      ],
      casual: (r) =>
        `${pick(r, EN_KIDS)} plays football ${pick(r, ["in the park", "with friends", "after school", "on the beach", "in the street", "every Sunday"])}`,
    },
    basketball: {
      subjects: ["The point guard", "The center", "The power forward", "The shooting guard", "The small forward", "The sixth man", "The big man"],
      actions: [
        ["made|missed|sank|hit|drained", "both free throws|a free throw|a three-pointer|a jumper|a layup|a floater|a hook shot"],
        ["dunked|slammed|laid|dropped|banked", "the ball through the hoop|the ball through the net|the ball off the backboard|the ball into the hoop"],
        ["grabbed|won|fought for", "the rebound|the offensive rebound|the loose ball|the tip-off"],
        ["was called for|picked up a foul for|fouled out after|was whistled for", "traveling|a charge|a reach-in|goaltending|a shooting foul"],
        ["blocked|stole|intercepted|rejected", "the layup|the pass|the inbound pass|the shot at the rim"],
        ["drove to the hoop|split the double team|threw an alley-oop|set a hard screen|hit nothing but net|scored in the paint|scored on a fast break", ""],
      ],
      tails: [
        "in overtime",
        "at the buzzer",
        "in the fourth quarter",
        "before the shot clock expired",
        "on the hardwood",
        "in the playoffs",
        "from beyond the arc",
        "in the third quarter",
        "on the fast break",
      ],
      casual: (r) =>
        `${pick(r, EN_KIDS)} plays basketball ${pick(r, ["in the park", "with friends", "after school", "at the gym", "in the driveway", "every Sunday"])}`,
    },
  },
};

const FR: Pools = {
  shared: {
    subjects: [
      "Le capitaine",
      "Notre meilleur joueur",
      "La nouvelle recrue",
      "Le vétéran",
      "Le jeune",
      "Le remplaçant",
      "Leur meilleur marqueur",
      "Elle",
      "Il",
      "L'arrière",
      "L'ailier",
      "Le défenseur",
    ],
    tails: [
      "dans les dernières minutes",
      "en fin de match",
      "devant un public conquis",
      "après la pause",
      "dans les dernières secondes",
      "pour gagner le match",
      "samedi soir",
      "pour égaliser",
      "contre les champions",
      "en prolongation",
    ],
  },
  sport: {
    football: {
      subjects: ["L'attaquant", "Le gardien", "Le latéral gauche", "Le milieu de terrain", "L'avant-centre", "Le buteur", "Le libéro"],
      actions: [
        ["a marqué|a raté|a tiré|a transformé|a arrêté", "le penalty|un coup franc|le coup franc|un penalty tardif"],
        ["a envoyé|a glissé|a propulsé|a enroulé|a placé", "le ballon au fond des filets|le ballon dans la lucarne|le ballon hors du cadre|le ballon sous la barre|le ballon à côté du poteau"],
        ["a obtenu|a tiré|a dégagé|a joué", "un corner|la touche|une touche longue|le corner"],
        ["a touché|a trouvé|a heurté", "le poteau|la barre transversale|le montant|la barre"],
        ["a pris un carton jaune pour|a été expulsé pour|a concédé un coup franc pour", "un tacle en retard|une main|une simulation|un gain de temps|une faute grossière"],
        ["a dribblé|a lobé|a éliminé|a crocheté", "le gardien|le dernier défenseur|le latéral|le libéro adverse"],
        ["était hors jeu|a taclé proprement|a centré dans la surface|a repris le rebond|a marqué contre son camp|a marqué de la tête", ""],
      ],
      tails: [
        "dans le temps additionnel",
        "juste avant la mi-temps",
        "sur une pelouse détrempée",
        "dans le derby",
        "en finale de la coupe",
        "de l'extérieur de la surface",
        "au second poteau",
        "lors de la séance de tirs au but",
      ],
      casual: (r) => {
        const where = pick(r, ["au parc", "avec ses amis", "après l'école", "sur la plage", "dans la rue", "tous les dimanches", "dans la cour"]);
        const u = r();
        const shoes = u < 0.4 ? " en baskets" : u < 0.6 ? " en crampons" : "";
        return `${pick(r, FR_KIDS)} joue au foot ${where}${shoes}`;
      },
    },
    basketball: {
      subjects: ["Le meneur", "Le pivot", "L'ailier fort", "Le sixième homme", "Le shooteur", "L'intérieur"],
      actions: [
        ["a réussi|a raté|a mis|a manqué|a enchaîné", "ses deux lancers francs|un lancer franc|un tir à trois points|un tir en suspension|un double pas|un bras roulé"],
        ["a smashé|a déposé|a écrasé|a envoyé", "le ballon dans le panier|le ballon dans le cercle|le ballon sur la planche|le ballon au fond du panier"],
        ["a pris|a capté|a arraché|a gagné", "le rebond|le rebond offensif|le ballon perdu|l'entre-deux"],
        ["a été sanctionné pour|a écopé d'une faute pour|est sorti pour cinq fautes après", "un marcher|un passage en force|une faute offensive|un retour en zone|une faute antisportive"],
        ["a contré|a intercepté|a volé|a repoussé", "le double pas|la passe|la remise en jeu|le tir près du cercle"],
        ["a filé vers le cercle|a posé un écran|a fait trembler le filet|a réussi un alley-oop|a marqué dans la raquette|a marqué en contre-attaque|a marqué un panier primé", ""],
      ],
      tails: [
        "au buzzer",
        "dans le quatrième quart-temps",
        "avant la fin des vingt-quatre secondes",
        "sur le parquet",
        "en playoffs",
        "derrière la ligne à trois points",
        "dans le troisième quart-temps",
        "en contre-attaque",
      ],
      casual: (r) =>
        `${pick(r, FR_KIDS)} joue au basket ${pick(r, ["au parc", "avec ses amis", "après l'école", "au gymnase", "dans la cour", "tous les dimanches"])}`,
    },
  },
};

const POOLS: Record<Locale, Pools> = { en: EN, fr: FR };

function sentence(r: () => number, pools: Pools, label: Sport): string {
  const sport = pools.sport[label];
  if (r() < 0.15) return `${sport.casual(r)}.`;
  const subject = r() < 0.45 ? pick(r, sport.subjects) : pick(r, pools.shared.subjects);
  const [verbs, objects] = pick(r, sport.actions);
  const verb = pick(r, split(verbs));
  const object = pick(r, split(objects));
  const action = object ? `${verb} ${object}` : verb;
  const u = r();
  const tail = u < 0.25 ? "" : u < 0.65 ? ` ${pick(r, pools.shared.tails)}` : ` ${pick(r, sport.tails)}`;
  return `${subject} ${action}${tail}.`;
}

/**
 * `perSport` sentences of each sport, alternating football and basketball,
 * all distinct, and none of the sentences listed in `exclude`.
 */
export function generateSentences(locale: Locale, seed: number, perSport: number, exclude: ReadonlySet<string> = new Set()): LabelledSentence[] {
  const r = mulberry32(seed);
  const seen = new Set(exclude);
  const out: LabelledSentence[] = [];
  for (let k = 0; k < perSport; k++) {
    for (const label of ["football", "basketball"] as const) {
      let text = sentence(r, tr(POOLS, locale), label);
      while (seen.has(text)) text = sentence(r, tr(POOLS, locale), label);
      seen.add(text);
      out.push({ text, label });
    }
  }
  return out;
}
