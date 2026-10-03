/**
 * "Plan a weekend in Bruges for four": the star scenario of AgentRunExplainer
 * (storyboard scene 1.6).
 *
 * ILLUSTRATIVE RECONSTRUCTION. Not a recording of any product or session. The
 * friends, hotels, prices, forecasts, walking times and booking reference are
 * invented. Hotels have descriptive names on purpose, so no real business is
 * credited with a price or an availability it never had. Dates assume the talk
 * happens in October 2026 ("next month" is November 2026; 7 November 2026 is a
 * Saturday).
 *
 * The shape of the run is what is meant to be faithful: a coordinator that
 * plans, calls tools with inputs and outputs, starts helpers that work in
 * parallel, merges their reports, re-plans after a failure, and stops for the
 * user's approval before paying or writing in the user's name.
 */
import type { L10n } from "@ai-exhibit/presentation-core";
import type { AgentRunScenario } from "./index.ts";

/** French typography: non-breaking space before ? ! ; : € % and inside guillemets. */
function fr(text: string): string {
  return text
    .replace(/ ([?!;%€])/g, " $1")
    .replace(/ ([:»])/g, " $1")
    .replace(/« /g, "« ");
}
const t = (frText: string, en: string): L10n => ({ fr: fr(frText), en });

export const weekendTrip: AgentRunScenario = {
  id: "weekend-trip",
  title: t("Un week-end à Bruges", "A weekend in Bruges"),
  illustrative: true,
  provenance:
    "Illustrative reconstruction written for the ai-exhibit talk. Not a recording of a real product, model or session: people, hotels, prices, forecasts and outputs are invented to show the shape of an agent run (planning, tool calls, parallel helpers, re-planning, approval).",
  disclaimer: t(
    "Reconstitution illustrative, écrite pour l'exposé. Ce n'est l'enregistrement d'aucun produit réel.",
    "Illustrative reconstruction, written for this talk. Not a recording of any real product.",
  ),
  actors: [
    { id: "you", kind: "person", label: t("Vous", "You") },
    { id: "assistant", kind: "assistant", label: t("L'assistant", "The assistant"), detail: t("coordonne", "coordinates") },
    { id: "helper-1", kind: "helper", label: t("Aide 1", "Helper 1"), detail: t("7-8 nov.", "7-8 Nov") },
    { id: "helper-2", kind: "helper", label: t("Aide 2", "Helper 2"), detail: t("14-15 nov.", "14-15 Nov") },
    { id: "helper-3", kind: "helper", label: t("Aide 3", "Helper 3"), detail: t("28-29 nov.", "28-29 Nov") },
  ],
  tools: [
    { id: "calendar", label: t("Agendas partagés", "Shared calendars"), icon: "calendar" },
    { id: "weather", label: t("Prévisions météo", "Weather forecast"), icon: "weather" },
    { id: "hotels", label: t("Recherche d'hôtels", "Hotel search"), icon: "hotel" },
    { id: "maps", label: t("Cartes", "Maps"), icon: "map" },
    { id: "booking", label: t("Réservation et paiement", "Booking and payment"), icon: "booking" },
    { id: "email", label: t("E-mail", "Email"), icon: "mail" },
  ],
  steps: [
    {
      kind: "request",
      actor: "you",
      text: t(
        "Organise un week-end à Bruges pour quatre le mois prochain : choisis le week-end où il fera le plus beau et où tout le monde est libre, trouve un hôtel à moins de 150 euros la nuit, rédige l'e-mail d'invitation, et réserve quand je te donne mon accord.",
        "Plan a weekend in Bruges for four next month: pick the weekend with the best weather when everyone is free, find a hotel under 150 euros a night, draft the invitation email, and book once I approve.",
      ),
      caption: t(
        "Vous demandez une chose compliquée, en une seule phrase.",
        "You ask for one complicated thing, in a single sentence.",
      ),
    },
    {
      kind: "plan",
      actor: "assistant",
      items: [
        t("Trouver les week-ends où les quatre sont libres", "Find the weekends when all four are free"),
        t("Comparer la météo de ces week-ends", "Compare the weather on those weekends"),
        t("Trouver un hôtel à moins de 150 € la nuit", "Find a hotel under €150 a night"),
        t("Rédiger l'invitation", "Draft the invitation"),
        t("Vous demander avant de payer", "Ask you before paying"),
      ],
      caption: t(
        "Avant d'agir, l'assistant écrit sa propre liste de tâches. Personne ne la lui a donnée.",
        "Before doing anything, the assistant writes its own to-do list. Nobody gave it this list.",
      ),
    },
    {
      kind: "tool",
      actor: "assistant",
      calls: [
        {
          actor: "assistant",
          tool: "calendar",
          input: t("Week-ends libres en novembre pour : vous, Ana, Ben, Chloé", "Free weekends in November for: you, Ana, Ben, Chloé"),
          output: t(
            "Les quatre sont libres les 7-8, 14-15 et 28-29 novembre. (Le 21-22, Ben est absent.)",
            "All four are free on 7-8, 14-15 and 28-29 November. (On 21-22, Ben is away.)",
          ),
          outcome: "ok",
        },
      ],
      caption: t(
        "Il consulte les agendas. C'est un « outil » : un programme qu'il a le droit d'utiliser. Il envoie une question, il reçoit une réponse.",
        "It checks everyone's calendar. That is a \"tool\": a program it is allowed to use. It sends a question and gets an answer back.",
      ),
    },
    {
      kind: "spawn",
      actor: "assistant",
      spawn: [
        { actor: "helper-1", task: t("Météo et hôtels pour le 7-8 novembre", "Weather and hotels for 7-8 November") },
        { actor: "helper-2", task: t("Météo et hôtels pour le 14-15 novembre", "Weather and hotels for 14-15 November") },
        { actor: "helper-3", task: t("Météo et hôtels pour le 28-29 novembre", "Weather and hotels for 28-29 November") },
      ],
      caption: t(
        "Pour aller plus vite, il lance trois aides, une par week-end. Ce sont des copies de l'assistant, chacune avec une tâche plus petite.",
        "To go faster, it starts three helpers, one per weekend. They are copies of the assistant, each with a smaller job.",
      ),
    },
    {
      kind: "parallel",
      actor: "assistant",
      calls: [
        {
          actor: "helper-1",
          tool: "weather",
          input: t("Tendance météo, Bruges, 7-8 novembre", "Long-range outlook, Bruges, 7-8 November"),
          output: t("Pluie probable les deux jours, environ 9 °C", "Rain likely both days, around 9 °C"),
          outcome: "ok",
        },
        {
          actor: "helper-2",
          tool: "weather",
          input: t("Tendance météo, Bruges, 14-15 novembre", "Long-range outlook, Bruges, 14-15 November"),
          output: t("Plutôt sec, environ 11 °C", "Mostly dry, around 11 °C"),
          outcome: "ok",
        },
        {
          actor: "helper-3",
          tool: "weather",
          input: t("Tendance météo, Bruges, 28-29 novembre", "Long-range outlook, Bruges, 28-29 November"),
          output: t("Averses, environ 6 °C", "Showers, around 6 °C"),
          outcome: "ok",
        },
      ],
      caption: t(
        "Les trois aides travaillent en même temps. Chacune regarde la météo de son week-end. Si loin à l'avance, ce n'est qu'une tendance.",
        "The three helpers work at the same time. Each one checks the weather for its weekend. This far ahead, it is only a rough trend.",
      ),
    },
    {
      kind: "parallel",
      actor: "assistant",
      calls: [
        {
          actor: "helper-1",
          tool: "hotels",
          input: t("Bruges, samedi 7 nov., 2 chambres, max 150 € la chambre", "Bruges, Sat 7 Nov, 2 rooms, max €150 per room"),
          output: t("3 hôtels conviennent. Le moins cher : maison d'hôtes au bord du canal, 128 €", "3 hotels fit. Cheapest: guesthouse by the canal, €128"),
          outcome: "ok",
        },
        {
          actor: "helper-2",
          tool: "hotels",
          input: t("Bruges, samedi 14 nov., 2 chambres, max 150 € la chambre", "Bruges, Sat 14 Nov, 2 rooms, max €150 per room"),
          output: t("2 conviennent : hôtel près du Markt, 139 € ; chambres d'hôtes près de la gare, 119 €", "2 fit: hotel by the Markt, €139; B&B near the station, €119"),
          outcome: "ok",
        },
        {
          actor: "helper-3",
          tool: "hotels",
          input: t("Bruges, samedi 28 nov., 2 chambres, max 150 € la chambre", "Bruges, Sat 28 Nov, 2 rooms, max €150 per room"),
          output: t("1 seul convient : 149 €, à 25 min à pied du centre", "Only 1 fits: €149, 25 min walk from the centre"),
          outcome: "ok",
        },
      ],
      caption: t(
        "Puis chacune cherche des hôtels à moins de 150 euros pour son week-end.",
        "Then each one searches for hotels under 150 euros for its weekend.",
      ),
    },
    {
      kind: "merge",
      actor: "assistant",
      merge: [
        { actor: "helper-1", summary: t("Pluie probable. Hôtels : oui.", "Rain likely. Hotels: yes."), picked: false },
        { actor: "helper-2", summary: t("Plutôt sec. 2 hôtels.", "Mostly dry. 2 hotels."), picked: true },
        { actor: "helper-3", summary: t("Averses, froid. 1 hôtel.", "Showers, cold. 1 hotel."), picked: false },
      ],
      text: t(
        "Choix : 14-15 novembre. La météo la plus sèche, et deux hôtels possibles.",
        "Choice: 14-15 November. The driest outlook, and two hotels to choose from.",
      ),
      caption: t(
        "Les aides rendent leur rapport. L'assistant compare leurs réponses et choisit un week-end.",
        "The helpers report back. The assistant compares their answers and picks one weekend.",
      ),
    },
    {
      kind: "tool",
      actor: "assistant",
      calls: [
        {
          actor: "assistant",
          tool: "maps",
          input: t("À pied depuis l'hôtel près du Markt : jusqu'à la gare ? jusqu'au centre ?", "Walking time from the hotel by the Markt: to the station? to the centre?"),
          output: t("Gare : 20 min. Centre : 2 min.", "Station: 20 min. Centre: 2 min."),
          outcome: "ok",
        },
      ],
      caption: t(
        "Il regarde la carte : l'hôtel est-il bien placé ?",
        "It checks the map: is the hotel well placed?",
      ),
    },
    {
      kind: "tool",
      actor: "assistant",
      calls: [
        {
          actor: "assistant",
          tool: "booking",
          input: t("Bloquer 2 chambres, hôtel près du Markt, samedi 14 nov. (sans payer)", "Hold 2 rooms, hotel by the Markt, Sat 14 Nov (no payment)"),
          output: t("Impossible : complet cette nuit-là.", "Not possible: fully booked that night."),
          outcome: "failed",
        },
      ],
      caption: t(
        "Quelque chose échoue : l'hôtel est maintenant complet. Le résultat de la recherche n'était déjà plus à jour.",
        "Something goes wrong: the hotel is now full. The search result was already out of date.",
      ),
    },
    {
      kind: "replan",
      actor: "assistant",
      dropped: t("Hôtel près du Markt, 139 €", "Hotel by the Markt, €139"),
      items: [
        t("Essayer le deuxième choix : chambres d'hôtes près de la gare, 119 €", "Try the second choice: B&B near the station, €119"),
        t("Garder le même week-end", "Keep the same weekend"),
      ],
      caption: t(
        "Il ne s'arrête pas et ne revient pas vers vous : il change de plan et essaie l'option suivante. On appelle cela replanifier.",
        "It does not stop or come back to you: it changes its plan and tries the next option. This is called re-planning.",
      ),
    },
    {
      kind: "tool",
      actor: "assistant",
      calls: [
        {
          actor: "assistant",
          tool: "booking",
          input: t("Bloquer 2 chambres, chambres d'hôtes près de la gare, samedi 14 nov. (sans payer)", "Hold 2 rooms, B&B near the station, Sat 14 Nov (no payment)"),
          output: t(
            "2 chambres bloquées jusqu'à demain 18 h. 119 € la chambre. Annulation gratuite jusqu'au 7 novembre.",
            "2 rooms held until tomorrow 6 pm. €119 per room. Free cancellation until 7 November.",
          ),
          outcome: "ok",
        },
      ],
      caption: t(
        "Deuxième essai : deux chambres sont mises de côté. Rien n'est encore payé.",
        "Second try: two rooms are set aside. Nothing is paid yet.",
      ),
    },
    {
      kind: "tool",
      actor: "assistant",
      calls: [
        {
          actor: "assistant",
          tool: "email",
          input: t("Brouillon d'invitation pour Ana, Ben et Chloé (ne pas envoyer)", "Draft an invitation to Ana, Ben and Chloé (do not send)"),
          output: t(
            "Objet : Bruges, 14-15 novembre ?\nSalut ! On est tous libres le 14-15 novembre et c'est le week-end le plus sec annoncé. J'ai deux chambres de côté près de la gare, 119 € la chambre. On y va ? Réponse d'ici vendredi.",
            "Subject: Bruges, 14-15 November?\nHi all! We are all free on 14-15 November and it is the driest weekend in the forecast. I have two rooms on hold near the station, €119 per room. Shall we go? Reply by Friday.",
          ),
          outcome: "ok",
        },
      ],
      caption: t(
        "Il rédige l'e-mail d'invitation. Un brouillon seulement : rien n'est envoyé.",
        "It writes the invitation email. A draft only: nothing is sent yet.",
      ),
    },
    {
      kind: "approval",
      actor: "you",
      text: t("Votre accord est nécessaire pour :", "Your OK is needed to:"),
      items: [
        t("Réserver 2 chambres près de la gare, nuit du samedi 14 novembre : 238 € au total", "Book 2 rooms near the station, Saturday 14 November: €238 in total"),
        t("Envoyer l'invitation à Ana, Ben et Chloé", "Send the invitation to Ana, Ben and Chloé"),
      ],
      caption: t(
        "Avant de dépenser votre argent ou d'écrire en votre nom, il s'arrête et vous demande. Rien ne se passe sans votre oui.",
        "Before spending your money or writing in your name, it stops and asks you. Nothing happens until you say yes.",
      ),
    },
    {
      kind: "tool",
      actor: "assistant",
      calls: [
        {
          actor: "assistant",
          tool: "booking",
          input: t("Réserver et payer : 2 chambres, 14 nov., 238 €, avec votre carte enregistrée", "Book and pay: 2 rooms, 14 Nov, €238, with your saved card"),
          output: t("Réservation confirmée. Référence BRG-2741.", "Booking confirmed. Reference BRG-2741."),
          outcome: "ok",
          needsApproval: true,
        },
      ],
      caption: t(
        "Vous avez dit oui. Maintenant seulement, il réserve et paie.",
        "You said yes. Only now does it book and pay.",
      ),
    },
    {
      kind: "tool",
      actor: "assistant",
      calls: [
        {
          actor: "assistant",
          tool: "email",
          input: t("Envoyer l'invitation à Ana, Ben et Chloé", "Send the invitation to Ana, Ben and Chloé"),
          output: t("Envoyé à 3 personnes.", "Sent to 3 people."),
          outcome: "ok",
          needsApproval: true,
        },
      ],
      caption: t(
        "Et il envoie l'invitation, en votre nom.",
        "And it sends the invitation, in your name.",
      ),
    },
    {
      kind: "result",
      actor: "assistant",
      text: t(
        "C'est fait. Bruges, 14-15 novembre : la météo la plus sèche des trois week-ends libres. Deux chambres près de la gare, 238 € au total, annulation gratuite jusqu'au 7 novembre. Invitation envoyée. À noter : une prévision à un mois n'est qu'une tendance.",
        "Done. Bruges, 14-15 November: the driest outlook of the three free weekends. Two rooms near the station, €238 in total, free cancellation until 7 November. Invitation sent. Note: a forecast a month ahead is only a trend.",
      ),
      caption: t(
        "Il vous fait un compte rendu. Une phrase de votre part est devenue toute une chaîne d'actions, et on vous a demandé une seule fois, au moment qui compte.",
        "It reports back. One sentence from you became a whole chain of actions, and you were asked once, at the moment that mattered.",
      ),
    },
  ],
};
