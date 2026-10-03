import type { Locale } from "@ai-exhibit/presentation-core";
import type { LabelledSentence, Sport } from "./text.ts";

/**
 * The small, hand-written labelled set: 12 sentences per sport and language.
 * The hand rule is tested on it and the decision tree learns from it.
 *
 * Something obvious is missing, on purpose, and it is what tree-unseen is
 * about. In English, no football sentence mentions the net (seven basketball
 * sentences do), so the tree learns "contains net: basketball". In French,
 * no football sentence mentions shoes, so the tree learns "contains basket:
 * basketball", and "baskets" (sneakers) falls into it.
 */

const s = (text: string): LabelledSentence => ({ text, label: "football" });
const b = (text: string): LabelledSentence => ({ text, label: "basketball" });

export const SMALL_SET: Record<Locale, LabelledSentence[]> = {
  en: [
    s("The striker scored with a powerful header."),
    s("Our goalkeeper saved the penalty."),
    s("She curled a free kick over the wall."),
    s("The winger crossed the ball into the box."),
    s("The referee showed him a yellow card for that tackle."),
    s("He scored twice before half time."),
    s("The fans sang as the players walked onto the pitch."),
    s("A late goal sent the match into extra time."),
    s("The defender cleared the ball off the line."),
    s("He was offside when he scored."),
    s("The keeper punched the cross away."),
    s("They won the cup on penalties."),
    b("He dunked the ball through the net."),
    b("Her shot swished through the net."),
    b("The ball rolled around the rim and dropped through the net."),
    b("The ball bounced off the backboard and into the net."),
    b("His shot from the corner hit nothing but net."),
    b("A last-second shot ripped through the net."),
    b("She sank a three-pointer that barely touched the net."),
    b("The center grabbed the rebound under the hoop."),
    b("The point guard drove to the hoop for an easy layup."),
    b("He jumped and slammed it through the hoop."),
    b("Her long shot bounced off the hoop at the buzzer."),
    b("They ran a fast break and finished with a dunk."),
  ],
  fr: [
    s("L'attaquant a marqué de la tête."),
    s("Notre gardien a arrêté le penalty."),
    s("Elle a enroulé un coup franc au-dessus du mur."),
    s("L'ailier a centré dans la surface."),
    s("L'arbitre lui a donné un carton jaune pour ce tacle."),
    s("Il a marqué deux buts avant la mi-temps."),
    s("Les supporters chantaient quand les joueurs sont entrés sur la pelouse."),
    s("Un but tardif a envoyé le match en prolongation."),
    s("Le défenseur a dégagé le ballon sur la ligne."),
    s("Il était hors jeu quand il a marqué."),
    s("Le gardien a repoussé le centre des poings."),
    s("Ils ont gagné la coupe aux tirs au but."),
    b("Elle joue au basket depuis l'âge de six ans."),
    b("Le match de basket s'est joué à guichets fermés."),
    b("Il a signé dans un club de basket à Lyon."),
    b("Le basket se joue à cinq contre cinq."),
    b("Elle regarde le basket américain tous les soirs."),
    b("L'entraîneur de basket a demandé un temps mort."),
    b("Au basket, un tir lointain vaut trois points."),
    b("Le pivot a pris le rebond sous le panier."),
    b("Le meneur a filé vers le panier pour un double pas facile."),
    b("Il a smashé le ballon dans le panier."),
    b("Son tir à trois points est tombé dans le panier au buzzer."),
    b("Ils ont lancé une contre-attaque conclue par un dunk."),
  ],
};

/** Sentence indices shown on the task scene. */
export const TASK = {
  hero: 1,
  football: [0, 2, 7, 11],
  basketball: [13, 20, 17, 23],
};

/** The default sentence walked through the tree on the tree scene. */
export const TREE_EXAMPLE = 0;

/**
 * The hand-written rule (classic AI): keywords per sport, football checked
 * first, football by default. A keyword matches any word that starts with it
 * ("kick" matches "kicked", "goal" matches "goalkeeper").
 */
export interface KeywordRule {
  football: string[];
  basketball: string[];
  fallback: Sport;
}

export const RULE: Record<Locale, KeywordRule> = {
  en: { football: ["goal", "kick", "pitch"], basketball: ["dunk", "hoop", "basket"], fallback: "football" },
  fr: { football: ["but", "pied", "penalty"], basketball: ["panier", "dunk", "rebond"], fallback: "football" },
};

/** A sentence the rule gets right (index in SMALL_SET). */
export const RULE_RIGHT = 7;

/** A new sentence the rule gets wrong: a football keyword in a basketball sentence. */
export const RULE_FAIL: Record<Locale, LabelledSentence> = {
  en: b("Furious after missing the dunk, he kicked the ball into the stands."),
  fr: b("Furieux d'avoir raté son dunk, il a donné un coup de pied dans le ballon."),
};

/** The trap of tree-unseen: obvious to us, and the tree gets it wrong. */
export const TREE_TRAP: Record<Locale, LabelledSentence> = {
  en: s("The striker smashed the ball into the back of the net."),
  fr: s("Il est venu jouer au foot en baskets."),
};
