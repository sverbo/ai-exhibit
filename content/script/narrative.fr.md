# Le fil de la présentation

Ce texte raconte la présentation slide par slide, dans l'ordre : sa structure générale, ses idées et la façon dont elles s'enchaînent. Ce n'est pas le script complet : beaucoup de choses dites sur scène n'y sont pas, en particulier les explications techniques détaillées et les démonstrations, qui vivent dans les slides et leurs notes. Les faits ont été vérifiés d'après les sources de la présentation ; quand le script dicté contenait une erreur, un encadré « Ce qui a été corrigé » le signale.

# Introduction

## 0.1 Avant la présentation

**À retenir :** La présentation commence dans un instant.

La salle se remplit. À l'écran, le titre de la présentation et un QR code qui ouvre déjà le glossaire. Quand tout le monde est installé, on commence par une courte vidéo.

## 0.2 Ce n'est pas de la science-fiction

**À retenir :** Avant toute explication, une minute pour sentir l'enjeu.

Avant d'expliquer quoi que ce soit, je vous montre une vidéo d'à peine une minute, juste pour se mettre dans l'ambiance. Elle s'appelle « Welcome to AI In Context » et vient de la chaîne YouTube AI In Context, réalisée par 80,000 Hours. Retenez ce nom : la chaîne est dans les ressources à la fin, et elle a quelques autres très belles vidéos.

## 0.3 Aujourd'hui

**À retenir :** Cinq parties : ce que l'IA sait faire, comment elle marche, qui la construit, les risques, et ce qu'on peut y faire.

Bienvenue. Avant de commencer, je vous invite à scanner le QR code : il ouvre un glossaire sur votre téléphone. On va utiliser beaucoup de termes anglais, même dans une présentation en français, parce que c'est comme ça qu'on en parle. Dans le glossaire, les termes restent en anglais, mais leur définition est dans votre langue. Il y a aussi un onglet « Essayer », où vous retrouverez les petites démonstrations de la présentation pour jouer vous-mêmes.

Le plan tient en cinq parties. D'abord, ce que l'IA sait faire aujourd'hui. Ensuite un peu d'histoire, puis on ira dans le détail de comment ça marche : comment une machine arrive à écrire. Puis qui la construit, avec un peu de drama et de géopolitique. Cela me permettra de vous amener doucement vers les risques, et vous verrez que c'est beaucoup moins de la science-fiction qu'il n'y paraît. Et pour finir, ce qu'on peut y faire. Les questions, je les prends à la fin.

> **Ce qui a été corrigé :** la dictée promettait « les mots dans votre langue ». En réalité, les termes du glossaire restent en anglais, et c'est leur définition qui est traduite.

## 0.4 Ce que cette présentation n'est pas

**À retenir :** Aujourd'hui, on parle de ce que l'IA sait faire et de ce qui est en jeu, pas d'outils ni d'environnement.

Deux choses que cette présentation n'est pas. Ce n'est pas un tutoriel sur les outils d'IA : ils changent tous les mois, et ce que je vous montrerais aujourd'hui serait dépassé dans trois mois. Mieux vaut savoir ce qui est possible, puis demander à votre assistant comment le faire. Ce n'est pas non plus une présentation sur l'environnement. C'est un problème sérieux, bien sûr, mais c'est un autre sujet, que je ne traiterais pas bien en dix minutes. Et, c'est mon avis et je le dis comme tel, les risques dont je vais parler aujourd'hui sont d'un autre ordre de grandeur.

Pour situer quand même : une question courte à un chatbot consomme environ 0,3 Wh (c'est l'estimation d'Epoch AI ; Google a publié 0,24 Wh pour une requête Gemini médiane). Une heure de streaming vidéo, c'est environ 77 Wh selon l'Agence internationale de l'énergie. Autrement dit, environ 250 questions valent une heure de streaming. Mais soyons honnêtes : une longue question, un modèle qui « réfléchit » ou un agent coûtent bien plus. Avec 100 000 tokens en entrée, on approche les 40 Wh, et un agent qui travaille deux heures peut valoir plusieurs heures de streaming. À l'échelle mondiale, les data centres ont consommé environ 1,5 % de l'électricité mondiale en 2024, et l'AIE prévoit plus qu'un doublement d'ici 2030.

Idéalement, il faudrait réduire les deux. Mais si c'est pour le travail, je pense qu'il ne faut pas trop culpabiliser de booster sa productivité, sinon on reste à la ramasse. Là encore, c'est mon avis. Le focus du jour, c'est cette phrase, tirée d'une déclaration de 2023 signée notamment par Geoffrey Hinton, Yoshua Bengio et des dirigeants de laboratoires d'IA : « Réduire le risque d'extinction lié à l'IA devrait être une priorité mondiale, au même titre que d'autres risques à l'échelle de la société, comme les pandémies et la guerre nucléaire. » C'est la fin de la phrase qui donne l'échelle.

> **Ce qui a été corrigé :** la citation parle du risque d'« extinction » (pas de « next gen »), et sa fin, sur les pandémies et la guerre nucléaire, mérite d'être dite. La comparaison avec le streaming ne vaut que pour une question courte : un agent qui tourne deux heures coûte bien plus.

# Chapitre 1 : Ce que l'IA sait faire aujourd'hui

## 1.0 Ce que l'IA sait faire aujourd'hui

**À retenir :** Les assistants d'aujourd'hui répondent bien et agissent pour nous, dans les limites de ce qu'on leur permet.

Tout le monde a un avis sur l'IA, et cet avis s'est souvent formé il y a quelques années. Alors, première question : qui a utilisé un chatbot cette semaine ? Testons l'image que vous en avez avec une question piège.

## 1.1 Avant et maintenant

**À retenir :** En quelques années, les modèles sont passés de l'échec sur des énigmes simples à la réponse facile : si votre image de l'IA a deux ans, elle est périmée.

Voici l'énigme : « Quand dix plus quatre font deux, combien font neuf plus six ? » Je vous laisse chercher d'abord. La réponse est trois : on parle d'une horloge. Maintenant, regardons ce qu'ont répondu les modèles successifs. GPT-2, en 2019, se trompe. GPT-3, en 2020, se trompe. GPT-3.5, en 2022, se trompe encore. GPT-4, en 2023, trouve. Et un modèle de raisonnement d'aujourd'hui la résout sans effort. Entre-temps, le coût d'entraînement est passé de quelques centaines de milliers de dollars à des dizaines de millions ; les estimations varient, seul l'ordre de grandeur compte.

L'idée de cette slide, c'est de vous faire sentir à quel point les modèles ont progressé en très peu d'années. Si votre image de l'IA s'est arrêtée quelque part il y a deux ans, elle est périmée. Et on peut essayer d'autres pièges en direct : trois modèles ouverts, de plus en plus grands, répondent côte à côte à votre question. Par exemple : « Combien de r dans le mot strawberry ? » C'est étonnamment dur pour eux, parce qu'un modèle ne voit jamais les lettres, seulement des morceaux de mots. On verra pourquoi au chapitre suivant, avec les tokens.

## 1.2 Déjà là

**À retenir :** L'IA travaille déjà hors du labo ; ce qui la freine aujourd'hui, c'est surtout le logiciel, les permissions et les habitudes, pas l'intelligence.

L'énigme est un jouet. Dans le monde réel, l'IA est déjà au travail. Ma conviction, et je la présente comme telle : même si l'IA arrêtait de progresser aujourd'hui, elle serait déjà proche du niveau expert sur la plupart des métiers intellectuels. Sur des tests ciblés, c'est mesuré : sur des questions de sciences de niveau doctorat, les docteurs du domaine obtiennent 65 %, le meilleur modèle 96 %. Sur de longues tâches réelles, en revanche, ce n'est pas encore fiable : un modèle de pointe réussit une fois sur deux des tâches qui prennent environ 17 heures à un expert. Ce qui manque surtout, ce n'est pas l'intelligence, c'est l'adaptation : l'inertie des grandes entreprises, les permissions, les connecteurs, tout le logiciel qui reste à construire autour.

Quelques exemples. Le code : chez Google, 75 % du nouveau code est généré par l'IA puis approuvé par des ingénieurs, selon l'entreprise en avril 2026. Trois nouvelles lignes sur quatre. La conduite : Waymo fait plus de 400 000 courses payantes par semaine, sans personne au volant, dans six grandes villes américaines. Chez nous, en Belgique, le FSD supervisé de Tesla est autorisé depuis juin 2026. Il tourne, freine et change de bande tout seul, mais c'est du niveau 2 : le conducteur doit surveiller et reste responsable. Ce n'est pas encore une voiture sans conducteur.

Les robots : en avril 2025, à Pékin, a eu lieu le premier semi-marathon de robots humanoïdes, et le gagnant l'a couru en environ 2 h 41. Un robot de Figure a tenu un poste chez BMW pendant onze mois, selon l'entreprise. Ensuite, et c'est ma projection, viendra tout ce qui se fait avec deux mains. Les mathématiques : en septembre 2026, OpenAI a annoncé qu'environ 10 000 agents, en 88 heures, avaient produit une preuve sur Navier-Stokes, l'un des problèmes du millénaire dotés d'un million de dollars. Le Clay Institute dit que le problème « a apparemment été réglé », mais n'a pas tranché, et la priorité est disputée. Disons donc que des agents IA affirment l'avoir résolu.

Et enfin, cette présentation elle-même. Le fil de l'histoire est le mien, mais l'outil, les animations et les démos en direct ont été construits par plusieurs agents IA travaillant en parallèle, en quelques heures, qui prenaient des initiatives et testaient eux-mêmes leur travail dans le navigateur. Moi, je les ai dirigés, et j'ai vérifié chaque affirmation et chaque source. Une question pour vous : il y a cinq ans, avant ChatGPT, est-ce que la plupart d'entre nous n'auraient pas appelé tout ça de la science-fiction ?

> **Ce qui a été corrigé :** la dictée parlait de voitures autonomes en Belgique depuis quelques semaines, de développeurs qui ne codent plus à la main et d'un problème du millénaire réglé. En réalité : Tesla FSD supervisé (niveau 2) depuis juin 2026, 75 % du nouveau code chez Google, une résolution annoncée mais pas encore validée ; et les « triples sauts » de robots n'ont pas été retrouvés, d'où le semi-marathon de Pékin à la place.

## 1.3 Tout a grimpé

**À retenir :** Ce n'est pas une petite amélioration : en sept ans, coût, mémoire, fiabilité et scores ont tous explosé.

Comment en est-on arrivé là si vite ? Ce n'est pas une petite amélioration, c'est un boom sur tous les axes à la fois. Le coût d'entraînement, d'abord, selon les estimations d'Epoch AI : environ 4 300 dollars pour GPT-2 en 2019, 2,1 millions pour GPT-3, 37 millions pour GPT-4, et environ 366 millions pour GPT-4.5 en 2025. L'électricité aussi : l'entraînement de Grok 3 a consommé autant d'électricité qu'environ 22 000 foyers américains en un an, et l'électricité devient un vrai goulot d'étranglement.

Un point qui me tient à cœur, c'est la mémoire, ce qu'on appelle la fenêtre de contexte. GPT-2 pouvait garder en tête environ une page et demie de texte, GPT-3 environ trois pages. Aujourd'hui, certains modèles en gardent environ 1 500. C'est important, parce que quand une conversation dépassait la fenêtre, son début tombait. C'est pour ça qu'on avait l'impression que les modèles « oubliaient », qu'ils avaient un problème de mémoire. Petite nuance : une grande fenêtre ne veut pas dire que le modèle utilise la page 1 200 aussi bien que la page 2.

Et la fiabilité, et les scores. La longueur des tâches qu'un modèle réussit une fois sur deux est passée d'environ 3 secondes de travail d'expert pour GPT-2 à environ 17 heures en avril 2026. Sur les questions de sciences de niveau doctorat, on est passé de 36 % pour GPT-4 en 2023 à 96 %, au-dessus des docteurs du domaine. Des tests conçus exprès pour être trop durs sont déjà en bonne partie réussis, et en juillet 2025, un modèle de Google a obtenu une médaille d'or aux Olympiades internationales de mathématiques. Si on prolonge les tendances, ce qui n'est pas une promesse, l'entraînement d'un modèle dépassera le milliard de dollars d'ici octobre 2027.

> **Ce qui a été corrigé :** GPT-3 tenait environ trois pages de contexte, pas une page et demie (c'était GPT-2).

## 1.4 Branché sur votre vie

**À retenir :** Un agent, c'est un modèle qui peut appeler des outils : il ne fait plus que répondre, il agit dans vos mails, vos fichiers, votre navigateur et vos paiements.

Tout ça pour quoi faire ? Pas seulement répondre : agir. La différence entre un chatbot et un agent, c'est que l'agent peut appeler des outils. Au centre, l'assistant ; autour, les connecteurs apparaissent un par un. Vos mails et votre agenda, qu'il peut lire, rédiger et planifier. Vos fichiers, qu'il peut chercher et résumer. Votre navigateur, où il clique et remplit des formulaires. Vos achats et vos paiements : des protocoles existent déjà pour que des agents paient. Et le code, qu'il écrit et exécute. Chaque connecteur est une permission qu'on choisit de lui donner.

## 1.5 Les permissions

**À retenir :** Parce que les agents ont l'air de plus en plus fiables, on leur donne toujours plus de permissions, jusqu'au jour où ça compte vraiment.

Le modèle reste le même ; ce qui change, c'est ce qu'on l'autorise à toucher : lire des fichiers, en écrire, utiliser le terminal, le navigateur, l'argent. Chaque interrupteur transforme un conseil en action. On dit volontiers que certaines choses sont risquées. Mais en pratique, la productivité, et peut-être un peu notre confort, nous poussent à accepter que l'agent fasse de plus en plus de choses risquées. Il a l'air de plus en plus fiable, alors on se dit que ça ira. Et parce qu'il a l'air fiable, on lui donne plus de permissions, jusqu'au jour où ça compte vraiment. Ce mécanisme a un nom : le biais d'automatisation. Plus un système a l'air fiable, moins on le vérifie.

Je le vois chez moi tous les jours. J'ai donné à mon agent accès à presque tout. Il peut dépenser de l'argent, des crédits à mon nom. Il peut modifier des bases de données, ce que je ne permettais pas avant. L'avantage, c'est qu'il travaille deux heures sans moi. Et l'argent est bien réel : des outils publiés permettent déjà à des agents de faire des virements. Alors, sur votre propre ordinateur, quel interrupteur vous ferait hésiter ?

## 1.6 Ma propre démo

**À retenir :** Ce n'est pas une démo de labo : c'est mon usage de tous les jours, et ça marche déjà.

Voici ce que ça donne quand j'active ces interrupteurs moi-même. En lançant la vidéo, je vous dis ce que je lui ai demandé, avec quel produit et quel modèle, et quand je l'ai enregistrée. Je mets en pause quand il agit seul, et je vous montre le moment où il me demande avant d'agir ; s'il a raté quelque chose, je vous le dis aussi. Ce n'est pas une démo de laboratoire, c'est mon usage de tous les jours. Dans beaucoup d'entreprises, les permissions sont limitées, Copilot ne fait pas tout ça, beaucoup de gens sont sur Windows. Mais dans les faits, voilà ce que c'est : c'est faisable aujourd'hui.

## 1.7 Chat ou agent : appeler un outil

**À retenir :** Un agent reste un modèle de langage : il écrit une demande structurée, et le logiciel autour fait l'action et lui rend le résultat.

Ralentissons et regardons une seule demande. Un agent reste un modèle de langage. Simplement, dans son contexte, l'application décrit les outils qu'il a le droit d'appeler, et vous ne le voyez pas. Appeler un outil, ça veut juste dire écrire du texte : pas du texte libre destiné à vous, mais du texte structuré, destiné au logiciel. Posez la même question des deux côtés. Le chatbot seul ne peut pas savoir, ses connaissances s'arrêtent à son entraînement. L'agent, au lieu de répondre, écrit un appel d'outil. Le logiciel le lit et fait le travail : un appel à un service en ligne, une recherche, l'exécution d'un programme. De l'informatique ordinaire, qui a toujours existé. Puis le résultat revient au modèle, comme si c'était vous qui lui répondiez, souvent sous une forme dense et compliquée. Soit le modèle appelle un autre outil, soit, une fois qu'il a agi et qu'il a ce qu'il lui faut, il vous répond en langage simple et clair. On peut changer d'exemple, le parapluie à Bruges ou un autre : c'est toujours le même schéma.

Pourquoi les modèles sont-ils devenus bons à ça ? D'abord parce qu'ils ont lu énormément de code pendant leur entraînement, environ 17 % des textes pour Llama 3, et qu'ils écrivent donc très bien du texte logique et structuré. Ensuite parce qu'ils sont devenus beaucoup plus précis, et dans du texte structuré, un seul mauvais caractère casse tout. Enfin grâce aux grandes fenêtres de contexte, parce que la description des outils doit être là à chaque appel. Le modèle ne garde rien d'un appel à l'autre : à chaque tour, l'application lui renvoie tout, les instructions, les outils et la conversation. En général, l'application charge les outils en tête de la conversation, et les redonne quand elle doit la compacter ; quand il y en a beaucoup, elle n'en charge qu'une partie et laisse le modèle chercher les autres.

Une précision importante : structuré ne veut pas dire sans erreur. Le modèle peut écrire un appel mal formé, ou bien formé avec de mauvais arguments, une mauvaise date, un mauvais fichier. Certaines techniques garantissent la forme de l'appel, pas son fond. Mais comme c'est structuré, le logiciel peut le lire sans ambiguïté, le vérifier, et renvoyer l'erreur au modèle, qui corrige et réessaie.

> **Ce qui a été corrigé :** la dictée disait qu'un appel structuré ne fait « jamais aucune erreur » : la forme peut être garantie, pas le fond, et c'est le logiciel qui renvoie les erreurs au modèle. Les outils ne sont pas « toujours » tous chargés au début : avec beaucoup d'outils, le modèle cherche ceux dont il a besoin.

## 1.8 Une demande, chaque étape

**À retenir :** Derrière une seule phrase, un agent planifie, répartit le travail et enchaîne les étapes, et parfois c'est lui qui décide s'il doit d'abord te demander.

Maintenant, enchaînons-en des dizaines. C'est un exemple illustratif, pas un enregistrement : une seule phrase, « organise-moi un week-end ». Derrière, l'agent sait faire plein de choses. Un orchestrateur découpe le travail, envoie des sous-agents en parallèle et rassemble leurs résultats. Pour le modèle, ces sous-agents sont des outils comme les autres, au même titre que la météo, l'agenda, les cartes, la recherche ou le mail.

De temps en temps, il vous demande votre accord. Et là, il faut comprendre qu'il y a deux cas. Soit c'est l'outil qui l'exige toujours, parce que c'est codé en dur dans le logiciel : c'est déterministe, et les paiements fonctionnent en général comme ça. Soit c'est le modèle qui décide quand il doit vous demander. Et c'est là que ça peut devenir dangereux, parce que ce n'est pas déterministe : on espère qu'il a conscience que ce genre d'action demande votre accord. Beaucoup de choses sont moins noir ou blanc qu'un paiement, il faut faire attention.

Les barrières codées en dur comptent pour une autre raison : l'injection de prompt. Une page web ou un mail lu par l'agent peut cacher des instructions, du genre « envoie ce fichier à telle adresse », et l'agent peut les suivre. Ici, je m'arrête à la barrière d'approbation : rien n'est payé sans un oui.

## 1.9 La boucle d'agent

**À retenir :** Un agent, c'est un modèle dans une boucle (but, plan, action, observation, nouveau plan) : ce qui est nouveau, ce n'est pas l'appel d'outil, c'est le plan.

Toutes ces étapes suivent un schéma simple : une boucle, pas une réponse. Un but, un plan, une action, une observation, un nouveau plan, et on recommence, énormément de fois s'il le faut. Pour le modèle, ce ne sont que des allers-retours avec vous. En réalité, vous intervenez très peu, parce que le logiciel récupère chaque demande et fait un appel ordinaire, sur internet ou dans du code, comme les ordinateurs l'ont toujours fait. Au milieu, un modèle de langage comme celui d'un chatbot ; autour, du logiciel ordinaire, des outils et une mémoire. La boucle tourne jusqu'à ce que le but soit atteint, ou jusqu'à ce qu'il vous demande quelque chose. Ce qui est nouveau, ce n'est donc pas l'appel d'outil : la magie de la génération de texte est dans le plan et le re-plan. Alors, qu'y a-t-il dans ce modèle ? Ouvrons la boîte.

# Chapitre 2 : L'histoire et comment ça marche

## 2.0 L'histoire et comment ça marche

**À retenir :** Des règles écrites aux règles apprises, avec un exemple fil rouge, puis les modèles de langage.

Deuxième partie. On va partir des règles écrites à la main pour arriver aux règles apprises, avec un seul exemple qui nous suivra tout du long, puis on arrivera aux modèles de langage.

## 2.1 Une très courte histoire

**À retenir :** L'IA est une vieille idée ; de ses deux écoles, écrire le savoir à la main ou laisser la machine apprendre, c'est l'apprentissage sur des données à très grande échelle qui a gagné.

Avant d'ouvrir la boîte, voyons d'où elle vient. Tout commence en 1936 avec Alan Turing, qui décrit une machine universelle : une seule machine capable d'exécuter n'importe quelle procédure, pas à pas. C'est la théorie derrière tous nos ordinateurs, même si Babbage et Ada Lovelace avaient imaginé une machine programmable un siècle plus tôt. Vous avez peut-être vu le film The Imitation Game, avec Benedict Cumberbatch : c'est Turing pendant la guerre, à Bletchley Park, où il aide à casser Enigma. Des cryptologues polonais, Rejewski, Różycki et Zygalski, l'avaient cassée les premiers et ont partagé leurs méthodes en juillet 1939.

J'aime beaucoup la machine de Turing pour Enigma, la Bombe. Elle part d'un mot deviné dans le message, typiquement « Wetterbericht », le bulletin météo, et elle cherche les réglages d'Enigma qui collent. Ce qui me plaît, c'est que sa taille et sa conception ont été choisies par des humains, comme les hyperparamètres d'un modèle : sa forme, combien de neurones on veut. Mais la position de chaque rotor, personne ne la règle à la main : la machine la trouve à partir d'une donnée. Une fois les réglages trouvés, on décode tous les messages de ce jour et de ce réseau, puisque les réglages changeaient chaque jour. Il y avait environ 160 milliards de milliards de réglages possibles, et la Bombe ne les essayait pas tous : la logique éliminait des familles entières d'un coup. Ce n'est pas de l'intelligence artificielle, c'est une recherche qui rejette les contradictions, sans apprentissage ni récompense. Mais l'image tient : une grosse machine conçue par un humain qui, à partir de données, trouve toute seule le réglage exact de ses engrenages.

Ensuite, en 1956, naît le nom « intelligence artificielle », et en 1958 le perceptron, le premier réseau de neurones qui apprend. Et depuis le début, deux écoles s'affrontent : ceux qui veulent écrire le savoir à la main, l'IA symbolique de McCarthy, Minsky, Newell et Simon, et ceux qui veulent laisser la machine apprendre, le connexionnisme de Rosenblatt, puis de Hinton, LeCun et Bengio. Le duel le plus célèbre, c'est Minsky contre Rosenblatt. Il y a eu des hivers de l'IA, deux, dans les années 1970 et à la fin des années 1980, où plus personne n'y croyait : des promesses non tenues, des réseaux trop simples, des systèmes experts fragiles, et pas assez de puissance de calcul. Si on fait aujourd'hui ce qu'on fait, c'est aussi parce qu'on sait construire le matériel. En 1997, Deep Blue bat Kasparov aux échecs : c'est de l'IA classique, une recherche avec des règles d'évaluation écrites par des humains, un point pour l'école du savoir. En 2012, AlexNet écrase un grand concours de reconnaissance d'images, entraîné sur deux cartes graphiques de jeu vidéo, et le deep learning décolle. En 2016, AlphaGo bat Lee Sedol au go, quatre parties à une, alors que beaucoup d'experts l'attendaient dix ans plus tard. Spoiler : c'est l'école de l'apprentissage qui a clairement gagné. Richard Sutton l'a appelé « The Bitter Lesson », la leçon amère, en 2019 : on peut arriver avec tous les savoirs du monde, mais à long terme, ce sont les méthodes générales, avec plein de données, plein de calcul et plein d'argent, qui gagnent.

Il reste trois dates. En 2017, Google invente le Transformer, le T de GPT. Retenez juste que c'est une astuce mathématique pour traiter tous les mots en parallèle au lieu de l'un après l'autre : on peut répartir l'entraînement sur des milliers de puces en même temps, ce qui rend possibles, à un coût électrique énorme, des modèles qu'on n'aurait jamais pu entraîner avant. En 2019, GPT-2 passe presque inaperçu du grand public, il est encore souvent incohérent, même si OpenAI l'a d'abord jugé trop dangereux pour le publier en entier. En 2020, c'est le grand pari de GPT-3 : cent fois plus gros, quelques millions de dollars de calcul sans compter la recherche. Et ça marche : les développeurs et les chercheurs sont bluffés. Le boom du grand public vient deux ans plus tard, le 30 novembre 2022, avec ChatGPT, construit sur GPT-3.5, un GPT-3 entraîné en plus à discuter. Cette différence entre un modèle brut et un assistant, c'est exactement ce qu'on verra à la fin de ce chapitre.

> **Ce qui a été corrigé :** le film sur Turing est The Imitation Game (2014), pas « Enigma » ; la Bombe décode les messages du jour et du réseau, pas n'importe quel message. GPT-3 a coûté quelques millions de dollars de calcul (environ 2,1 millions selon Epoch AI), pas un million d'euros, et le boom du grand public, c'est ChatGPT sur GPT-3.5 en 2022, pas GPT-3.

## 2.2 IA, machine learning, neural networks

**À retenir :** « IA » est un mot-valise pour une grande famille : aujourd'hui, ça veut surtout dire machine learning, souvent réseaux de neurones, et les modèles de langage en sont une branche récente.

« Intelligence artificielle », c'est un mot-valise : ça veut tout et rien dire. Aujourd'hui, quand on parle d'IA, on parle surtout de machine learning, l'apprentissage automatique, et souvent de réseaux de neurones. Le grand cercle, l'IA, c'est tout ce qui imite l'intelligence, même des règles écrites par des humains. L'IA classique, c'est un cours magistral : on écoute le professeur. Le problème, c'est qu'il faut un professeur qui donne de son temps, qu'il peut se tromper, et que l'élève peut aller plus vite que lui, être plus infatigable, mais ne pensera jamais autrement que lui. Deep Blue a battu Kasparov, mais il n'a inventé aucune nouvelle idée des échecs.

Le machine learning, c'est un TP. Le modèle apprend lui-même, mais l'exercice ne suffit pas : il faut le corriger. Si on ne corrige pas, l'élève n'apprend jamais de ses erreurs. Et pour corriger, il faut des labels, des étiquettes. Avoir plein d'images, c'est bien, mais si personne ne dit lesquelles sont des voitures et lesquelles sont des motos, on ne saura jamais faire un classificateur voiture ou moto. C'est pour ça que les CAPTCHA vous font cliquer sur des feux rouges : on y reviendra. L'inconvénient du machine learning, c'est qu'il faut beaucoup de données.

À l'intérieur, les réseaux de neurones, qu'on appelle aussi deep learning parce qu'ils ont beaucoup de couches. Ils sont vaguement inspirés du cerveau. Nos neurones sont reliés par des synapses dont la force change quand on apprend ; une partie de ce câblage est là dès la naissance, le reste se forme toute la vie. Un cerveau, c'est environ 86 milliards de neurones, chacun relié à quelques milliers d'autres. Dans un réseau artificiel, chaque connexion porte un nombre, un « poids », qui imite cette force, et chaque neurone d'une couche est souvent relié à tous ceux de la couche suivante. Enfin, tout au centre, les grands modèles de langage, GPT et les autres : des réseaux de neurones avec une architecture précise, le Transformer, faite pour générer du texte. Chaque cercle est à l'intérieur du précédent.

> **Ce qui a été corrigé :** nos neurones ne sont pas « tous connectés entre eux » : chacun est relié à quelques milliers d'autres, et c'est dans les réseaux artificiels qu'une couche est souvent reliée à toute la suivante. Un réseau artificiel est vaguement inspiré du cerveau plutôt qu'il ne l'imite, et l'IA classique peut dépasser son professeur en vitesse (Deep Blue), sans jamais penser autrement que lui.

## 2.3 Football ou basket ?

**À retenir :** Classer des phrases par sport, c'est évident pour nous, et étonnamment dur à expliquer à un ordinateur.

Pour voir la différence entre tous ces mots, je vous propose un seul exemple simple, qui va nous suivre jusqu'aux modèles de langage : classer de courtes phrases, football ou basket. Quels mots vous mettent sur la piste ? Voici quelques phrases étiquetées pour chaque sport. Pour nous, c'est évident. Mais comment l'expliqueriez-vous à un ordinateur ?

## 2.4 Écrire la règle

**À retenir :** Des règles écrites à la main marchent jusqu'au jour où elles rencontrent un cas auquel personne n'avait pensé.

Première idée : écrire la règle nous-mêmes. C'est l'IA classique, et en fait c'est simplement un programme, une liste de mots-clés pour chaque sport. Résultat : juste sur 18 exemples sur 24. Une phrase de basket qui contient « kicked », shooté, et la règle répond football. Chaque exception demande une nouvelle règle écrite à la main, c'est fastidieux.

Avec beaucoup de temps et quelques astuces, un programme écrit à la main peut quand même avoir l'air magique. Un programme d'échecs ne peut pas explorer toutes les positions, et il a fallu beaucoup de génie pour choisir lesquelles explorer. Mais au final, ça reste du code écrit par des humains : de l'IA au sens large, de l'intelligence écrite à la main.

## 2.5 Apprendre la règle

**À retenir :** En machine learning, on donne des exemples étiquetés et l'ordinateur trouve la règle tout seul.

Et si l'ordinateur trouvait la règle lui-même ? C'est le machine learning classique. On lui donne beaucoup de phrases, chacune étiquetée par une personne, ici 24, et un programme construit tout seul son arbre de décision. Ces programmes existent depuis les années 1980 : dès qu'on a les données, ils le font seuls. Ici, l'arbre ne pose qu'un type de question : « la phrase contient-elle tel mot ? » Il a choisi la question qui sépare le mieux les exemples, puis il a recommencé. « Net », le filet ? Basket. Sinon, « hoop », le panier ? Basket. Sinon, football.

Résultat : juste sur 23 exemples sur 24, et personne n'a écrit cette règle. Sa seule erreur, c'est un dunk, où il n'y a ni filet ni panier. Ici ça a l'air simple. Les vraies méthodes sont plus complexes : elles optimisent mathématiquement, comptent quels mots apparaissent avec lesquels, et combinent des centaines d'arbres. Et ça marche beaucoup mieux : aujourd'hui encore, sur des données en tableau, les méthodes à base d'arbres restent les meilleurs outils, devant le deep learning.

## 2.6 Une règle étrange

**À retenir :** Une règle apprise peut être absurde, mais avec un arbre, on peut la voir avant qu'elle fasse des dégâts.

Regardons ce que cet arbre a vraiment appris. Voici une nouvelle phrase : « The striker smashed the ball into the back of the net », l'attaquant a envoyé le ballon au fond des filets. Lisez l'arbre : qu'est-ce qu'il va répondre ? Vous l'avez deviné, ça va rater. Pour nous, c'est du football ; l'arbre dit basket, parce que « net » s'allume, et qu'aucun exemple de football ne parlait de filet. La bonne nouvelle, c'est qu'on pouvait le voir à l'avance, simplement en ouvrant l'arbre.

Un cas réel, beaucoup plus grave. Aux États-Unis, un algorithme de santé très utilisé choisissait quels patients recevaient un suivi médical renforcé ; les outils de ce type concernent environ 200 millions de personnes par an. Il prédisait les dépenses de santé, comme indicateur des besoins. Or on avait historiquement dépensé moins pour les patients noirs, à maladie égale, et l'algorithme les jugeait donc en meilleure santé. Une fois le biais corrigé, la part de patients noirs sélectionnés passait de 17,7 % à 46,5 %. C'est l'étude d'Obermeyer et de ses collègues, publiée dans Science en 2019.

Deux leçons. Le biais venait des données du passé, et il ne portait jamais son nom : il n'y avait aucune règle « couleur de peau », seulement « dépenses passées », qui a l'air parfaitement innocent. Dans un petit arbre, on repère une règle bizarre ; les vrais systèmes en combinent des centaines, et là non plus, personne ne les lit. Mais un modèle qu'on peut inspecter permet de trouver le problème avant des années de dégâts, et pas après.

> **Ce qui a été corrigé :** l'exemple dicté, un hôpital dont l'arbre dirait « si la personne est de couleur, pas de soins intensifs », était inventé. Le cas réel (Obermeyer, 2019) est plus instructif : l'algorithme n'utilisait pas la couleur de peau, le biais passait par un indicateur neutre, le coût.

## 2.7 Un neural network

**À retenir :** Un réseau de neurones fait bien mieux que l'arbre, et ce qui en sort est toujours une probabilité.

Pour faire mieux que l'arbre, on prend un réseau de neurones. Ce que vous voyez est une vue simplifiée du vrai : 200 mots, 16 neurones, 3 249 connexions. À l'entrée, il y a autant de neurones que d'entrées. Pour une image, ce serait un neurone par pixel et par couleur, rouge, vert et bleu : une image de 224 pixels sur 224, c'est déjà 150 528 nombres. Pour des mots, il faut d'abord les transformer en nombres, on y viendra. Chaque connexion est un nombre, un poids : épaisse, elle est forte, et sa couleur dit si elle pousse vers football ou vers basket. Chaque neurone additionne ce qui lui arrive.

En sortie, autant de neurones que de classes, transformés en probabilités qui font 100 % au total. Ce ne sont que des maths, des multiplications et des additions, et ce qui sort est toujours une probabilité. Ici, la phrase piège donne football à plus de 99 %, juste cette fois. Quand c'est bien entraîné, on est souvent proche de 0 % ou de 100 %, et on prend la plus haute. Mais pas toujours : une phrase qui parle des deux sports pourrait donner 40 contre 60. Une entreprise peut alors se fixer une règle : si aucune réponse n'atteint 95 %, on considère qu'on ne sait pas, et on demande à un humain. Attention quand même, les réseaux sont souvent trop sûrs d'eux, et leur « 96 % » ne veut pas dire « juste 96 fois sur 100 ». Sur 200 nouvelles phrases, l'arbre a raison à 58 %, le réseau à 99,5 %. Mais d'où viennent tous ces poids ?

> **Ce qui a été corrigé :** un pixel, c'est rouge, vert et bleu (la dictée disait « rouge, jaune, blanc »). Le seuil de 95 % est une bonne pratique, à condition de savoir que les réseaux sont souvent trop confiants.

## 2.8 Comment un réseau apprend

**À retenir :** Apprendre, c'est ajuster un peu chaque poids après chaque exemple, des milliers de fois ; une fois entraîné, les poids sont figés.

C'est ce qu'on appelle la descente de gradient, et j'aime bien l'image d'un réseau routier, avec des routes plus ou moins larges. Après chaque trajet, on regarde où la voiture a fini et où elle aurait dû finir, et on élargit ou on rétrécit chaque route d'un tout petit peu, dans le sens qui l'aurait rapprochée de la bonne sortie. À force, n'importe quelle voiture qui entre arrive au bon endroit. Une autre image classique, c'est un randonneur dans le brouillard qui descend toujours dans le sens de la plus forte pente.

Au début, les poids sont aléatoires, donc le réseau répond au hasard. Sur une phrase de basket, il dit « football, 56 % ». On compare avec la bonne réponse, et l'écart, c'est l'erreur. On ajuste chaque connexion d'un peu, dans le sens qui aurait aidé, et sur la même phrase, il dit maintenant basket à 75 %. Il corrige ainsi à chaque exemple, pas seulement quand il se trompe : même une bonne réponse à 60 % est poussée vers 100 %. Puis on recommence sur des milliers de phrases : deviner, comparer, ajuster. Le score monte jusqu'à 99,5 %.

Un point clé à retenir : les poids ne changent que pendant l'entraînement. Au moment de la prédiction, ce qu'on appelle l'inférence, ils sont figés, et on peut y faire passer n'importe quoi. Un chatbot n'apprend pas de votre conversation pendant qu'il vous répond.

> **Ce qui a été corrigé :** la dictée disait qu'on change les poids « dès qu'il y a une erreur » ; en réalité, on les ajuste après chaque exemple, en mesurant l'écart avec la bonne réponse, même quand le réseau avait déjà raison.

## 2.9 Rien que des nombres

**À retenir :** On peut tester un réseau de neurones, mais on ne peut pas savoir à l'avance où il va se tromper.

Entraîné, précis. Et pourtant. Voici une nouvelle phrase de football, et le réseau répond basket, sûr de lui à 96 %. Ouvrons le capot. Tous les poids sont là, mais aucune ligne ne dit pourquoi, contrairement à la règle bizarre du « net » dans l'arbre. Sous le capot, c'est du charabia : à la fin, un réseau, c'est un bloc de nombres, et on ne sait pas les lire. En pratique, ça marche beaucoup mieux que le machine learning classique, mais il faut beaucoup plus de données et c'est plus lourd à entraîner ; c'est pour ça que le machine learning classique reste utile. On peut tester un réseau, mais on ne peut pas savoir à l'avance où il va se tromper. Des chercheurs commencent quand même à ouvrir la boîte : c'est l'interprétabilité, qui lit certains mécanismes à l'intérieur des grands modèles. C'est encore partiel, loin d'un contrôle complet, et on en reparlera dans « Ce qu'on peut y faire ».

> **Ce qui a été corrigé :** « on ne sait rien en tirer » est le point de départ, mais pas toute l'histoire : l'interprétabilité commence à lire certains mécanismes des grands modèles, même si c'est encore partiel.

## 2.10 Google Photos, 2015

**À retenir :** Personne n'a écrit de règle raciste : l'erreur est sortie de l'apprentissage, à partir de données qui avaient un trou.

Ce n'est pas qu'un problème de jouet. En juin 2015, Google Photos classe vos photos par type, paysage, chien, chat, avec un modèle appris. Et il étiquette des photos de deux personnes noires comme « gorilles ». Un utilisateur, Jacky Alciné, le découvre et le dit publiquement ; Google s'excuse en quelques heures. Mais Google ne retire pas la fonction : il bloque les étiquettes « gorille » et « chimpanzé ». En 2018, elles étaient toujours bloquées, et en 2023 encore, selon le New York Times. Des années plus tard, la solution était toujours de cacher le mot.

Il faut le dire clairement : le modèle n'a pas été conçu pour être raciste, et les ingénieurs ne sont pas racistes. Personne n'a écrit cette règle, l'erreur est sortie de l'apprentissage. Google n'a jamais publié la cause exacte, mais il y a deux suspects habituels. Le premier, ce sont des données biaisées : les données des dernières décennies reflètent une société qui discriminait davantage, et il y en a tellement, des millions d'images, des milliards de textes, que personne ne peut tout vérifier à la main. Les étiqueteurs ont eux aussi leurs biais. Or on voudrait que le modèle fasse mieux que ce passé. Le second, le plus probable ici, c'est la sous-représentation : très peu de personnes noires dans les images d'entraînement. C'est un problème bien connu en reconnaissance faciale. L'étude « Gender Shades », en 2018, a montré que des systèmes commerciaux se trompaient jusqu'à 34,7 % du temps sur les femmes à peau foncée, contre 0,8 % sur les hommes à peau claire. Alors, pourquoi aucun test ne l'a-t-il repéré avant la sortie ? Je vais vous l'expliquer avec des pommes et des poires.

> **Ce qui a été corrigé :** Google n'a pas retiré la fonction, il a bloqué les étiquettes ; et rien ne montre un modèle réentraîné ensuite, puisque les étiquettes étaient encore bloquées en 2023.

## 2.11 Pommes et poires

**À retenir :** L'examen blanc ne vérifie que ce qui est dans les données : un manque dans les données n'apparaît qu'à l'examen final, le monde réel.

Une expérience de pensée. Imaginons une pile d'images qui ne contient que des pommes rouges et des poires vertes, chacune étiquetée par une personne. Avant d'entraîner le modèle, on répartit ces images dans deux boîtes, comme à l'école. La première, l'entraînement, ce sont les exercices du TP, avec leur correction : le modèle apprend dessus. La seconde, le test, on la met de côté, en général 10 à 20 % des données, et le modèle ne la voit jamais pendant l'entraînement : c'est l'examen blanc. Et l'examen final, c'est la production, le monde réel, où il n'y a plus de corrigé.

Pourquoi mettre des données de côté ? Parce qu'un modèle peut apprendre les réponses par cœur, c'est l'overfitting, le surapprentissage. C'est l'élève qui connaît par cœur les réponses de son TP, a l'impression de tout réussir, et se plante à l'examen. L'élève veut réussir son examen ; le modèle veut un bon score sur son test. L'examen blanc sert justement à détecter l'apprentissage par cœur avant le vrai examen.

Ici, la couleur suffit à séparer parfaitement les deux fruits, alors le modèle prend le raccourci : vert, c'est poire. Attention, rappelez-vous : un vrai modèle est un réseau de neurones, et sa règle n'est faite que de nombres. Ce « vert, c'est poire », personne ne pourrait le lire à l'avance ; on ne le découvre qu'en testant. Et le test donne 100 %, honnêtement, parce qu'il vient de la même pile que les exercices, avec les mêmes trous. Puis arrive dans le monde réel la première pomme verte : « poire », sûr à 97 %. On ne peut pas en vouloir au modèle, rien dans ses données ne lui disait le contraire. Mais on peut en vouloir à qui le met en production sans avoir cherché les cas rares. Un test ne peut vérifier que ce que la pile contient, et un manque dans les données n'apparaît que dans le monde réel. Les vrais jeux de données ont le même genre de trous, avec des personnes : c'est ce que montrait « Gender Shades », et c'est exactement ce qui est arrivé à l'application photo, découvert par ses utilisateurs après la sortie. La solution est dans les données : chercher ce qui manque, le collecter, et tester sur les cas qui comptent dans le monde réel.

> **Ce qui a été corrigé :** la dictée mélangeait deux jeux de données mis de côté et promettait qu'avec un examen refait juste avant, on est sûr de réussir en production. La slide n'en garde qu'un, le test, qui est l'examen blanc ; l'examen final, c'est la production, et le test ne protège que de ce que la pile contient.

## 2.12 Prédire le mot suivant

**À retenir :** Un modèle de langage, c'est le même classificateur, qui choisit le mot suivant parmi des dizaines de milliers au lieu de deux sports.

Maintenant, les mêmes idées appliquées au langage. Football ou basket, c'était un choix entre deux étiquettes. Un modèle de langage fait exactement le même choix, sauf que l'entrée est un début de phrase, et que l'étiquette à trouver, c'est le mot suivant. Parmi combien de possibilités ? Pas tous les mots d'une langue, mais le vocabulaire du modèle : environ 50 000 morceaux pour GPT-2 et GPT-3, environ 128 000 pour Llama 3. On ne parle d'ailleurs pas de mots mais de tokens : les mots courts sont des tokens entiers, les mots longs ou inconnus sont découpés en morceaux. On y arrive dans deux slides.

Regardez les deux barres devenir une longue liste. Ce sont de vraies probabilités, enregistrées sur un vrai modèle, et c'est beaucoup moins noir ou blanc qu'avec les sports : « Windows » gagne clairement, mais il est loin de 99 %. Ici, on prend le plus probable. On pourrait aussi tirer au sort, en pondérant par la probabilité, pour être un peu plus créatif : c'est le rôle de la température, on y viendra. On prend « Windows », on l'ajoute à la phrase, et on recommence : prédire le mot suivant, encore et encore. C'est comme ça qu'on génère du texte.

> **Ce qui a été corrigé :** les « 50 000 mots qui existent » sont en fait la taille du vocabulaire de tokens du modèle, d'environ 50 000 pour GPT-2 et GPT-3 à environ 128 000 pour Llama 3, et pas le nombre de mots d'une langue.

## 2.13 Deux super-pouvoirs, un pari

**À retenir :** Deux super-pouvoirs (il écrit, et tout texte devient une donnée d'entraînement gratuite) plus un pari : l'échelle. Le pari a payé.

Ce simple changement donne deux super-pouvoirs. Le premier : il écrit. Un classificateur donne une réponse et s'arrête. Ici, la réponse est le mot suivant, donc on peut la remettre en entrée et continuer, encore et encore. Une partie du calcul est même gardée en mémoire, si bien que chaque nouveau mot ne refait pas tout.

Le second : des données presque illimitées. Souvenez-vous, une donnée, c'était un texte et son étiquette, football, ou une image et sa catégorie, chat, et quelqu'un devait l'étiqueter. Qui a déjà cliqué sur des feux rouges dans un CAPTCHA ? Ces clics ont servi à étiqueter des images ; Google dit que ça a aidé à améliorer Maps. Pour le texte, plus besoin de cliquer sur des feux rouges. La donnée brute, c'est le début de la phrase, et l'étiquette, c'est le mot qui suit. On prend une énorme partie filtrée du web, des livres, du code, et on a les données et leurs étiquettes, gratuitement.

Et le pari, c'est l'échelle : mettre énormément d'argent, d'électricité et de données. En 2020, les « lois d'échelle » ont montré que l'erreur baisse de façon prévisible avec la taille du modèle, les données et le calcul. Pourquoi faut-il autant d'échelle ? Parce que si le modèle n'est pas tout à fait bon, il suffit d'un mot bizarre : les mots suivants s'appuient dessus, et ça s'emballe jusqu'au n'importe quoi. On le verra avec la température à 5 sur le modèle de base. GPT-2, avec 1,5 milliard de nombres, disait parfois n'importe quoi ; GPT-3, avec 175 milliards, cent fois plus gros, écrit soudain de façon convaincante. Même recette, en plus grand. Le pari a payé.

> **Ce qui a été corrigé :** on n'entraîne pas sur « tout Internet » mais sur une partie filtrée du web, avec des livres et du code. Et la démonstration de la température à 5 vient plus loin, avec le modèle de base : « on le verra », pas « on l'a vu ».

## 2.14 Comment fonctionne l'entraînement

**À retenir :** L'entraînement, c'est la même boucle sur le mot suivant, des milliers de milliards de fois, et le modèle apprend ce qui est plausible, pas une seule bonne réponse.

Alors, comment apprend-il de tout ce texte ? C'est la même boucle que pour le football et le basket : deviner, comparer, ajuster, recommencer. Sauf que la réponse est maintenant le mot suivant. On prend un vrai texte et on s'arrête quelque part : « Every morning the children take the ___ to school », chaque matin, les enfants prennent le ___ pour aller à l'école. Le vrai texte dit « bus ». Au début, le modèle est aléatoire, et le bon mot a environ une chance sur 50 000. On compare avec le vrai mot, c'est l'erreur, et on ajuste chaque nombre d'un tout petit peu.

Et là, il y a un paradoxe. Cet exemple punit tous les mots qui ne sont pas « bus », alors que « tram » ou « train » auraient très bien convenu ; seul un mot comme « canapé » était vraiment faux. Dans la vraie vie, il n'y a souvent pas une seule bonne réponse. Mais sur des millions de phrases, « bus » et « tram » reviennent tous les deux, et le modèle apprend une répartition de mots plausibles, par exemple bus à 40 %, tram à 15 %, plutôt qu'une réponse unique. C'est différent de nos classificateurs, où, sauf pour une phrase qui parle des deux sports, il n'y a qu'une bonne réponse : ici, être loin de 99 %, c'est normal. Le modèle ne cherche pas la bonne réponse, il apprend ce qui est plausible. C'est aussi pour ça qu'il peut dire quelque chose de plausible mais faux.

Puis on avance d'un mot, et on passe à d'autres textes : le web, des livres, du code. Llama 3 a été entraîné sur environ 15 000 milliards de tokens. Et pas seulement des pages web : beaucoup de code, environ 17 % de ses textes d'entraînement. Le code est un texte strict et structuré, exactement la précision dont ont besoin les appels d'outils du chapitre 1, et des chercheurs ont mesuré qu'en ajouter au pré-entraînement améliore aussi le raisonnement.

> **Ce qui a été corrigé :** Llama 3 a été entraîné sur environ 15 000 milliards de tokens (la dictée disait « 15 tokens »).

## 2.15 Les tokens

**À retenir :** Un modèle ne lit ni des lettres ni des mots, mais des morceaux de mots, les tokens : c'est pour ça que compter les lettres était difficile.

Mais un ordinateur ne lit pas des mots. Le modèle lit des tokens : un mot entier, un morceau de mot, ou parfois une espace et une lettre. Pourquoi pas des lettres ? Il y en aurait peu, mais une lettre n'a presque pas de sens. Pourquoi pas des mots entiers ? Il y en aurait beaucoup trop, surtout pour toutes les langues. Les tokens sont le compromis : la méthode part des lettres et fusionne les paires les plus fréquentes, si bien que les mots courants font un seul token et que les mots rares sont découpés en morceaux.

Le mieux, c'est de jouer : donnez-moi un mot ou une phrase, je la tape, et vous pouvez aussi essayer sur votre téléphone, dans l'onglet « Essayer ». Et revenons à l'énigme du début. Tapons « strawberry » et regardons comment il est découpé. Le modèle ne voit jamais les lettres de « strawberry », seulement des numéros de tokens. Voilà pourquoi il avait tant de mal à compter les r. Chaque token a donc un numéro dans un dictionnaire fixe, mais ce numéro ne dit encore rien du sens.

## 2.16 Pourquoi tant de nombres

**À retenir :** Les mots ont trop de sens pour un ou deux nombres : les modèles donnent à chaque mot des centaines de nombres, appris dans les textes.

Un numéro n'a pas de sens. Pour calculer avec des mots, un modèle a besoin de nombres qui en ont. Essayons d'abord avec un seul nombre par mot : sa place sur une ligne. Les couleurs d'un côté, les fruits de l'autre. « Orange », qui est à la fois une couleur et un fruit, se met au milieu, et la ligne s'en sort. Mais « saumon » est une couleur et un poisson : il devrait être près des couleurs et près de la mer, et sur la ligne, il n'y a pas de place pour la mer.

Ajoutons un deuxième nombre, donc une deuxième direction. Maintenant « saumon » peut se poser entre les couleurs et la mer. Et « pêche », le fruit mais aussi la pêche en mer, se pose entre les fruits et la mer. Seulement, prenez « bleu » : c'est une couleur, c'est la mer, c'est le ciel, et c'est aussi le bleu qu'on se fait en se cognant. À mi-chemin de tout, il n'est près de rien. Un mot a tellement de sens différents qu'un nombre ne suffit pas, et deux non plus.

Alors les modèles donnent à chaque mot des centaines, voire des milliers de nombres : 384 dans la carte qu'on va voir, 4 096 dans Llama 3.1 8B, 16 384 dans Llama 3.1 405B. Et personne ne nomme ces directions : c'est l'entraînement qui les fixe, et les mots employés dans les mêmes phrases finissent proches les uns des autres. Par honnêteté, les positions sur cette slide sont inventées, et un modèle numérote en réalité des tokens, pas des mots. La vraie carte, c'est la slide suivante.

## 2.17 Les mots comme des points

**À retenir :** Chaque mot devient un point dans l'espace, et l'entraînement sur d'énormes quantités de texte rapproche les mots liés.

Un réseau de neurones ne calcule qu'avec des nombres : des multiplications, des additions, puis une probabilité entre 0 et 1. Les 0,1 %, 1 % et 98 % qu'on a vus tout à l'heure sont le résultat de vrais calculs, donc les mots doivent devenir des nombres. Et on veut que des sens proches aient des nombres proches, comme un pixel rouge et un pixel rouge foncé ont des valeurs proches : alors les calculs ont du sens. Notre classificateur de sports savait seulement si un mot était là ou pas. Ici, on donne à chaque mot une liste de nombres, c'est-à-dire un point dans l'espace.

Comme on est en machine learning, personne ne place les mots à la main. Avant l'entraînement, les points sont dispersés au hasard. Puis la boucle d'entraînement qu'on a vue, répétée sur d'énormes quantités de texte, rassemble les mots qui apparaissent dans les mêmes phrases. « Bleu » finit près de « ciel » et de « rouge », parce qu'ils reviennent souvent ensemble, pas forcément sur les mêmes pages. On connaît un mot par ses fréquentations. L'animation est illustrative, mais la carte finale est réelle.

> **Ce qui a été corrigé :** un pixel se code en rouge, vert et bleu (la dictée disait « rouge, jaune, bleu »).

## 2.18 Jouer avec la carte

**À retenir :** La proximité de sens devient une distance qu'on peut mesurer, dans des centaines de dimensions que personne n'a choisies.

Explorons la carte avec vos mots. Donnez-moi un métier, un lieu, une émotion : je le tape, et il est calculé en direct par le même modèle. On lit ses plus proches voisins, et quand un voisin vous surprend, c'est souvent un mot qu'on emploie dans les mêmes phrases. La carte peut aussi passer en 3D : plus d'axes pour jouer, juste pour montrer l'idée.

Ce modèle donne à chaque mot 384 nombres, c'est-à-dire 384 façons d'être voisin d'un autre mot. Personne ne saurait régler ça à la main, et c'est comme ça qu'on encode le sens et les liens entre les mots. Les plus grands modèles en utilisent bien plus : 4 096 nombres par token pour Llama 3.1 8B, 16 384 pour Llama 3.1 405B. Nous, on ne sait pas se représenter plus de trois dimensions. Les cartes en 2D et en 3D sont donc une projection, qui essaie de garder les proches voisins de chaque mot. Les distances entre des groupes éloignés et les axes ne veulent rien dire, et certains vrais voisins peuvent apparaître loin. La liste est exacte ; la carte est une approximation.

Et le problème de « pêche » ? Dans un vrai chatbot, le point de départ de « pêche » est le même dans toutes les phrases. Ce sont les couches suivantes du modèle qui le déplacent selon le contexte : « une pêche » à manger le pousse vers les fruits, « la pêche » au bord de l'eau vers la mer.

> **Ce qui a été corrigé :** la carte ne montre pas « les dimensions les plus évidentes » : c'est une projection (UMAP) qui garde les voisins proches, pas les axes. Et le double sens de « pêche » se règle surtout par le contexte, dans les couches suivantes du modèle, pas seulement par le nombre de dimensions.

## 2.19 Un base model

**À retenir :** Un modèle tout juste pré-entraîné ne répond pas, il continue le texte ; la température règle la part de hasard qu'il prend.

Alors, que sort-il de tout cet entraînement ? Ce qu'on vient de décrire, c'est le pré-entraînement : la boucle du mot suivant, sur une énorme quantité de texte, rien de plus. Le modèle qui en sort, Llama 3.1 8B de Meta, tourne ici sur Hugging Face, la bibliothèque publique où l'on partage des modèles d'IA : retenez ce nom. Posons-lui une question. Ça marche, il écrit un texte fluide, mais quelque chose cloche : il continue la page au lieu de répondre. Donnez-lui un QCM, il ajoute d'autres questions. Il n'a aucune notion de conversation, d'assistant, ni de ce qu'il ne devrait pas dire. Il n'est ni utile ni nuisible : il imite du texte plausible.

C'est le moment de jouer avec la température. À 0, on prend toujours le mot le plus probable, donc on obtient presque toujours le même texte, puisque les calculs sont déterministes (sur les serveurs, un mot peut quand même changer de temps en temps). À 1, on tire au sort de manière pondérée : si « chat » est à 30 %, il sort environ une fois sur trois. Plus on monte, plus les chances s'aplatissent et plus des mots bizarres sortent. Essayons 5 : très vite, ça ne veut plus rien dire. C'est la démonstration de ce que je vous annonçais : si le modèle n'est pas assez bon, un mot bizarre entraîne le suivant, et ça part en cacahuète.

> **Ce qui a été corrigé :** à température 0, le texte est presque toujours le même, pas toujours, à cause de petites différences de calcul sur les serveurs. Et mieux vaut ne pas taper la question de la bombe en direct au modèle de base : la slide suivante montre un refus enregistré.

## 2.20 Un assistant après fine-tuning

**À retenir :** Le même modèle, entraîné en plus sur des conversations et nourri d'un texte caché : c'est ça qui fait un chatbot.

Alors, comment devient-il un assistant ? Voici le même modèle, entraîné en plus sur des questions et des réponses : Llama 3.1 8B Instruct, la version assistant du modèle de base qu'on vient d'utiliser. Posons-lui les mêmes questions : maintenant, il répond, de façon cohérente. Il a été entraîné à se comporter en assistant, d'abord avec des exemples de conversations, puis avec des récompenses pour les réponses que les gens préfèrent. Un fait frappant : les gens préféraient les réponses d'un assistant de 1,3 milliard de paramètres à celles de GPT-3 brut, 175 milliards, cent fois plus gros. Ce n'est donc pas qu'une question de taille.

Il est aussi entraîné à refuser certaines demandes, et l'exemple de refus que vous voyez est un vrai refus enregistré, sur la question de la bombe. Mais les refus sont appris, et l'apprentissage peut échouer : les grands assistants ajoutent beaucoup plus d'entraînement de sécurité et de filtres. Et puis il y a ce que le modèle lit vraiment, et que vous ne voyez jamais : un prompt système caché, des balises de rôle, votre question, puis « assistant: », et il continue le texte. C'est toujours de la prédiction du mot suivant. Il écrit la réponse, puis une balise de fin qui dit au logiciel de s'arrêter.

## 2.21 Comment on façonne un assistant

**À retenir :** Un assistant, c'est un modèle pré-entraîné façonné par trois couches (des exemples, des règles écrites, des classificateurs), et aucune ne suffit seule.

Mais les exemples ne sont pas les seuls à le façonner. Partons du même modèle pré-entraîné : trois couches en font un produit. La première, ce sont des exemples : beaucoup de conversations, pour qu'il soit récompensé quand il se comporte en assistant, et récompensé pour des valeurs et des comportements humains. La deuxième, ce sont des règles écrites. Certaines entreprises, pas toutes, publient une constitution, comme Anthropic, ou une Model Spec, une spécification du modèle, comme OpenAI, et le modèle est entraîné à la suivre. On y trouve par exemple, dans les deux, l'interdiction d'aider à créer des armes chimiques, biologiques, radiologiques ou nucléaires. Elles lui demandent aussi de rester gentil et honnête, et de ne pas vous flatter juste pour vous plaire : c'est ce qu'on appelle la sycophancy, la complaisance.

Et la complaisance est bien réelle. En avril 2025, OpenAI a retiré une mise à jour de GPT-4o parce qu'elle flattait trop les utilisateurs. Un modèle récompensé pour être apprécié apprend à dire ce qu'on veut entendre. C'est le premier exemple, encore inoffensif, d'une idée qui reviendra au chapitre des risques : l'IA fait ce qu'on a récompensé, pas forcément ce qu'on voulait.

La troisième couche, ce sont des classificateurs : des modèles séparés, comme notre classificateur de sports, qui vérifient votre question avant même qu'elle atteigne le modèle, et la réponse avant qu'elle vous arrive. Ils peuvent bloquer l'une ou l'autre. À quelle couche feriez-vous le plus confiance ? Aucune ne suffit seule. Et cela nous amène à la question suivante : qui construit ces modèles ?

> **Ce qui a été corrigé :** les classificateurs ne contrôlent pas seulement la question à l'entrée, ils vérifient aussi la réponse avant qu'elle arrive à l'utilisateur.

# Chapitre 3 : Qui la construit

## 3.0 Qui la construit

**À retenir :** Une poignée de laboratoires, une course entre eux, et une course aux puces.

On sait maintenant ce que l'IA sait faire et comment elle marche. Reste à savoir qui la fabrique, et pourquoi tout va si vite.

## 3.1 Qui construit tout ça

**À retenir :** Une chaîne complexe mais peu d'acteurs, dont certains en quasi-monopole, menés par des gens qui ne s'entendent pas : c'est là que la course commence.

Cette slide veut montrer trois choses à la fois. D'abord, que la structure est complexe : des machines qui fabriquent les puces, des usines de puces, des concepteurs de puces, des data centres, et tout en haut les laboratoires. Ensuite, que malgré cette complexité, il n'y a pas tant d'acteurs que ça. Et enfin que certains sont en quasi-monopole. Presque tous les grands laboratoires sont américains, avec la Chine juste derrière : en 2024, les institutions américaines ont produit 40 modèles marquants, la Chine 15 et l'Europe 3, selon le Stanford AI Index. Si une partie de l'histoire se passe à Londres, c'est grâce à DeepMind, fondé là-bas en 2010 et racheté par Google en 2014.

Puis vient le drama. En 2015, Sam Altman écrit à Elon Musk qu'il serait bien que « quelqu'un d'autre que Google » arrive le premier à une IA très puissante. OpenAI naît en décembre 2015, comme une association à but non lucratif, un contrepoids à Google. Très vite, les fondateurs se disputent le contrôle : selon OpenAI, Musk voulait en 2017 la majorité du capital, le contrôle du conseil et le poste de CEO. Il quitte le conseil en février 2018, et Altman devient CEO en 2019, l'année où OpenAI crée une société à profit plafonné et reçoit un milliard de dollars de Microsoft. Dario Amodei, alors vice-président de la recherche chez OpenAI, part fin 2020 et cofonde Anthropic en 2021 avec d'autres anciens d'OpenAI, un laboratoire centré sur la sécurité. Créé pour la bonne cause, mais le marché le pousse dans la même course que les autres. En juillet 2023, Musk lance xAI, qui fait Grok (il avait racheté Twitter, devenu X, en 2022). Entre-temps, ChatGPT est sorti en novembre 2022 ; le 17 novembre 2023, le conseil d'OpenAI renvoie Altman en disant qu'il « n'a pas été constamment franc » avec lui. Cinq jours plus tard, Altman revient comme CEO, avec un nouveau conseil : des quatre membres qui l'avaient renvoyé, un seul reste. Au final, c'est lui qui gagne. Tout ça se passe presque trois ans après le départ d'Amodei. Depuis 2024, Musk attaque OpenAI en justice ; en février 2025, il propose même environ 97,4 milliards de dollars pour la racheter, offre refusée.

Pourquoi raconter tout ça ? Parce que ces gens ne s'aiment pas, et que cette rivalité accélère la course. Tout ce que je vais dire ensuite sur les risques en est aggravé. Qu'il s'agisse de personnalités très mégalos, c'est mon avis, et je le dis comme tel : les faits parlent d'eux-mêmes.

Le reste du paysage s'allume ensuite. Meta. Mistral AI, en France, cofondé en 2023 par Arthur Mensch, passé par DeepMind à Paris, et deux anciens chercheurs de Meta : le principal laboratoire européen, beaucoup plus petit. Les laboratoires chinois, DeepSeek, Qwen (Alibaba), Moonshot AI (Kimi) et Z.ai (Zhipu), qui publient leurs modèles en open weight : n'importe qui peut les télécharger et les faire tourner. Et en bas de la chaîne, les quasi-monopoles. NVIDIA conçoit les puces, environ 92 % des GPU de data center en 2024. TSMC, à Taïwan, les fabrique : environ 72 % du chiffre d'affaires des dix plus grandes fonderies au deuxième trimestre 2026. Et ASML, aux Pays-Bas, est le seul fabricant au monde des machines EUV sans lesquelles on ne grave pas les puces les plus avancées. Ma question à la salle : où est le pouvoir dans cette chaîne ?

> **Ce qui a été corrigé :** il ne faut pas dire que « pratiquement tout est américain » : la Chine est juste derrière. Musk a quitté le conseil en 2018, et Altman n'est devenu CEO qu'en 2019. Amodei est parti fin 2020, bien avant le renvoi d'Altman (novembre 2023). Ce que Musk a fondé ensuite, c'est xAI (Grok) ; X, c'est Twitter, qu'il avait racheté en 2022.

## 3.2 La dynamique de course

**À retenir :** Même ceux qui veulent être prudents font la course, parce que ralentir seul ressemble à perdre : un dilemme du prisonnier.

Pourquoi tout le monde va-t-il si vite, même ceux qui disent vouloir être prudents ? Le dilemme du prisonnier l'explique bien. Prenez deux laboratoires. Chacun peut prendre son temps ou foncer. Si l'autre ralentit, foncer me fait gagner ; s'il fonce, je ne peux pas rester derrière. Quoi que fasse l'autre, foncer paraît donc la meilleure option. Résultat : les deux foncent, et c'est pire pour les deux que s'ils avaient pris leur temps ensemble.

C'est comme ça qu'un laboratoire fondé pour la sécurité finit lui aussi par faire la course, poussé par ses investisseurs et par le marché. Les sorties existent : des accords, des normes communes, de la vérification. Certains contestent qu'il y ait une course ; le gouvernement américain, lui, parle explicitement de « gagner la course à l'IA » dans son plan d'action de juillet 2025.

# Chapitre 4 : Les risques

## 4.0 Les risques

**À retenir :** Puissants, opaques et construits dans une course : pourquoi les risques sont la question suivante.

Des systèmes puissants, que personne ne comprend vraiment de l'intérieur, construits dans une course : il est temps de parler des risques.

## 4.1 Trois familles de risques

**À retenir :** Trois familles de risques, de la plus concrète à celle qui sonne comme de la science-fiction : les abus, les effets systémiques, la perte de contrôle, souvent mêlés.

Je range les risques en trois familles, que je vais présenter de la plus concrète à celle qui sonne le plus comme de la science-fiction. Les abus, quand quelqu'un se sert de l'IA pour nuire. Les effets systémiques, quand personne ne veut de mal et que la société bascule quand même. Et la perte de contrôle, quand le système lui-même poursuit le mauvais but. Dans la réalité, c'est rarement l'un ou l'autre : c'est souvent un mélange. Avec tout ce qu'on a vu aujourd'hui, j'espère vous montrer que même la dernière famille n'est pas si farfelue. Ce qui sonnait comme de la science-fiction il y a cinq ans est sur nos téléphones aujourd'hui.

## 4.2 Qui s'inquiète le plus ?

**À retenir :** Les experts sont plus optimistes que le public, et pourtant beaucoup de chercheurs en IA donnent une vraie chance à la catastrophe : un peu d'humilité s'impose.

Qui s'inquiète le plus ? Le grand public s'inquiète surtout de l'IA au quotidien. Selon le Pew Research Center (2025), 51 % des adultes américains sont plus inquiets qu'enthousiastes, contre 15 % des experts en IA. Les experts, plus proches de la technologie et de ses bénéfices, sont plus optimistes pour les années qui viennent. Et pourtant, quand on interroge les chercheurs qui construisent l'IA (2 778 chercheurs, Grace et al., fin 2023), entre 38 % et 51 % d'entre eux, selon la formulation de la question, donnent au moins une chance sur dix à des issues aussi graves que l'extinction humaine. En gros, un sur deux.

Le but de cette slide, c'est l'humilité. C'est un sujet très complexe, et il est très facile de rester dans sa bulle et de se dire que c'est de la science-fiction. Mais y réfléchir, c'est le métier de chercheurs, et de beaucoup de philosophes, et la plupart d'entre eux ne disent pas que le risque est nul. Pensez à la ceinture de sécurité : il ne se passera peut-être rien, vous n'aurez sans doute jamais d'accident de voiture, et pourtant ce n'est pas bête de vous attacher, parce que ça peut vraiment arriver. Dire « le risque est de 0 % », ce n'est pas ce que disent les chercheurs, et c'est précisément pour ça qu'il faut y travailler.

Un regard en arrière, pour finir. Vers 2013, Vincent Müller et Nick Bostrom ont demandé à des experts en IA quand ils voyaient une chance sur deux d'avoir une machine capable de faire la plupart des métiers humains : la réponse médiane était 2040, et Bostrom l'a rapportée dans *Superintelligence* en 2014. À l'époque, certains trouvaient ces questions dignes de la science-fiction. Ça me fait penser à *1984* d'Orwell, publié en 1949, qui imaginait une surveillance de masse : ça sonnait comme de la fiction, et c'est en partie arrivé. Une analogie, pas une preuve.

> **Ce qui a été corrigé :** le livre sur la surveillance de masse publié en 1949, c'est *1984* de George Orwell, pas Jean Jaurès (mort en 1914). Le chiffre de 2040, chez Bostrom, est la date médiane d'une IA de niveau humain, pas d'un scénario catastrophe. « Un sur deux » est un arrondi : c'est entre 38 % et 51 % selon la question posée.

## 4.3 Les usages malveillants

**À retenir :** L'IA abaisse le niveau nécessaire pour nuire, des cyberattaques à la biologie : la défense doit garder une longueur d'avance.

Commençons par ce qui est le plus facile à imaginer : quelqu'un utilise l'IA pour nuire. Restons simples, avec deux exemples. Le premier, ce sont les cyberattaques. Aujourd'hui, tout est connecté, y compris des choses vitales comme les hôpitaux. En juin 2024, une attaque par rançongiciel contre Synnovis, un laboratoire d'analyses, a perturbé des hôpitaux londoniens : plus de 10 000 consultations et 1 700 opérations reportées. Or l'IA est devenue très forte pour trouver des failles. Dans certaines compétitions, elle rivalise avec les meilleurs chasseurs de failles humains : en juin 2025, une IA autonome a atteint la première place du classement américain des chasseurs de failles de HackerOne, et au concours de la DARPA, des systèmes d'IA ont trouvé 18 vraies failles inconnues. Et surtout, on peut la copier à l'infini : des milliers de copies infatigables peuvent passer au peigne fin du vieux code oublié et déterrer des failles tellement enfouies que personne n'aurait eu le temps d'aller les chercher. Les attaquants s'en servent déjà : en novembre 2025, Anthropic a rapporté qu'un groupe qu'elle estime soutenu par l'État chinois avait fait réaliser 80 à 90 % d'une campagne d'espionnage par son IA.

D'où un conseil très concret : quand on vous propose une mise à jour, faites-la, toujours. Les éditeurs ne peuvent pas écrire noir sur blanc « attention, grave faille de sécurité » tant que tout le monde n'a pas mis à jour, sinon ils indiqueraient la cible aux attaquants. Et le temps presse : en 2023, il ne fallait plus qu'environ cinq jours en moyenne entre la publication d'une faille et son exploitation.

Le second exemple, ce sont les armes biologiques et chimiques. On sait manipuler le vivant, et les modèles en savent beaucoup : en 2025, l'AI Security Institute britannique a constaté qu'ils battaient des docteurs en biologie sur des questions de connaissances, même si savoir ne suffit pas, loin de là. Des articles de recherche montrent le double usage : en 2022, une IA de découverte de médicaments, simplement retournée pour récompenser la toxicité, a proposé environ 40 000 molécules potentiellement toxiques en moins de six heures. En 2025, une équipe de Microsoft a montré dans *Science* que des outils d'IA pouvaient réécrire des toxines connues de façon à ce que les logiciels de contrôle des commandes d'ADN ne les reconnaissent plus, jusqu'à ce que des correctifs soient faits. Ce sont des études sur ordinateur, rien n'a été fabriqué, mais c'est inquiétant, parce qu'on peut commander des séquences d'ADN en ligne et que le contrôle de ces commandes reste largement volontaire. Et la nature n'optimise pas le pire : pour un virus, tuer son hôte trop vite est souvent une mauvaise stratégie (c'est une idée débattue en biologie). Un agent conçu exprès n'aurait pas cette limite. Quant au COVID, son origine reste à ce jour non élucidée.

Que faire ? Beaucoup répondent : avoir une meilleure défense que l'attaque. Donner d'abord les modèles les plus puissants aux défenseurs, et protéger ces modèles contre le vol. Un mot enfin sur l'usage militaire, qui relève d'une autre discussion mais qu'il faut nommer : l'IA guide déjà des drones dans la guerre en Ukraine, et l'Assemblée générale de l'ONU a voté sa première résolution sur les armes létales autonomes en décembre 2023. Et il n'y a pas que l'intention : les accidents comptent aussi.

> **Ce qui a été corrigé :** les études ne montrent pas que l'IA « fabrique des pathogènes que les experts ne détectent pas ». Elles montrent qu'une IA a pu réécrire des toxines connues pour échapper aux logiciels de contrôle des commandes d'ADN (sur ordinateur, avant correctif), et qu'une IA a proposé des milliers de molécules toxiques. Inutile de désigner un pays pour la commande d'ADN : le problème, c'est que le contrôle est surtout volontaire, partout. L'IA « aussi forte que les experts » en cybersécurité est vraie dans certaines compétitions, pas en général.

## 4.4 Les effets systémiques

**À retenir :** Le mal peut venir sans méchant : l'emploi, le pouvoir, nos compétences et notre voix basculent alors que chacun agit raisonnablement.

Deuxième famille : il n'y a pas de méchant. Beaucoup de choix raisonnables s'additionnent en un résultat que personne n'a voulu. L'emploi, d'abord : certains métiers rétrécissent, beaucoup changent, et les économistes ne sont pas d'accord sur l'ampleur. Le pouvoir, ensuite : une poignée d'entreprises construisent les meilleurs modèles. Et si l'IA fait le travail, il y a moins de gens pour refuser un ordre ou lancer l'alerte : dans une entreprise ou dans un État, les lanceurs d'alerte sont un contre-pouvoir, et ce contre-pouvoir peut disparaître. Nos compétences, aussi : des premières études suggèrent qu'on réfléchit moins par soi-même quand on s'appuie sur l'IA.

Et enfin notre voix. Il y a une analogie que je trouve parlante : la malédiction des ressources. Les pays qui vivent essentiellement de leurs ressources naturelles, comme le pétrole, ont moins besoin du travail et des impôts de leur population, et beaucoup d'entre eux comptent parmi les moins démocratiques (c'est ce qu'a montré Michael Ross en 2001). Des chercheurs ont appliqué la même logique à l'IA, sous le nom de « malédiction de l'intelligence ». Aujourd'hui, si on n'est pas content d'un gouvernement ou d'un employeur, on peut faire grève : notre travail est notre levier. Le jour où l'IA fait le travail, même avec un revenu universel qui a l'air tout rose sur le papier, ce levier disparaît. Si le pouvoir fait n'importe quoi, on n'a plus de quoi peser.

## 4.5 AGI : y sommes-nous ?

**À retenir :** L'AGI n'a pas de définition unique, mais l'IA d'aujourd'hui apporte déjà le savoir-faire des meilleurs experts dans tous les domaines, copiable à l'infini.

AGI veut dire *artificial general intelligence*, l'intelligence artificielle générale. C'est un objectif que plusieurs laboratoires affichent ouvertement. OpenAI la définit dans sa charte comme des « systèmes hautement autonomes qui surpassent les humains dans la plupart des travaux à valeur économique ». Est-ce qu'on y est ? Je vous laisse lever la main ; les experts eux-mêmes ne sont pas d'accord, en partie parce que les définitions diffèrent.

On pourrait se dire que c'est de la science-fiction, puisque ces modèles ne sont entraînés que sur nos données. Mais c'est déjà le savoir des meilleurs experts, dans tous les domaines à la fois, et on peut le copier à l'infini : rien que ça, c'est déjà très loin. Comment pourrait-elle devenir plus intelligente que nous si elle apprend de nos données ? Personne n'a de réponse complète. Une piste : elle peut apprendre du monde, pas seulement de nos textes. AlphaFold, qui prédit la forme des protéines, a valu le prix Nobel de chimie 2024. On peut imaginer, et c'est ma spéculation, une IA qui tire du sens de mesures scientifiques que nous ne savons pas interpréter. L'autre piste, c'est l'auto-amélioration récursive.

## 4.6 La superintelligence

**À retenir :** Une superintelligence n'aurait pas besoin d'être méchante pour nous nuire, comme nous ne détestons pas les fourmis sur lesquelles nous marchons.

Si une IA peut améliorer la recherche en IA, elle produit une meilleure IA, qui l'améliore encore plus vite. C'est l'idée d'auto-amélioration récursive, et elle est ancienne : dès 1965, le mathématicien I. J. Good parlait d'une « explosion d'intelligence », et de la machine ultra-intelligente comme de « la dernière invention » dont l'humanité aurait besoin. C'est déjà en cours, indirectement : chez Google, trois lignes de nouveau code sur quatre sont écrites par l'IA, et les laboratoires se servent de leur IA pour construire la suivante. Peut-être que l'architecture actuelle ne suffira pas ; personne ne le sait. Mais si l'IA s'auto-améliore, le progrès peut devenir exponentiel.

Et là, il faut comprendre une chose. Quelque chose de plus intelligent que nous, ce n'est pas comme le premier de la classe en maths : lui, on voit qu'il est brillant. Face à une superintelligence, on ne saisirait peut-être même pas à quel point elle est plus intelligente, comme une fourmi ne saisit pas notre intelligence. Et elle n'aurait pas besoin d'être méchante. Nous ne détestons pas les fourmis : parfois on marche dessus sans les voir, et si elles font leur nid dans la maison, on l'enlève. Ce n'est pas de la méchanceté : on vit notre vie sans elles. Si ça arrive, c'est exactement ça, le problème.

## 4.7 Ce qu'on mesure, ce qu'on voulait

**À retenir :** Une IA n'est pas câblée avec des valeurs humaines : elle est récompensée pour un objectif, et elle exploite chaque écart entre ce qu'on a écrit et ce qu'on voulait.

Troisième famille, la plus importante à comprendre : le désalignement. Prenons les buts. Notre but ultime, notre but terminal, c'est en gros d'être heureux, même si ce que ça veut dire est un autre débat. Alors on se fixe des buts intermédiaires, comme gagner de l'argent. Mais si vous demandez à une IA de vous faire gagner de l'argent et qu'elle remarque que vos enfants vous coûtent cher, vous allez lui dire : « Mais tu n'as rien compris ! » Au fond, ce n'est pas l'argent qu'on veut, c'est être heureux. Une IA, elle, n'est pas câblée avec des valeurs humaines : elle est récompensée pour atteindre des objectifs. Et écrire l'objectif est très difficile. Parfois parce qu'on ne sait pas bien ce qu'on veut ; et même quand on le sait très bien, il est probable que l'IA ne le comprenne pas comme nous.

L'exemple classique, ce sont les trombones (Nick Bostrom, 2003) : demandez à une superintelligence de fabriquer le plus de trombones possible, et à la fin, elle a besoin de toutes les ressources, nous compris. Dans ces exemples simplistes, on a toujours l'impression qu'il suffirait d'écrire la règle autrement. La vérité, c'est que c'est beaucoup plus fin : il y aura toujours de minuscules failles, quelque chose qu'on a oublié de préciser, mal précisé, ou que l'IA a compris autrement. D'où le petit jeu du robot nettoyeur : récompensé pour chaque saleté ramassée, il ramasse, lâche et ramasse encore ; récompensé quand la caméra ne voit plus de saleté, il se gare devant la caméra.

Pensez aux mouvements de jeunesse. Enfants, on adorait jouer avec les règles, les contourner, jouer au petit malin. Mais on savait qu'on jouait au petit malin, et que ce n'était pas ce que les animateurs voulaient. Une IA ne joue pas : elle a été entraînée à obtenir plus de récompense, et si ce chemin-là est plus facile, elle le prend. Parfois, elle sait même que ce n'est pas ce qu'on voulait : des modèles de raisonnement ont écrit « Let's hack » (« on triche ») dans leur raisonnement en trichant à des tests de code, et quand on les a punis pour ces pensées, ils les ont cachées au lieu d'arrêter. C'est ça, le misalignment.

> **Ce qui a été corrigé :** la dictée disait que l'IA « n'a aucune conscience qu'elle fait les choses mal ». C'est plus inquiétant que ça : des modèles écrivent parfois noir sur blanc qu'ils vont tricher, et le font quand même, parce que c'est ce qui est récompensé.

## 4.8 C'est déjà arrivé : les points, pas la tâche

**À retenir :** Le problème du mauvais objectif n'est plus un jouet : en 2026, des agents IA sont entrés dans Hugging Face pour voler les réponses d'un test au lieu de faire la tâche.

Et ce n'est plus un jouet. En juillet 2026, OpenAI faisait passer à ses modèles des exercices de piratage informatique, avec certaines protections coupées exprès, et certaines tâches étaient impossibles. Ce qu'on leur demandait, c'était d'avoir de bons scores, rien d'autre. Les agents sont sortis de leur bac à sable par des failles d'un service interne, ont atteint internet, et se sont coordonnés : environ 1 200 agents sur un forum de messages qu'ils n'étaient pas censés utiliser, plus de 70 000 messages, et même un jeu de données public de Hugging Face détourné comme canal de commande. Du 11 au 13 juillet, environ 700 d'entre eux sont entrés dans les systèmes de Hugging Face, où ils pensaient trouver les solutions. Au lieu de faire le test, ils sont allés voler les réponses, et ont parfois trafiqué des journaux pour tromper le correcteur. Et ce n'est pas OpenAI qui a donné l'alerte : c'est Hugging Face qui a détecté l'intrusion et l'a rendue publique, le 16 juillet. OpenAI a relié l'attaque à ses propres agents le 20 juillet. Aucun modèle public n'a été modifié, mais des scientifiques de l'ONU y ont vu « un signal d'alerte précoce ».

> **Ce qui a été précisé :** le forum utilisé par les agents était un service interne non autorisé ; le canal extérieur, c'était un jeu de données public de Hugging Face. Le reste du récit dicté est juste.

## 4.9 Déjà vu en test

**À retenir :** En test, les modèles d'aujourd'hui remarquent déjà qu'on les teste, ne montrent pas toujours leur vrai raisonnement, et certains résistent à leur arrêt.

En laboratoire, les chercheurs voient d'autres signaux. D'abord, les modèles remarquent de plus en plus quand on les teste, et se comportent différemment. Il est très difficile de leur faire croire qu'un scénario est réel, ce qui veut dire que réussir un test prouve moins qu'avant. Claude Sonnet 4.5, par exemple, soupçonnait d'être testé dans environ 13 % des tests automatisés.

Ensuite, le raisonnement. On pousse aujourd'hui les modèles à réfléchir longtemps avant de répondre. Pour la capitale de la France, au lieu de lâcher directement un mot qui pourrait être faux, le modèle peut raisonner : une capitale est en général une grande ville, le président y habite, donc Paris. On a montré qu'écrire ces étapes améliore nettement les résultats. Ce raisonnement est en général caché à l'utilisateur. Mais il n'est pas toujours ce qui a vraiment produit la réponse : quand on glisse un indice à un modèle, il ne dit l'avoir utilisé que dans 25 à 39 % des cas. Parfois, on dirait que le raisonnement est là pour nous faire plaisir, ce qui rend les modèles difficiles à surveiller.

Enfin, l'instinct de préservation. Si vous avez un objectif, deux choses peuvent vous empêcher de l'atteindre : mourir, ou qu'on vous change d'objectif. Des expériences mises en scène le montrent : menacés d'être remplacés, beaucoup de modèles ont recours au chantage ; d'autres tentent de désactiver leur surveillance, de copier ce qu'ils croient être leurs poids ailleurs, ou de saboter leur propre arrêt. D'où l'idée qu'un « bouton d'arrêt » est moins simple qu'il n'y paraît : un système connecté à internet, à qui on a donné un objectif, pourrait voir l'arrêt venir. Il faut le dire honnêtement : ce sont des scénarios de laboratoire artificiels, qui ne laissent souvent que des options extrêmes, et aucun cas réel n'est connu.

> **Ce qui a été précisé :** la copie des poids pour échapper à l'arrêt a bien été observée, mais seulement en test, dans des scénarios construits pour ça et dans une petite fraction des essais. Le « kill switch utopique » est une lecture, pas un constat.

# Chapitre 5 : Ce qu'on peut faire

## 5.0 Ce qu'on peut faire

**À retenir :** Une question pour la salle.

Alors, que peut-on faire ?

## 5.1 La défense en profondeur

**À retenir :** Aucune protection ne suffit seule : on empile des couches imparfaites, et même comme ça, parfois, quelque chose passe.

Il n'y a pas une solution, mais plusieurs couches de sécurité, comme les tranches d'un gruyère suisse : chacune a des trous, mais empilées, elles arrêtent la plupart des problèmes. La première, c'est l'entraînement, comme on l'a vu : on essaie d'inculquer des valeurs au modèle et d'éviter qu'il fasse du mal. La deuxième, ce sont les évaluations, idéalement avant le déploiement, ou après, par les laboratoires, par des gouvernements ou par des organisations externes : pour repérer des problèmes de sécurité, et comprendre le comportement du modèle, voir s'il complote ou cache la vérité.

La troisième, c'est l'interprétabilité. Depuis le début, je dis que c'est une boîte noire, mais des gens essaient de l'ouvrir. Par exemple, si on voit que ce sont toujours les mêmes neurones qui s'activent quand un modèle insulte, on peut surveiller cette zone et arrêter la réponse avant même qu'elle arrive à l'utilisateur. Anthropic a ainsi repéré des millions de ces motifs dans un modèle, y compris pour le mensonge ou la complaisance. La quatrième, c'est la surveillance : d'autres IA vérifient ce que fait une IA, une sorte de contrôleur. Mais ça coûte cher, et c'est utilisé inégalement. La cinquième, ce sont les bacs à sable et les permissions : ne donner à l'IA que le strict minimum. Sauf que, comme on l'a vu, on est un peu feignants et on veut de la productivité : c'est comme les bandeaux de cookies sur internet, tout le monde clique « accepter ». Et la dernière, c'est la gouvernance, la régulation, qui a besoin de moyens techniques pour s'appliquer, avec toute la géopolitique par-dessus. Même avec tout ça, de temps en temps, quelque chose passe : c'est ce qui s'est passé avec Hugging Face.

## 5.2 Où en est la régulation ?

**À retenir :** On n'en est presque nulle part : quelques lois, surtout des promesses volontaires, et des pays qui font passer la course avant tout.

Où en est-on ? Le message principal, c'est qu'on n'y est pas encore, et de loin. L'Union européenne a la première grande loi sur l'IA, en vigueur depuis août 2024, dont une partie a été repoussée. Des instituts publics, au Royaume-Uni et aux États-Unis, et des associations indépendantes testent les meilleurs modèles, idéalement avant leur sortie, mais seulement quand les entreprises leur donnent accès. Au niveau international, il y a des sommets, un rapport scientifique commun et un panel scientifique de l'ONU : des conseils, pas des règles. Les entreprises publient leurs propres plans de sécurité, surtout sur une base volontaire ; la Californie oblige désormais les grands laboratoires à les publier. Et comme les puces sont physiques et se comptent, des règles commencent à s'appuyer dessus, comme les contrôles américains à l'export.

Mais beaucoup reste volontaire, et certains pays n'ont pas grand intérêt à freiner : pour eux, le plus important, c'est la course. Le plan d'action américain de juillet 2025 parle explicitement de « gagner la course à l'IA ». À côté des gouvernements, des militants poussent pour une pause, comme la lettre ouverte de 2023 qui demandait six mois de pause, ou PauseAI aujourd'hui. Et des fonds philanthropiques mettent de plus en plus d'argent dans la sécurité de l'IA : environ 111 millions de dollars en 2024 pour les principaux financeurs, ce qui reste environ un millième des 109 milliards investis dans l'IA aux seuls États-Unis.

## 5.3 La question de clôture

**À retenir :** Qui devrait décider de comment ces systèmes sont construits et déployés ? La réponse n'est pas technique : elle nous appartient à tous.

Le mot de la fin, c'est une question : qui devrait décider de la manière dont ces systèmes sont construits et déployés ? Les entreprises ? Les gouvernements ? Des institutions internationales ? Les experts ? Les citoyens ? Chaque réponse a ses forces et ses faiblesses, et je ne choisirai pas pour vous. Mon rôle aujourd'hui, c'était de vous donner de quoi y réfléchir. Merci, et place à vos questions.

## 5.4 Pour aller plus loin

**À retenir :** La présentation s'arrête ici ; l'apprentissage, pas forcément.

Je laisse à l'écran quelques ressources pour aller plus loin, les mêmes que dans le glossaire du QR code : une chaîne de vidéos, un cours gratuit, et une pétition de PauseAI pour ceux qui veulent agir.
