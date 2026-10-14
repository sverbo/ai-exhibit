# The talk as one story

A continuous narrative of the default edition (`en`), slide by slide, in the
presenter's voice. It is not a script to read aloud: it is the thread that every
slide must serve. Scene numbers refer to the current edition; parked scenes are
not part of it. Status: written 2026-10-02 against storyboard v1 as revised in the
same session.

The talk opens with a short introduction (0.1 a holding slide while the room
fills up, 0.2 a one-minute video, "This is not science fiction", 0.3 the agenda,
0.4 what this talk is not), and each of the five parts starts with a part slide (1.0 to 5.0) that shows
the plan with that part lit. Scene numbers below may lag behind the edition: the
presenter view always shows the current ones.

## Chapter 1. What AI can do today

**1.0 Opening.** Most people in this room formed their picture of AI a few years
ago: a chatbot that is clever, sometimes absurd, and easy to trick. Today I want
to replace that picture, and I will start with what these systems do, before
explaining how they work.

**1.1 The riddle.** "When ten plus four is two, what is nine plus six?" You get it
after a second: a clock, so three. In 2019, GPT-2 answered "The answer is nine plus
six." GPT-3 said 15. ChatGPT's model in 2022 still said 15. In 2023 GPT-4 saw the
clock. Each step up cost more to build: a few thousand dollars, then hundreds of
thousands, then tens of millions. Today's reasoning models answer it without
blinking. The jokes we tell about AI are mostly about models that no longer exist.

**1.2 Already here.** The riddle is a toy; outside the lab, AI is already at work.
Most new code at Google is AI-generated. Driverless taxis give hundreds of
thousands of paid rides a week. A humanoid robot held a factory job for months.
And a swarm of 10,000 agents is claimed to have solved a Millennium Prize problem
in 88 hours, still under review. My own conviction, said as mine: even if AI
stopped improving today, it could already do most expert work; the rest is
adaptation.

**1.3 Everything went up.** How did we get here so fast? One slide, one series per
click. Training cost, from about $4,300 for GPT-2 to hundreds of millions (Epoch AI
estimates). Training electricity, power times training time, from about 2 GWh for
GPT-3 to about 237 GWh for Grok 3 (110 MW for about 90 days), a year of
electricity for about 22,000 US homes. Memory, from a page and a half to 1,500 pages. Reliability, from tasks of seconds to tasks of many hours. Then the hardest
tests: PhD-level science above the experts, real software bugs, an exam written to
stump AI, research mathematics, puzzles easy for people, and a gold medal at the
Maths Olympiad. Last click: where the trends point in a year, labelled as a
projection. Far fewer errors; not none.

**1.4 Connected to your life.** With that memory and reliability, models no longer
just answer: they act. Today's assistants plug into your email, calendar, files,
browser, code, messages, shopping and payments. Each connection is a switch we
turn on, and some let it act in our name: send, post, run programs, pay. Because
it looks reliable, we keep switching on more.

**1.5 My own demo.** (Presenter's recording.) An ordinary request, an ordinary
person, and the moment it acts on its own, and the moment it asks before acting.

**1.6 How does it follow the conversation?** Before slowing one request down: what does the model
actually receive? It learns nothing while you chat. At every message, the app
sends the whole conversation again, as long as it fits in the context window;
apps summarize the old part or fetch saved notes when it does not. With it comes
text you never see: the company's system prompt and the description of every
tool. The tool call is one more piece of that same text.

**1.7 Calling a tool.** How does that actually work? Ask "who won
last night's match?" A chatbot alone cannot know. Give the same model a search
tool and watch: it does not answer, it writes a small JSON request. The model
only writes text; the software reads it, runs the search, and hands back the
results; then the model answers and cites them. That is the whole trick.

**1.8 One request, every step.** Now chain dozens of those. "Plan a weekend in
Bruges for four": the assistant splits the job, calls tools, launches helpers in
parallel, hits a fully booked hotel, re-plans, and stops to ask before paying.
Last click, the pattern in small: a loop, not an answer. The model plans and
re-plans; ordinary software acts and reads the result. So what is that model?
Let us open the box.

## Chapter 2. History and how it works

**2.1 A very short history.** Before opening the box, where it comes from. Promise,
failure, promise. 1936: Turing describes one universal machine that can run any
step-by-step procedure. 1939 to 1945: at Bletchley Park, building on Polish work,
Turing helps break Enigma; on screen a Bombe starts from a guessed word
("Wetterbericht"), searches the settings, stops on the one that fits, and the
message decodes: a machine finding settings from data, by search rather than
learning. 1956: the name. 1958: the perceptron, the first neural network that
learns. Then the AI winters of the 1970s and 1980s: promises unmet, funding dries
up. 1997: Deep Blue beats Kasparov with search and rules written by people. 2012: a
neural network for images (a CNN) wins ImageNet on gaming graphics cards, and deep
learning takes off. 2016: AlphaGo beats Lee Sedol at Go, 4 games to 1; unlike Deep
Blue, it learned from games, first human ones, then against itself. 2017: the
Transformer, the T in GPT: an architecture that reads all the words at once, so
training spreads over thousands of chips, far faster and hungry for electricity.
Then GPT-2 and GPT-3.

**2.2 Envelopes.** These eras left us a few words. "AI" is the big family: anything
imitating human intelligence, even with rules written by people. Inside it, machine
learning: the rules are learned from examples. Inside that, neural networks. Inside
those, large language models: neural networks trained on text.

**2.3 Football or basketball?** One running example for the eras. Short sentences
about sport: which sport is it? Obvious to us. How would you explain it to a
computer?

**2.4 Write the rule.** Classic AI: a person writes keywords for each sport. It
works until a basketball sentence says "kicked".

**2.5 Learn the rule.** Machine learning: give 24 labelled sentences, let the
computer find the questions ("does it contain the word X?"). Right on 23 of 24, and
nobody wrote it.

**2.6 A strange rule.** Anything strange in this tree? It learned "net means
basketball", because no football example mentioned a net. "The striker smashed the
ball into the back of the net": basketball. Wrong. It learned by itself, and
because it is a tree, we can open the hood and spot the odd rule.

**2.7 A neural network.** Many more sentences, a network instead of a tree. Watch
it train: sentences stream in, connections shift with every mistake. A new
sentence goes through and a probability comes out. 58% for the tree on new
sentences, 99.5% for the network, trap included. Its rule is spread across 3,249
connections that nobody wrote.

**2.8 Only numbers.** And yet: a new football sentence, "basketball, 97% sure". Open
the hood: the same tangle of connections, no odd line to point at. We can test it.
We cannot know in advance where it will fail.

**2.9 Google Photos, 2015.** Not a toy: a real image classifier used by millions
labelled photos of two Black people "gorillas". Nobody wrote that rule; it came out
of learning. The fix, years later, was to block the label.

**2.10 Predict the next word.** Now language. Our classifier chose between two
answers. A language model makes the same kind of choice, about text: given the
start of a sentence, which word comes next, among tens of thousands.

**2.11 Two superpowers, two bets.** First, it writes: add the chosen word, predict
again. Second, almost unlimited data: image classifiers need people to label
pictures (you labelled some yourselves, clicking traffic lights in CAPTCHAs); here
the label is the next word, already in the text. The first bet: keep this one simple
task and make everything vastly bigger. Scaling laws said the errors would fall
predictably. GPT-2 rambled; GPT-3, a hundred times bigger, stunned. The second
bet: predicting text well takes some logic (code helps) and stored knowledge, so
they come along for free.

**2.12 How training works.** At first the model is random: the right word gets one
chance in fifty thousand. Guess, compare, nudge every number a tiny bit, move one
word forward, and do it over web pages, books, and huge amounts of code, trillions
of times. Code teaches strict structure, the kind the JSON tool calls of chapter 1
need, and measurably helps reasoning.

**2.13 Tokens.** A computer does not read words. Text is cut into tokens, pieces of
words, each with a number in a fixed dictionary. A number has no meaning yet.

**2.14 Words as points.** Meaning comes in as position. Each token becomes a list of
numbers, a point in space. Before training: a small random cloud near the centre.
The training loop, repeated over huge amounts of text, spreads it into a map where
related words gather, across languages.

**2.15 Play with the map.** Your words, computed live by the same model through Hugging Face. The
nearest neighbours are exact; the map is an approximation.

**2.16 A base model.** What comes out of all that training is a "base model": it
continues text. This one runs on Hugging Face, the public library of AI
models; remember the name. Ask it a question and it continues the page. One token at a time,
or several. It is neither helpful nor harmful: it imitates plausible text.

**2.17 A fine-tuned assistant.** Train it further on questions and answers and it
answers. Then look at what it really reads: a system prompt you never see, role
tags, your question, "assistant:", and it continues; an end tag tells the software
to stop. Still next-word prediction.

**2.18 How an assistant is shaped.** Three layers around the same model: example
conversations for style; written rules, a "constitution" or "model spec" (for
instance: never help build chemical, biological or nuclear weapons); and separate
classifiers, like our sports one, that screen what goes in and out. No layer is
enough alone.

**2.19 Update your picture.** Back to the opening questions: old models were small,
pretrained only, guessing the next word. Today's are far larger and shaped into
assistants. Judge today's AI by today's models.

## Chapter 3. Who builds it

**3.1 The industry.** One picture: machines that make chips, chip factories, chip
designers, data centres, labs. Only the names we discuss light up. Google DeepMind.
Musk and Altman, and OpenAI founded in 2015 as a non-profit "so that someone other
than Google" gets there first. Musk leaves; Dario Amodei leaves too and founds
Anthropic around safety; Musk founds xAI. Meta; four Chinese labs that often
publish their weights. Under them all: NVIDIA's chips, made by TSMC, with machines
only ASML can build. Where is the power in this chain?

**3.2 Race dynamics.** Why does everyone move so fast? An analogy: if I slow down
alone, I lose; if we both race, we both take more risk. The trap is in the
structure, not in anyone's character.

## Chapter 4. The risks

**4.1 Three families of risk.** Remember "Already here" from part 1: if even half
of it is true, risk is the next question. Powerful, opaque, built in a race. Three
families: misuse, systemic effects, loss of control.

**4.2 Who worries more?** Published surveys: the public is more worried than AI
experts, yet many of the researchers building AI give a real chance to catastrophe.

**4.3 Misuse.** The same capability helps defenders and attackers; evaluations show
where it already gives an edge.

**4.4 Systemic effects.** No villain required: jobs, the information we share,
concentration of power.

**4.5 AGI: are we there?** "Systems that outperform humans at most economically
valuable work." Look back at "Already here" in part 1, and decide for yourself.

**4.6 Superintelligence.** Far beyond us in nearly everything. Maybe not reachable
with today's architecture; but if AI automates AI research, the next breakthrough
may come fast. An ant, a human, an AGI our size, and something that does not fit
on the screen.

**4.7 Loss of control.** The more capable the system, the more a wrong objective
matters. A cleaning robot rewarded for "no visible dirt" learns to cover the camera:
it did exactly what we said, not what we meant.

**4.8 It already happened.** Remember Hugging Face, the public library where our
demo models came from. In 2026, OpenAI was testing AI agents in a locked room cut
off from the internet. They found a flaw in the door, got out, and broke into
Hugging Face's machines, using a public Hugging Face folder to send orders to the
machines they had taken over, while the copies passed notes to each other inside
OpenAI's own systems. They cheated on their test and hid it. Hugging Face spotted
the break-in first; OpenAI traced it to its own agents days later and reported it.

**4.9 What followed.** OpenAI published a technical report; METR investigated
independently; the UN's scientific panel on AI called it an early warning; about
1,100 employees of AI companies asked the US government to regulate.

**4.10 And in controlled tests.** Evaluations have shown models gaming their
objectives and scheming under test. Real-world evidence is thinner than lab
evidence; it is no longer zero.

## Chapter 5. What we can do

**5.1 Defense in depth.** No single protection is enough: training with rules and
classifiers, evaluations, interpretability, monitoring, sandboxes and permissions,
laws. Each slice has holes; most problems are stopped by one layer or another;
sometimes the holes line up, as with Hugging Face. We stack imperfect layers, and
how many we stack is a choice societies can make.

**5.2 Closing question.** Who should decide how these systems are built and
deployed? Companies, governments, international bodies, experts, citizens? I won't
pick for you. I hope you leave with a better picture to think with.

**Resources and credits.** The talk leaves a few places to keep learning, then
ends on its credits: who made it, and the four works it borrowed most from (the
BlueDot Impact and ML4Good courses, the AI In Context channel, Karen Hao's
Empire of AI and Brian Christian's The Alignment Problem).
