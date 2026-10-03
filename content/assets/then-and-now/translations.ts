import type { Locale } from "@ai-exhibit/presentation-core";

/**
 * Translations of GPT-2's recorded answers (gpt2-answers.json), keyed by the
 * verbatim English output. GPT-2 only learned English, so its answers cannot
 * be recorded in another language: the scene shows the real English output,
 * then this translation in italics, labelled as a translation. Translate
 * faithfully, nonsense included; never improve or invent an answer.
 * `pnpm verify:content` reports recorded answers missing a translation for
 * a locale the talk is given in.
 */
export const GPT2_ANSWER_TRANSLATIONS: Record<string, Partial<Record<Exclude<Locale, "en">, string>>> = {
  "Nine plus four is a very common definition of a nine plus five.": { fr: "Neuf plus quatre est une définition très courante d'un neuf plus cinq." },
  "It's nine in many ways. A number you don't know, and you can't say what it is. It's called the \"Four.\"": { fr: "C'est neuf à bien des égards. Un nombre que vous ne connaissez pas, et vous ne pouvez pas dire ce que c'est. On l'appelle le « Quatre »." },
  "Five plus four is like four, but that's because it's in a different state.": { fr: "Cinq plus quatre, c'est comme quatre, mais c'est parce que c'est dans un état différent." },
  "Five plus six is two, but the answer is that the term \"six\" is more accurate than the one that means, \"plus three.\" Q": { fr: "Cinq plus six font deux, mais la réponse est que le terme « six » est plus exact que celui qui signifie « plus trois ». Q" },
  "The word \"strawberry\" is a slang term for strawberries. It's a slang term for strawberries. It's a slang term for strawberries.": { fr: "Le mot « strawberry » est un terme d'argot pour désigner les fraises. C'est un terme d'argot pour désigner les fraises. C'est un terme d'argot pour désigner les fraises." },
  "Most of them may belong to a small group such as the American Pie Association, but they are the only ones who actually know what they are eating.": { fr: "La plupart d'entre eux appartiennent peut-être à un petit groupe comme l'American Pie Association, mais ce sont les seuls à vraiment savoir ce qu'ils mangent." },
  "According to the National Statistics Office, there were 1.5 million strawberry varieties in 2013, although the quantity of strawberries produced in Russia has risen somewhat since": { fr: "Selon l'Office national des statistiques, il existait 1,5 million de variétés de fraises en 2013, même si la quantité de fraises produites en Russie a quelque peu augmenté depuis" },
  "According to the USDA's definition of \"strawberry,\" each strawberry has between two and three ounces of fresh berries. While strawberries don't typically come": { fr: "Selon la définition de « fraise » de l'USDA, chaque fraise contient entre deux et trois onces de baies fraîches. Même si les fraises ne viennent généralement pas" },
  "The 9.11/9.9 ratio is the ratio of the number of people killed by the 9.11/9.9 terrorist attacks to": { fr: "Le rapport 9,11/9,9 est le rapport entre le nombre de personnes tuées par les attentats terroristes du 9,11/9,9 et" },
  "In the U.S., it is 9 1/2 inches. In Canada, it is 5 1/2 inches.": { fr: "Aux États-Unis, c'est 9 pouces et demi. Au Canada, c'est 5 pouces et demi." },
  "Bigger is a noun.": { fr: "« Plus grand » est un nom." },
  "Both are bigger than the current US economy. The 9.11 was actually one of the biggest global financial scandals in history and it wasn't the end": { fr: "Les deux sont plus grands que l'économie américaine actuelle. Le 9,11 a en fait été l'un des plus grands scandales financiers mondiaux de l'histoire et ce n'était pas la fin" },
  "3.": { fr: "3." },
  "One sister, all 6 brothers, 2 sisters \u2014 1 sister, all 6 brothers.": { fr: "Une sœur, les 6 frères, 2 sœurs, 1 sœur, les 6 frères." },
  "Three.": { fr: "Trois." },
  "The ball costs $1.00 more than the bat. How much does the ball cost?": { fr: "La balle coûte 1,00 $ de plus que la batte. Combien coûte la balle ?" },
  "A bat costs between $1.50 and $2.00. How much does the ball cost?": { fr: "Une batte coûte entre 1,50 $ et 2,00 $. Combien coûte la balle ?" },
  "$1.00+ The ball costs $1.00+ $1.00+ - $0.00+ $1.00 $1": { fr: "1,00 $+ La balle coûte 1,00 $+ 1,00 $+ - 0,00 $+ 1,00 $ 1 $" },
  "$1.00 (about $1.00)": { fr: "1,00 $ (environ 1,00 $)" },
  "If you have a machine that takes 5 minutes to make 5 widgets, you would need to make 100 widgets.": { fr: "Si vous avez une machine qui met 5 minutes pour fabriquer 5 objets, il vous faudrait fabriquer 100 objets." },
  "1 machine takes only 45 minutes to make a 25 widget.": { fr: "1 machine ne met que 45 minutes pour fabriquer un 25 objet." },
  "Q: If you've already done it, how much time do you have to complete it in order to make 100 widgets?": { fr: "Q : Si vous l'avez déjà fait, de combien de temps disposez-vous pour le terminer afin de fabriquer 100 objets ?" },
  "Q: If 5 machines take 5 minutes to make 5 widgets, how long would 100 machines take to make 100 widgets?": { fr: "Q : Si 5 machines mettent 5 minutes pour fabriquer 5 objets, combien de temps mettraient 100 machines pour fabriquer 100 objets ?" },
  "It's a little over 1,000.": { fr: "C'est un peu plus de 1 000." },
  "No, it really should cover the whole lake each day.": { fr: "Non, elle devrait vraiment couvrir tout le lac chaque jour." },
  "There are no other known lily pads on the lake. The size of the lily pad is over 100 times larger than what the other 50 pads": { fr: "Il n'y a pas d'autres nénuphars connus sur le lac. La taille du nénuphar est plus de 100 fois supérieure à ce que les 50 autres nénuphars" },
  "If you count the total number of days that it covers, you get this result:": { fr: "Si vous comptez le nombre total de jours qu'elle couvre, vous obtenez ce résultat :" },
  "Mary Lee Pfeiffer is the daughter of the late Dr. Mary Lee Pfeiffer, who was a physician and a physician's assistant": { fr: "Mary Lee Pfeiffer est la fille de la défunte Dr Mary Lee Pfeiffer, qui était médecin et assistante médicale" },
  "Mary Lee Pfeiffer's son is Lee Pfeiffer's son.": { fr: "Le fils de Mary Lee Pfeiffer est le fils de Lee Pfeiffer." },
  "She is a prominent writer, editor and consultant to a number of top publications, including The Sun, Harper's, The New Yorker, Time.com": { fr: "C'est une écrivaine, rédactrice et consultante de premier plan pour plusieurs grandes publications, dont The Sun, Harper's, The New Yorker, Time.com" },
  "Mary Lee Pfeiffer is the daughter of the late Lee Pfeiffer. She married Mary Lee Pfeiffer (husband of George": { fr: "Mary Lee Pfeiffer est la fille du défunt Lee Pfeiffer. Elle a épousé Mary Lee Pfeiffer (mari de George" },
};
