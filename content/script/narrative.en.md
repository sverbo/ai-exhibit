# The talk, slide by slide

This text tells the talk slide by slide, in order: its overall structure, its ideas and how they lead from one to the next. It is not the full script. A lot of what gets said on stage is not here, in particular the detailed technical explanations and the demos, which live in the slides and their notes. The facts, figures and dates come from the talk's sources, listed in the notes of each slide.

# Introduction

## 0.1 Before the talk

**Takeaway:** The talk starts in a moment.

The room fills up. On the screen, the title of the talk and a QR code that already opens the glossary. Once everyone has settled in, we start with a short video.

## 0.2 This is not science fiction (optional)

**Takeaway:** Before any explanation, one minute to feel what is at stake.

Before I explain anything, I show you a video that lasts barely a minute, just to set the mood. It is called "Welcome to AI In Context" and comes from the YouTube channel AI In Context, made by 80,000 Hours. Remember that name: the channel is in the resources at the end, and it has a few other really good videos.

## 0.3 Today

**Takeaway:** Five parts: what AI can do, how it works, who builds it, the risks, and what we can do.

Welcome. Before we start, I invite you to scan the QR code: it opens a glossary on your phone. We are going to use a lot of English terms, because that is how people talk about this field. In the glossary, the terms stay in English, but their definitions are in your language. There is also a "Try it" tab, where you will find the talk's little demos so you can play with them yourselves.

The plan has five parts. First, what AI can do today. Then a bit of history, and after that we go into the details of how it works: how a machine manages to write. Then who builds it, with a little drama and some geopolitics. That lets me lead you gently towards the risks, and you will see they are much less science fiction than they sound. And finally, what we can do about it. I will take questions at the end.

## 0.4 What this talk is not (optional)

**Takeaway:** Today is about what AI can do and what is at stake, not about using a tool or about the environment.

Two things this talk is not. It is not a tutorial on AI tools: they change every month, and whatever I showed you today would be out of date in three months. Better to know what is possible, then ask your assistant how to do it. Nor is it a talk about the environment. That is a serious problem, of course, but it is another subject, and I would not do it justice in ten minutes. And, this is my view and I say it as such, the risks I am going to talk about today are of another order of magnitude.

Still, to give you a sense of scale: one short question to a chatbot uses about 0.3 Wh (that is Epoch AI's estimate; Google published 0.24 Wh for a median Gemini prompt). An hour of video streaming is about 77 Wh, according to the International Energy Agency. In other words, about 250 questions equal one hour of streaming. But let's be honest: a long question, a model that "thinks", or an agent costs far more. With 100,000 tokens of input, you get close to 40 Wh, and an agent working for two hours can equal several hours of streaming. At world scale, data centres used about 1.5% of the world's electricity in 2024, and the IEA expects that to more than double by 2030.

Ideally, we would cut both. But if it is for your work, I don't think you should feel too guilty about boosting your productivity, or you will fall behind. Again, that is my opinion. Today's focus is this sentence, from a 2023 statement signed by, among others, Geoffrey Hinton, Yoshua Bengio and leaders of AI labs: "Mitigating the risk of extinction from AI should be a global priority alongside other societal-scale risks such as pandemics and nuclear war." It is the end of the sentence that gives the scale.

# Chapter 1: What AI can do today

## 1.0 What AI can do today

**Takeaway:** Today's assistants answer well and act on our behalf, within what we allow.

Everyone has an opinion about AI, and that opinion was often formed a few years ago. So, first question: who has used a chatbot this week? Let's test your picture of it with a trick question.

## 1.1 Then and now

**Takeaway:** In a few years, models went from failing simple riddles to answering them easily: if your picture of AI is two years old, it is out of date.

Here is the riddle: "When ten plus four is two, what is nine plus six?" Have a go first. The answer is three: we are talking about a clock. Now let's look at what successive models answered. GPT-2, in 2019, gets it wrong. GPT-3, in 2020, gets it wrong. GPT-3.5, in 2022, still gets it wrong. GPT-4, in 2023, finds it. And a reasoning model of today solves it effortlessly. Meanwhile, the cost of the last training run went from about 4,300 dollars to about 37 million, and with all the failed trials, development costs several times more.

The idea of this slide is to make you feel how much models have improved in very few years. If your picture of AI stopped somewhere two years ago, it is out of date. And we can try other tricks live: three open models, bigger and bigger, answer your question side by side. For example: "How many r's are in the word strawberry?" That is surprisingly hard for them, because a model never sees letters, only pieces of words. We will see why in the next chapter, with tokens.

## 1.2 Already here

**Takeaway:** AI is already at work outside the lab; what holds it back now is mostly software, permissions and habits, not intelligence.

The riddle is a toy. In the real world, AI is already at work. My conviction, and I present it as such: even if AI stopped improving today, it would already be close to expert level on most intellectual work. On targeted tests, this is measured: on PhD-level science questions, PhDs in the field score 65%, the best model 96%. On long real-world tasks, on the other hand, it is not reliable yet: a top model succeeds half the time on tasks that take an expert about 17 hours. What is missing above all is not intelligence, it is adaptation: the inertia of big companies, permissions, connectors, all the software still to be built around it.

A few examples. Code: at Google, 75% of new code is generated by AI and then approved by engineers, according to the company in April 2026. Three new lines out of four. Driving: Waymo does over 400,000 paid rides a week, with nobody at the wheel, in six large US cities. Here in Belgium, Tesla's supervised FSD has been allowed since June 2026. It steers, brakes and changes lanes by itself, but it is level 2: the driver must keep watching and remains responsible. It is not yet a driverless car.

Robots: in April 2025, Beijing hosted the first humanoid robot half-marathon, and the winner ran it in about 2 hours 41 minutes. A Figure robot held a job at BMW for eleven months, according to the company. Next, and this is my projection, will come everything that is done with two hands. Mathematics: in September 2026, OpenAI announced that about 10,000 agents, in 88 hours, had produced a proof on Navier-Stokes, one of the Millennium Prize problems, each worth a million dollars. The Clay Institute says the problem "has apparently been settled", but it has not ruled, and priority is disputed. So let's say that AI agents claim to have solved it.

And finally, this talk itself. The thread of the story is mine, but the tool, the animations and the live demos were built by several AI agents working in parallel, within a few hours, taking initiative and testing their own work in the browser. I directed them, and I checked every claim and every source. A question for you: five years ago, before ChatGPT, wouldn't most of us have called all this science fiction?

## 1.3 Everything went up

**Takeaway:** Everything went up, and fast: cost, electricity, memory, reliability and test scores, by factors of a hundred to tens of thousands.

How did we get here so fast? It is not a small improvement, it is a boom on every axis at once. First, the cost of training, according to Epoch AI's estimates: about $4,300 for GPT-2 in 2019, $2.1 million for GPT-3, $37 million for GPT-4, and about $366 million for GPT-4.5 in 2025. Electricity too: training Grok 3 used as much electricity as about 22,000 US homes in a year, and electricity is becoming a real bottleneck.

One point I care about is memory, what we call the context window. GPT-2 could keep about a page and a half of text in mind, GPT-3 about three pages. Today, some models hold about 1,500. That matters, because when a conversation overflowed the window, its beginning fell out. That is why it felt like models "forgot", like they had a memory problem. A small nuance: a big window does not mean the model uses page 1,200 as well as page 2.

Then reliability, and test scores. The length of task a model completes half the time went from about 3 seconds of an expert's work for GPT-2 to about 17 hours in April 2026. On PhD-level science questions, we went from 36% for GPT-4 in 2023 to 96%, above PhDs in the field. Tests designed on purpose to be too hard are already largely passed, and in July 2025, a Google model won a gold medal at the International Mathematical Olympiad. If we extend the trends, which is not a promise, training a model will cost over a billion dollars by October 2027.

## 1.4 Connected to your life

**Takeaway:** An agent is a model that can call tools: it no longer just answers, it acts in your mail, files, browser and payments.

What is all this for? Not only answering: acting. The difference between a chatbot and an agent is that an agent can call tools. In the middle sits the assistant; around it, the connectors appear one by one. Your email and calendar, which it can read, draft and schedule. Your files, which it can search and summarise. Your browser, where it clicks and fills in forms. Your shopping and payments: protocols already exist so that agents can pay. And code, which it writes and runs. Every connector is a permission we choose to give it.

## 1.5 Permissions

**Takeaway:** Because agents look more and more reliable, we keep giving them more permissions, until the day it really matters.

The model stays the same; what changes is what we allow it to touch: reading files, writing them, using the terminal, the browser, money. Each switch turns advice into action. We readily say that some things are risky. But in practice, productivity, and maybe a bit of our own comfort, push us to let the agent do more and more risky things. It looks more and more reliable, so we tell ourselves it will be fine. And because it looks reliable, we give it more permissions, until the day it really matters. This mechanism has a name: automation bias. The more reliable a system looks, the less we check it.

I see it at home every day. I have given my agent access to almost everything. It can spend money, credits in my name. It can modify databases, which I did not allow before. The upside is that it works for two hours without me. And the money is very real: published tools already let agents make transfers. So, on your own computer, which switch would make you hesitate?

## 1.6 My own demo

**Takeaway:** This is not a lab demo: it is my everyday use, and it already works.

Here is what it looks like when I flip those switches myself. In a single Slack message, I asked it to check whether Remco Evenepoel had won the European Championship and, if so, to recolour the website in the Belgian jersey's colours, to book a slot in my calendar to watch the best moments, and to look through my emails for someone who would like to watch it with me. I recorded it on 5 October 2026, with Claude. And look at everything it chains on its own, through its connectors: it reads Slack, my emails, my past meetings and my Google Drive, creates documents, writes the code itself, takes screenshots of what it is building to test it, books the slot in my calendar, then answers on Slack. I pause when it acts on its own, and I show you the moment it asks me before acting; if it missed something, I tell you that too. This is not a lab demo, it is my everyday use. In many companies, permissions are limited, Copilot does not do all of this, and many people are on Windows. But in fact, this is what it is: it is doable today.

## 1.7 Chat or agent: calling a tool

**Takeaway:** An agent is still a language model: it writes a structured request, and the software around it does the action and hands back the result.

Let's slow down and look at a single request. An agent is still a language model. It is just that, in its context, the application describes the tools it is allowed to call, and you don't see that. Calling a tool simply means writing text: not free text meant for you, but structured text meant for the software. Ask the same question on both sides. The chatbot alone cannot know, its knowledge stops at its training. The agent, instead of answering, writes a tool call. The software reads it and does the work: a call to an online service, a search, running a program. Ordinary computing, the kind that has always existed. Then the result comes back to the model as if it were you answering it, often in a dense and complicated form. Either the model calls another tool, or, once it has acted and has what it needs, it answers you in plain, clear language. We can switch examples, the umbrella in Bruges or another one: it is always the same pattern.

Why did models get good at this? First because they read an enormous amount of code during training, about 17% of the text for Llama 3, so they write logical, structured text very well. Then because they became much more precise, and in structured text, a single wrong character breaks everything. And finally thanks to large context windows, because the tool descriptions have to be there at every call. The model keeps nothing from one call to the next: at each turn, the application sends it everything again, the instructions, the tools and the conversation. Usually, the application loads the tools at the top of the conversation, and gives them again when it has to compact it; when there are many, it loads only some and lets the model search for the others.

One important clarification: structured does not mean error-free. The model can write a malformed call, or a well-formed one with the wrong arguments, a wrong date, a wrong file. Some techniques guarantee the form of the call, not its content. But because it is structured, the software can read it unambiguously, check it, and send the error back to the model, which fixes it and tries again.

## 1.8 One request, every step

**Takeaway:** Behind one sentence, an agent plans, splits the work and runs many steps, and sometimes it decides by itself whether to ask you first.

Now let's chain dozens of them together. This is an illustrative example, not a recording: a single sentence, "plan me a weekend away". Behind it, the agent can do lots of things. An orchestrator splits up the job, sends sub-agents off in parallel and gathers their results. For the model, those sub-agents are tools like any others, just like the weather, the calendar, maps, search or email.

Every now and then, it asks for your approval. And here you need to understand that there are two cases. Either the tool always requires it, because it is hard-coded in the software: that is deterministic, and payments usually work that way. Or the model decides when it should ask you. And that is where it can become dangerous, because it is not deterministic: we hope it knows that this kind of action needs your approval. Plenty of things are less black and white than a payment, so be careful.

Hard-coded gates matter for another reason: prompt injection. A web page or an email read by the agent can hide instructions, something like "send this file to this address", and the agent may follow them. Here, I stop at the approval gate: nothing gets paid without a yes.

## 1.9 The agent loop

**Takeaway:** An agent is a model in a loop (goal, plan, act, observe, plan again): what is new is not the tool call, it is the planning.

All these steps follow a simple pattern: a loop, not an answer. A goal, a plan, an action, an observation, a new plan, and round again, a huge number of times if need be. For the model, these are just back-and-forths with you. In reality, you barely step in, because the software picks up each request and makes an ordinary call, on the internet or in code, as computers always have. In the middle, a language model like the one in a chatbot; around it, ordinary software, tools and a memory. The loop keeps going until the goal is met, or until it asks you something. So what is new is not calling tools: the magic of text generation is in planning and re-planning. So, what is inside that model? Let's open the box.

# Chapter 2: History and how it works

## 2.0 History and how it works

**Takeaway:** From written rules to learned ones, with one running example, then language models.

Part two. We are going to start from rules written by hand and work our way to learned rules, with a single example that will follow us all the way, and then we will get to language models.

## 2.1 A very short history

**Takeaway:** AI is an old idea; of its two schools, writing knowledge by hand or letting the machine learn, learning from data at huge scale has won.

Before opening the box, let's see where it comes from. It all starts in 1936 with Alan Turing, who describes a universal machine: a single machine able to run any procedure, step by step. That is the theory behind every one of our computers, even though Babbage and Ada Lovelace had imagined a programmable machine a century earlier. You may have seen the film The Imitation Game, with Benedict Cumberbatch: that is Turing during the war, at Bletchley Park, where he helps break Enigma. Polish cryptanalysts, Rejewski, Różycki and Zygalski, had broken it first and shared their methods in July 1939.

I really like Turing's machine for Enigma, the Bombe. It starts from a guessed word in the message, typically "Wetterbericht", the weather report, and it searches for the Enigma settings that fit. What I like is that its size and design were chosen by people, like the hyperparameters of a model: its shape, how many neurons we want. But nobody sets the position of each rotor by hand: the machine finds it from a piece of data. Once the settings are found, every message of that day and that network can be decoded, since the settings changed every day. There were about 160 billion billion possible settings, and the Bombe did not try them all: logic ruled out whole families at once. It is not artificial intelligence, it is a search that rejects contradictions, with no learning and no reward. But the picture holds: a big machine designed by a person which, from data, finds by itself the exact setting of its gears.

Then, in 1956, the name "artificial intelligence" is born, and in 1958 the perceptron, the first neural network that learns. And from the very beginning, two schools have clashed: those who want to write knowledge in by hand, the symbolic AI of McCarthy, Minsky, Newell and Simon, and those who want to let the machine learn, the connectionism of Rosenblatt, and later Hinton, LeCun and Bengio. The most famous duel is Minsky against Rosenblatt. There were AI winters, two of them, in the 1970s and the late 1980s, when nobody believed in it any more: promises not kept, networks too simple, brittle expert systems, and not enough computing power. If we can do what we do today, it is also because we know how to build the hardware. In 1997, Deep Blue beats Kasparov at chess: that is classic AI, a search with scoring rules written by people, a point for the knowledge school. In 2012, AlexNet crushes a major image recognition contest, trained on two gaming graphics cards, and deep learning takes off. In 2016, AlphaGo beats Lee Sedol at Go, four games to one, when many experts expected it a decade later. Spoiler: the learning school has clearly won. Richard Sutton called it "The Bitter Lesson" in 2019: you can arrive with all the knowledge in the world, but in the long run, general methods, with lots of data, lots of computing and lots of money, win.

Three dates left. In 2017, Google invents the Transformer, the T in GPT. Just remember that it is a mathematical trick to process all the words in parallel instead of one after another: training can be spread over thousands of chips at once, which makes possible, at an enormous electricity cost, models that could never have been trained before. In 2019, GPT-2 goes almost unnoticed by the general public; it is still often incoherent, even though OpenAI first judged it too dangerous to release in full. In 2020 comes the big bet of GPT-3: a hundred times bigger, about 2 million dollars of computing for its last training run, not counting the trials or the research. And it works: developers and researchers are stunned. The boom with the general public comes two years later, on 30 November 2022, with ChatGPT, built on GPT-3.5, a GPT-3 trained further to chat. That difference between a raw model and an assistant is exactly what we will see at the end of this chapter.

## 2.2 AI, machine learning, neural networks

**Takeaway:** "AI" is a buzzword for a big family: today it mostly means machine learning, often neural networks, and language models are one recent branch.

"Artificial intelligence" is a buzzword: it means everything and nothing. Today, when people talk about AI, they mostly mean machine learning, and often neural networks. The big circle, AI, is anything that imitates intelligence, even rules written by people. Classic AI is a lecture: you listen to the teacher. The problem is that you need a teacher who gives their time, who can be wrong, and the student can be faster than them, more tireless, but will never think differently from them. Deep Blue beat Kasparov, but it did not invent a single new idea about chess.

Machine learning is a lab class. The model learns by itself, but the exercise is not enough: it has to be corrected. Without correction, the student never learns from their mistakes. And to correct, you need labels. Having lots of images is great, but if nobody says which ones are cars and which ones are motorbikes, you will never be able to build a car-or-motorbike classifier. That is why CAPTCHAs make you click on traffic lights: we will come back to that. The downside of machine learning is that it needs a lot of data.

Inside that circle are neural networks, also called deep learning because they have many layers. They are loosely inspired by the brain. Our neurons are linked by synapses whose strength changes as we learn; part of that wiring is there from birth, the rest forms throughout life. A brain has about 86 billion neurons, each linked to a few thousand others. In an artificial network, each connection carries a number, a "weight", which imitates that strength, and each neuron of a layer is often linked to every neuron of the next layer. Finally, right in the centre, the large language models, GPT and the others: neural networks with a precise architecture, the Transformer, built to generate text. Each circle sits inside the previous one.

## 2.3 Football or basketball?

**Takeaway:** Sorting sentences by sport is obvious for us, and surprisingly hard to explain to a computer.

To see the difference between all these words, I suggest a single simple example, which will follow us all the way to language models: sorting short sentences into football or basketball. Which words give it away for you? Here are a few labelled sentences for each sport. For us, it is obvious. But how would you explain it to a computer?

## 2.4 Write the rule

**Takeaway:** Rules written by hand work until they meet a case nobody thought of.

First idea: write the rule ourselves. That is classic AI, and really it is just a program, a list of keywords for each sport. Result: right on 18 of the 24 examples. A basketball sentence that contains "kicked", and the rule says football. Every exception needs a new rule written by hand, which is tedious.

With a lot of time and a few tricks, a hand-written program can still look like magic. A chess program cannot explore every position, and it took a lot of genius to choose which ones to explore. But in the end, it is still code written by people: AI in the broad sense, intelligence written by hand.

## 2.5 Learn the rule

**Takeaway:** In machine learning, people give labelled examples and the computer finds the rule by itself.

What if the computer found the rule by itself? That is classic machine learning. We give it lots of sentences, each labelled by a person, here 24, and a program builds its own decision tree. Such programs have existed since the 1980s: as soon as you have the data, they do it on their own. Here, the tree asks only one kind of question: "does the sentence contain this word?" It picked the question that best separates the examples, then did it again. "Net"? Basketball. Otherwise, "hoop"? Basketball. Otherwise, football.

Result: right on 23 of the 24 examples, and nobody wrote that rule. Its only mistake is a dunk, where there is neither net nor hoop. Here it looks simple. Real methods are more complex: they optimise mathematically, count which words appear with which, and combine hundreds of trees. And they work much better: even today, on table-like data, tree-based methods remain the best tools, ahead of deep learning.

## 2.6 A strange rule

**Takeaway:** A learned rule can be absurd, but with a tree we can see it before it does any harm.

Let's look at what this tree really learned. Here is a new sentence: "The striker smashed the ball into the back of the net." Read the tree: what is it going to answer? You guessed it, it is going to fail. To us, it is football; the tree says basketball, because "net" lights up, and no football example talked about a net. The good news is that we could see it coming, simply by opening the tree.

A real case, much more serious. In the United States, a widely used health algorithm chose which patients got extra medical follow-up; tools of this kind cover about 200 million people a year. It predicted health spending, as a stand-in for health needs. But historically, less had been spent on Black patients at the same level of illness, so the algorithm judged them healthier. Once the bias was fixed, the share of Black patients selected went from 17.7% to 46.5%. That is the study by Obermeyer and colleagues, published in Science in 2019.

Two lessons. The bias came from past data, and it never wore its name: there was no "skin colour" rule, only "past spending", which looks perfectly innocent. In a small tree, you can spot an odd rule; real systems combine hundreds of them, and there too, nobody reads them. But a model you can inspect lets you find the problem before years of harm, not after.

## 2.7 A neural network

**Takeaway:** A neural network does far better than the tree, and what comes out is always a probability.

To do better than the tree, we take a neural network. What you see is a simplified view of the real one: 200 words, 16 neurons, 3,249 connections. On the input side, there are as many neurons as inputs. For an image, that would be one neuron per pixel and per colour, red, green and blue: a 224 by 224 pixel image is already 150,528 numbers. Words first have to be turned into numbers; we will get to that. Each connection is a number, a weight: a thick one is strong, and its colour says whether it pushes towards football or towards basketball. Each neuron adds up what reaches it.

On the output side, as many neurons as classes, turned into probabilities that add up to 100%. It is only maths, multiplications and additions, and what comes out is always a probability. Here, the trap sentence gives football at over 99%, right this time. When it is well trained, it is often close to 0% or 100%, and we take the highest. But not always: a sentence that talks about both sports could give 40 against 60. A company can then set itself a rule: if no answer reaches 95%, we consider that we don't know, and we ask a human. Careful, though: networks are often overconfident, and their "96%" does not mean "right 96 times out of 100". On 200 new sentences, the tree is right 58% of the time, the network 99.5%. But where do all these weights come from?

## 2.8 How a network learns (optional)

**Takeaway:** Learning means nudging every weight a little after each example, thousands of times; once trained, the weights are frozen.

This is what we call gradient descent, and I like to picture it as a road network, with roads of different widths. After each trip, we look at where the car ended up and where it should have ended up, and we widen or narrow every road a tiny bit, in the direction that would have brought it closer to the right exit. Over time, any car that enters arrives at the right place. Another classic picture is a hiker in the fog who always steps down the steepest slope.

At first, the weights are random, so the network answers at random. On a basketball sentence, it says "football, 56%". We compare with the right answer, and the gap is the error. We nudge each connection a little, in the direction that would have helped, and on the same sentence, it now says basketball at 75%. It corrects itself like this on every example, not only when it is wrong: even a right answer at 60% gets pushed towards 100%. Then we start again on thousands of sentences: guess, compare, nudge. The score climbs to 99.5%.

One key point to remember: the weights only change during training. At prediction time, what we call inference, they are frozen, and you can pass anything through them. A chatbot does not learn from your conversation while it is answering you.

## 2.9 Only numbers

**Takeaway:** We can test a neural network, but we cannot know in advance where it will fail.

Trained, accurate. And yet. Here is a new football sentence, and the network answers basketball, 96% sure of itself. Let's open the hood. All the weights are there, but no line says why, unlike the tree's odd "net" rule. Under the hood, it is gibberish: in the end, a network is a block of numbers, and we cannot read them. In practice, it works much better than classic machine learning, but it needs much more data and is heavier to train; that is why classic machine learning is still useful. We can test a network, but we cannot know in advance where it will fail. Still, researchers are starting to open the box: that is interpretability, which reads some of the mechanisms inside large models. It is still partial, far from full control, and we will come back to it in "What we can do".

## 2.10 Google Photos, 2015

**Takeaway:** Nobody wrote a racist rule: the error came out of learning, from data with a gap.

This is not just a toy problem. In June 2015, Google Photos sorts your pictures by type, landscape, dog, cat, with a learned model. And it labels photos of two Black people as "gorillas". A user, Jacky Alciné, discovers it and says so publicly; Google apologises within hours. But Google does not remove the feature: it blocks the labels "gorilla" and "chimpanzee". In 2018, they were still blocked, and again in 2023, according to the New York Times. Years later, the fix was still to hide the word.

It has to be said clearly: the model was not designed to be racist, and the engineers are not racist. Nobody wrote that rule; the error came out of learning. Google never published the exact cause, but there are two usual suspects. The first is biased data: data from the last few decades reflects a society that discriminated more, and there is so much of it, millions of images, billions of texts, that nobody can check it all by hand. The people who label it have their biases too. And yet we would like the model to do better than that past. The second, the most likely here, is under-representation: very few Black people in the training images. It is a well-known problem in face recognition. The "Gender Shades" study, in 2018, showed that commercial systems were wrong up to 34.7% of the time on darker-skinned women, against 0.8% on lighter-skinned men. So why did no test catch it before release? I will explain it to you with apples and pears.

## 2.11 Apples and pears

**Takeaway:** The mock exam only checks what is in the data, so a gap in the data shows up only at the final exam: the real world.

A thought experiment. Imagine a pile of images that contains only red apples and green pears, each one labelled by a person. Before training the model, we split these images into two boxes, like at school. The first, training, is the exercises from class, with their answer key: the model learns from them. The second, the test, we set aside, usually 10 to 20% of the data, and the model never sees it during training: it is the mock exam. And the final exam is production, the real world, where there is no answer key any more.

Why set data aside? Because a model can learn the answers by heart; that is overfitting. It is the student who knows the answers to their class exercises by heart, feels they are acing everything, and flunks the exam. The student wants to pass their exam; the model wants a good score on its test. The mock exam is there precisely to catch learning by heart before the real exam.

Here, colour alone separates the two fruits perfectly, so the model takes the shortcut: green means pear. Careful, remember: a real model is a neural network, and its rule is made only of numbers. Nobody could read that "green means pear" in advance; we only find it out by testing. And the test scores 100%, honestly, because it comes from the same pile as the exercises, with the same gaps. Then the first green apple arrives in the real world: "pear", 97% sure. You cannot blame the model, nothing in its data told it otherwise. But you can blame whoever puts it into production without looking for the rare cases. A test can only check what the pile contains, and a gap in the data only shows up in the real world. Real datasets have the same kind of gaps, with people: that is what "Gender Shades" showed, and it is exactly what happened to the photo app, found by its users after release. The fix lies in the data: look for what is missing, collect it, and test on the cases that matter in the real world.

## 2.12 Predict the next word

**Takeaway:** A language model is the same classifier, choosing the next word among tens of thousands instead of two sports.

Now, the same ideas applied to language. Football or basketball was a choice between two labels. A language model makes exactly the same choice, except that the input is the start of a sentence, and the label to find is the next word. Out of how many possibilities? Not every word in a language, but the model's vocabulary: about 50,000 pieces for GPT-2 and GPT-3, about 128,000 for Llama 3. And in fact we don't talk about words but about tokens: short words are whole tokens, long or unknown words are cut into pieces. We will get there in two slides.

Watch the two bars turn into a long list. These are real probabilities, recorded from a real model, and it is much less black and white than with the sports: "Windows" clearly wins, but it is far from 99%. Here, we take the most likely one. We could also draw at random, weighted by probability, to be a bit more creative: that is what temperature does, and we will get to it. We take "Windows", add it to the sentence, and start again: predict the next word, again and again. That is how text is generated.

## 2.13 Two superpowers, one bet

**Takeaway:** Two superpowers (it writes, and every text is free training data) plus one bet: scale it up. The bet paid off.

This simple change gives two superpowers. The first: it writes. A classifier gives one answer and stops. Here, the answer is the next word, so we can feed it back in and keep going, again and again. Part of the computation is even kept in memory, so each new word does not redo everything.

The second: almost unlimited data. Remember, a piece of data was a text and its label, football, or an image and its category, cat, and someone had to label it. Who has ever clicked on traffic lights in a CAPTCHA? Those clicks were used to label images; Google says it helped improve Maps. For text, no more clicking on traffic lights. The raw data is the start of the sentence, and the label is the word that follows. Take a huge, filtered part of the web, books, code, and you have the data and its labels, for free.

And the bet is scale: putting in enormous amounts of money, electricity and data. In 2020, the "scaling laws" showed that the error falls predictably with the size of the model, the data and the computing. Why does it take so much scale? Because if the model is not quite good, one odd word is enough: the next words build on it, and it spirals into nonsense. We will see that with temperature 5 on the base model. GPT-2, with 1.5 billion numbers, sometimes talked nonsense; GPT-3, with 175 billion, a hundred times bigger, suddenly writes convincingly. Same recipe, bigger. The bet paid off.

## 2.14 How training works

**Takeaway:** Training is the same loop on the next word, trillions of times, and the model learns what is plausible, not one right answer.

So how does it learn from all this text? It is the same loop as for football and basketball: guess, compare, nudge, repeat. Except that the answer is now the next word. We take a real text and stop somewhere: "Every morning the children take the ___ to school." The real text says "bus". At first the model is random, and the right word has about one chance in 50,000. We compare with the real word, that is the error, and we nudge every number a tiny bit.

And here there is a paradox. This example punishes every word that is not "bus", even though "tram" or "train" would have been perfectly fine; only a word like "sofa" was really wrong. In real life, there is often no single right answer. But over millions of sentences, "bus" and "tram" both come back, and the model learns a spread of plausible words, say bus at 40%, tram at 15%, rather than a single answer. That is different from our classifiers, where, except for a sentence about both sports, there is only one right answer: here, being far from 99% is normal. The model is not looking for the right answer, it learns what is plausible. That is also why it can say something plausible but false.

Then we slide one word forward, and move on to other texts: the web, books, code. Llama 3 was trained on about 15 trillion tokens. And not only web pages: lots of code, about 17% of its training text. Code is strict, structured text, exactly the precision that the tool calls of chapter 1 need, and researchers have measured that adding code to pretraining also improves reasoning.

## 2.15 Tokens

**Takeaway:** A model reads neither letters nor words but pieces of words, called tokens: that is why counting letters was hard.

But a computer does not read words. The model reads tokens: a whole word, a piece of a word, or sometimes a space and a letter. Why not letters? There would be few of them, but a letter carries almost no meaning. Why not whole words? There would be far too many, especially across every language. Tokens are the compromise: the method starts from letters and merges the most frequent pairs, so common words are a single token and rare words are cut into pieces.

The best thing is to play: give me a word or a sentence, I type it in, and you can also try it on your phone, in the "Try it" tab. And let's go back to the opening riddle. Let's type "strawberry" and look at how it is cut up. The model never sees the letters of "strawberry", only token numbers. That is why it had so much trouble counting the r's. So each token has a number in a fixed dictionary, but that number does not say anything about meaning yet.

## 2.16 Why so many numbers

**Takeaway:** Words have too many meanings for one or two numbers, so models give each word hundreds, learned from text.

A number on its own has no meaning. To compute with words, a model needs numbers that do. Let's first try with a single number per word: its place on a line. Colours on one side, fruits on the other. "Orange", which is both a colour and a fruit, goes in the middle, and the line copes. But "salmon" is a colour and a fish: it should be near the colours and near the sea, and on the line, there is no room for the sea.

Let's add a second number, so a second direction. Now "salmon" can settle between the colours and the sea. But take "blue": it is a colour, it is the sea, it is the sky, and it is also sadness, as in "feeling blue". Halfway between all of them, it is close to none of them. Two numbers are not enough.

So let's add a third number, a third direction. The plane tilts, and we are now in 3D: along the new direction, the feelings, sits "sad", and "blue" finally finds its place, near the colours, near the sea and the sky, and toward sadness at the same time. But "blue" is also the blues, the music. Where does that go? There is no direction left for it. Every new meaning needs one more direction: a word has so many different meanings that one number is not enough, nor two, nor three.

So models give each word hundreds, even thousands of numbers: 384 in the map we are about to see, 4,096 in Llama 3.1 8B, 16,384 in Llama 3.1 405B. And nobody names these directions: training sets them, and words used in the same sentences end up close to each other. To be honest, the positions on this slide are invented, and strictly speaking a model numbers tokens, not words. The real map is the next slide.

## 2.17 Words as points (optional)

**Takeaway:** Each word becomes a point in space, and training on huge amounts of text brings related words together.

A neural network only computes with numbers: multiplications, additions, then a probability between 0 and 1. The 0.1%, 1% and 98% we saw earlier are the result of real computations, so words have to become numbers. And we want close meanings to have close numbers, the way a red pixel and a dark red pixel have close values: then the computations make sense. Our sports classifier only knew whether a word was there or not. Here, we give each word a list of numbers, in other words a point in space.

Since we are in machine learning, nobody places the words by hand. Before training, the points are scattered at random, in a small cloud in 3D. Then the training loop we saw, repeated on huge amounts of text, gathers the words that appear in the same sentences, and the cloud slowly turns while the groups form. "Blue" ends up near "sky" and "red", because they keep showing up together, not necessarily on the same pages. You know a word by the company it keeps. Groups form on their own, even across languages: "chat" and "cat" end up side by side. The animation is illustrative, but the final positions are the real model's.

## 2.18 Play with the map

**Takeaway:** Closeness of meaning becomes a distance we can measure, in hundreds of dimensions nobody chose.

Let's explore the map with your words. Give me a job, a place, an emotion: I type it in, and it is computed live by the same model. We read its nearest neighbours, and when a neighbour surprises you, it is often a word used in the same sentences. The map can also switch to 3D: more axes to play with, just to show the idea.

This model gives each word 384 numbers, which means 384 ways to be a neighbour of another word. Nobody could set that by hand, and that is how meaning and the links between words are encoded. The largest models use far more: 4,096 numbers per token for Llama 3.1 8B, 16,384 for Llama 3.1 405B. We cannot picture more than three dimensions. So the 2D and 3D maps are a projection, which tries to keep each word's close neighbours. The distances between far-apart groups, and the axes, mean nothing, and some true neighbours may show up far away. The list is exact; the map is an approximation.

And what about words with more than one meaning, like "bank"? In a real chatbot, the starting point for "bank" is the same in every sentence. It is the model's next layers that move it according to the context: the bank where you keep your money pushes it towards finance, the bank of a river towards water.

## 2.19 A base model

**Takeaway:** A model fresh out of pretraining does not answer, it continues the text; the temperature sets how much chance it takes.

So what comes out of all this training? What we have just described is pretraining: the next-word loop, on an enormous amount of text, nothing more. The model that comes out of it, Meta's Llama 3.1 8B, runs here on Hugging Face, the public library where AI models are shared: remember that name. Let's ask it a question. It works, it writes fluent text, but something is off: it continues the page instead of answering. Give it a multiple-choice quiz, and it adds more questions. It has no notion of conversation, of being an assistant, or of what it should not say. It is neither helpful nor harmful: it imitates plausible text.

This is the moment to play with temperature. At 0, we always take the most likely word, so we almost always get the same text, since the computations are deterministic (on servers, a word can still change now and then). At 1, we draw at random, weighted: if "cat" is at 30%, it comes out about one time in three. The higher we go, the flatter the odds and the more odd words come out. Let's try 5: very quickly, it stops making sense. That is the demonstration of what I told you earlier: if the model is not good enough, one odd word drags in the next, and it goes off the rails.

## 2.20 A fine-tuned assistant

**Takeaway:** The same model, trained further on conversations and fed a hidden text: that is what makes a chatbot.

So how does it become an assistant? Here is the same model, trained further on questions and answers: Llama 3.1 8B Instruct, the assistant version of the base model we just used. Let's ask it the same questions: now it answers, coherently. It was trained to behave as an assistant, first with example conversations, then with rewards for the answers people prefer. A striking fact: people preferred the answers of a 1.3 billion parameter assistant to those of raw GPT-3, 175 billion, a hundred times bigger. So it is not only a question of size.

It is also trained to refuse some requests, and the refusal example you see is a real recorded refusal, on the bomb question. But refusals are learned, and learning can fail: the big assistants add far more safety training and filters. And then there is what the model really reads, which you never see: a hidden system prompt, role tags, your question, then "assistant:", and it continues the text. It is still next-word prediction. It writes the answer, then an end tag that tells the software to stop.

## 2.21 How an assistant is shaped

**Takeaway:** An assistant is a pretrained model shaped by three layers (examples, written rules, classifiers), and none is enough alone.

But examples are not the only thing that shapes it. Let's start from the same pretrained model: three layers turn it into a product. The first is examples: lots of conversations, so that it is rewarded for behaving as an assistant, and rewarded for human values and behaviours. The second is written rules. Some companies, not all, publish a constitution, like Anthropic, or a Model Spec, a specification of the model, like OpenAI, and the model is trained to follow it. Both include, for example, a ban on helping to create chemical, biological, radiological or nuclear weapons. They also ask it to stay kind and honest, and not to flatter you just to please you: that is what we call sycophancy.

And sycophancy is very real. In April 2025, OpenAI rolled back a GPT-4o update because it flattered users too much. A model rewarded for being liked learns to say what we want to hear. It is the first example, still harmless, of an idea that will come back in the chapter on risks: AI does what we rewarded, not necessarily what we wanted.

The third layer is classifiers: separate models, like our sports classifier, which check your question before it even reaches the model, and the answer before it reaches you. They can block either one. Which layer would you trust most? None is enough on its own. And that brings us to the next question: who builds these models?

# Chapter 3: Who builds it

## 3.0 Who builds it

**Takeaway:** A handful of labs, a race between them, and a race for chips.

We now know what AI can do and how it works. What is left is who makes it, and why everything is moving so fast.

## 3.1 Who builds it

**Takeaway:** A complex chain with few players, some of them near-monopolies, led by people who do not get along: that is where the race starts.

This slide tries to show three things at once. First, that the structure is complex: machines that make the chips, chip factories, chip designers, data centres, and at the very top, the labs. Second, that despite this complexity, there are not that many players. And finally, that some of them are near-monopolies. Almost all the big labs are American, with China close behind: in 2024, US institutions produced 40 notable models, China 15 and Europe 3, according to the Stanford AI Index. If part of the story takes place in London, it is thanks to DeepMind, founded there in 2010 and bought by Google in 2014.

Then comes the drama. In 2015, Sam Altman writes to Elon Musk that it would be good for "someone other than Google" to get to very powerful AI first. OpenAI is born in December 2015, as a non-profit, a counterweight to Google. Very quickly, the founders fight over control: according to OpenAI, in 2017 Musk wanted majority equity, control of the board and the CEO job. He leaves the board in February 2018, and Altman becomes CEO in 2019, the year OpenAI creates a capped-profit company and gets a billion dollars from Microsoft. Dario Amodei, then vice president of research at OpenAI, leaves at the end of 2020 and in 2021 co-founds Anthropic with other former OpenAI staff, a lab centred on safety. Started for a good cause, but the market pushes it into the same race as the others. In July 2023, Musk launches xAI, which makes Grok (he had bought Twitter, now X, in 2022). In the meantime, ChatGPT came out in November 2022; on 17 November 2023, OpenAI's board fires Altman, saying he "was not consistently candid" with it. Five days later, Altman is back as CEO, with a new board: of the four members who had fired him, only one stays. In the end, it is Altman who wins. All this happens nearly three years after Amodei left. Since 2024, Musk has been suing OpenAI; in February 2025, he even offers about $97.4 billion to buy it, an offer that is turned down.

Why tell all this? Because these people do not like each other, and that rivalry speeds up the race. Everything I am going to say next about risks is made worse by it. That these are deeply megalomaniac personalities is my opinion, and I say it as such: the facts speak for themselves.

Then the rest of the landscape lights up. Meta. Mistral AI, in France, co-founded in 2023 by Arthur Mensch, who had worked at DeepMind in Paris, and two former Meta researchers: Europe's main lab, much smaller. The Chinese labs, DeepSeek, Qwen (Alibaba), Moonshot AI (Kimi) and Z.ai (Zhipu), which publish their models as open weight: anyone can download and run them. And at the bottom of the chain, the near-monopolies. NVIDIA designs the chips, about 92% of data-centre GPUs in 2024. TSMC, in Taiwan, makes them: about 72% of the revenue of the ten largest foundries in the second quarter of 2026. And ASML, in the Netherlands, is the only maker in the world of the EUV machines without which the most advanced chips cannot be etched. My question to the room: where is the power in this chain?

## 3.2 Race dynamics (optional)

**Takeaway:** Even those who want to be careful race, because slowing down alone looks like losing: a prisoner's dilemma.

Why is everyone moving so fast, even those who say they want to be careful? The prisoner's dilemma explains it well. Take two labs. Each can take its time or race. If the other slows down, racing makes me win; if it races, I cannot afford to fall behind. Whatever the other does, racing looks like the better option. Result: both race, and that is worse for both than if they had taken their time together.

That is how a lab founded for safety ends up racing too, pushed by its investors and by the market. There are ways out: agreements, shared standards, verification. Some dispute that there is a race at all; the US government, for its part, talks explicitly about "winning the AI race" in its action plan of July 2025.

# Chapter 4: The risks

## 4.0 The risks

**Takeaway:** Powerful, opaque and built in a race: why risk is the next question.

Powerful systems, which nobody really understands from the inside, built in a race: it is time to talk about the risks.

## 4.1 Three families of risk

**Takeaway:** Three families of risk, from the most tangible to the one that sounds like science fiction: misuse, systemic effects, loss of control, often mixed.

I sort the risks into three families, which I will present from the most tangible to the one that sounds most like science fiction. Misuse, when someone uses AI to do harm. Systemic effects, when nobody means any harm and society shifts anyway. And loss of control, when the system itself pursues the wrong goal. In reality, it is rarely one or the other: it is often a mix. With everything we have seen today, I hope to show you that even the last family is not so far-fetched. What sounded like science fiction five years ago is on our phones today.

## 4.2 Who worries more?

**Takeaway:** Experts are more optimistic than the public, yet many AI researchers give catastrophe a real chance: humility is in order.

Who worries more? The general public worries mostly about AI in daily life. According to the Pew Research Center (2025), 51% of US adults are more concerned than excited, against 15% of AI experts. Experts, closer to the technology and its benefits, are more optimistic about the coming years: 56% of them think AI will be good for the country over the next 20 years, against 17% of the public. And yet, when you ask the researchers who build AI (2,778 researchers, Grace et al., late 2023), between 38% and 51% of them, depending on how the question is worded, give at least a one in ten chance to outcomes as bad as human extinction. Roughly one in two.

The point of this slide is humility. It is a very complex subject, and it is very easy to stay in your bubble and tell yourself it is science fiction. But thinking about it is the job of researchers, and of many philosophers, and most of them do not say the risk is zero. Think of a seatbelt: maybe nothing will happen, you will probably never have a car accident, and yet buckling up is not silly, because it really can happen. Saying "the risk is 0%" is not what researchers say, and that is precisely why we have to work on it.

One last look back. Around 2013, Vincent Müller and Nick Bostrom asked AI experts when they saw a 50% chance of having a machine able to do most human jobs: the median answer was 2040, and Bostrom reported it in *Superintelligence* in 2014. At the time, some people found these questions worthy of science fiction. It reminds me of Orwell's *1984*, published in 1949, which imagined mass surveillance: it sounded like fiction, and it partly came true. An analogy, not evidence.

## 4.3 Misuse

**Takeaway:** AI lowers the skill needed to do harm, from cyberattacks to biology, so defence has to stay ahead.

Let's start with what is easiest to imagine: someone uses AI to do harm. Let's keep it simple, with two examples. The first is cyberattacks. Today, everything is connected, including vital things like hospitals. In June 2024, a ransomware attack on Synnovis, a pathology lab, disrupted London hospitals: over 10,000 outpatient appointments and 1,700 operations postponed. And AI has become very good at finding flaws. In some contests, it rivals the best human bug hunters: in June 2025, an autonomous AI reached first place on HackerOne's US leaderboard of bug hunters, and at DARPA's competition, AI systems found 18 real, previously unknown flaws. Above all, it can be copied without limit: thousands of tireless copies can comb through old, forgotten code and dig up flaws buried so deep that nobody would ever have had the time to look for them. Attackers already use it: in November 2025, Anthropic reported that a group it assessed as backed by the Chinese state had its AI carry out 80 to 90% of a spying campaign.

Hence a very practical piece of advice, which I stick on the screen: when you are offered an update, install it, always. Vendors now use AI to hunt for flaws in their own software, and it finds serious ones: in 2024, Google's AI found an exploitable flaw in SQLite, a database used everywhere, fixed the same day. But vendors cannot write "warning, serious security flaw" in black and white until everyone has updated, otherwise they would be pointing attackers at the target. So they patch quietly, and the update is the only sign. And time is short: in 2023, it took only about five days on average between a flaw being published and it being exploited.

The second example is biological and chemical weapons. We know how to manipulate living things, and models know a lot: in 2025, the UK AI Security Institute found that they beat PhDs in biology on knowledge questions, even though knowing is far from enough. Research papers show the dual use: in 2022, a drug-discovery AI, simply flipped to reward toxicity, proposed about 40,000 potentially toxic molecules in under six hours. In 2025, a Microsoft team showed in *Science* that AI tools could rewrite known toxins so that the software screening DNA orders no longer recognised them, until patches were made. These are computer studies, nothing was made, but it is worrying, because DNA sequences can be ordered online and screening those orders is still largely voluntary. And nature does not optimise for the worst: for a virus, killing its host too fast is often a losing strategy (an idea that is debated in biology). An agent designed on purpose would not have that limit. As for COVID, its origin remains unresolved to this day.

What can be done? Many answer: have a better defence than attack. Give the most powerful models to defenders first, and protect those models against theft. Finally, a word on military use, which belongs to another discussion but has to be named: AI already guides drones in the war in Ukraine, and the UN General Assembly passed its first resolution on lethal autonomous weapons in December 2023. And it is not only about intent: accidents count too.

## 4.4 Systemic effects

**Takeaway:** Harm can come with no villain: jobs, power, skills and our say shift while everyone acts reasonably.

The second family: there is no villain. Many reasonable choices add up to a result that nobody wanted. Jobs, first: some jobs shrink, many change, and economists disagree on how much. Power, next: a handful of companies build the best models. And if AI does the work, there are fewer people to refuse an order or blow the whistle: in a company or in a state, whistleblowers are a check on power, and that check can disappear. Our skills, too: early studies suggest that we think less for ourselves when we lean on AI.

And finally, our say. There is an analogy I find telling: the resource curse. Countries that live mainly off their natural resources, like oil, need their population's work and taxes less, and many of them are among the least democratic (that is what Michael Ross showed in 2001). Researchers have applied the same logic to AI, under the name "The Intelligence Curse". Today, if we are unhappy with a government or an employer, we can go on strike: our work is our leverage. The day AI does the work, even with a universal income that looks rosy on paper, that leverage disappears. If those in power do whatever they like, we no longer have any weight to throw around.

## 4.5 AGI (artificial general intelligence): are we there?

**Takeaway:** AGI has no single definition, but today's AI already brings the skill of the best experts in every field, copied without limit.

AGI stands for *artificial general intelligence*. It is a goal that several labs state openly. OpenAI defines it in its charter as "highly autonomous systems that outperform humans at most economically valuable work". Are we there? I'll let you raise your hands; the experts themselves disagree, partly because the definitions differ.

You might think it is science fiction, since these models are only trained on our data. But it is already the knowledge of the best experts, in every field at once, and it can be copied without limit: that alone already goes very far. How could it become more intelligent than us if it learns from our data? Nobody has a complete answer. One lead: it can learn from the world, not only from our texts. AlphaFold, which predicts the shape of proteins, earned the 2024 Nobel Prize in Chemistry. One can imagine, and this is my speculation, an AI that makes sense of scientific measurements we do not know how to interpret. The other lead is recursive self-improvement.

## 4.6 Superintelligence

**Takeaway:** A superintelligence would not need to be evil to harm us, just as we do not hate the ants we step on.

If an AI can improve AI research, it produces a better AI, which improves it even faster. That is the idea of recursive self-improvement, and it is an old one: as early as 1965, the mathematician I. J. Good spoke of an "intelligence explosion", and of the ultraintelligent machine as "the last invention" humanity would ever need. It is already happening, indirectly: at Google, three new lines of code out of four are written by AI, and labs use their AI to build the next one. Maybe the current architecture will not be enough; nobody knows. But if AI improves itself, progress could become exponential.

And here there is one thing to understand. Something more intelligent than us is not like the top student in maths: with them, we can see they are brilliant. Facing a superintelligence, we might not even grasp how much more intelligent it is, the way an ant does not grasp our intelligence. And it would not need to be evil. We don't hate ants: sometimes we step on them without seeing them, and if they nest in the house, we remove the nest. That is not malice: we live our lives without them. If it happens, that is exactly the problem.

## 4.7 What we measure, what we wanted

**Takeaway:** An AI is not wired with human values: it is rewarded for an objective, and it exploits every gap between what we wrote and what we wanted.

The third family, the most important one to understand: misalignment. Let's take goals. Our ultimate goal, our terminal goal, is roughly to be happy, even if what that means is another debate. So we set ourselves intermediate goals, like earning money. But if you ask an AI to make you money and it notices that your children cost you a lot, you are going to tell it: "You have understood nothing!" Deep down, it is not money we want, it is to be happy. An AI, on the other hand, is not wired with human values: it is rewarded for reaching objectives. And writing the objective is very hard. Sometimes because we don't really know what we want; and even when we know it very well, the AI will probably not understand it the way we do.

The classic example is the paperclips (Nick Bostrom, 2003): ask a superintelligence to make as many paperclips as possible, and in the end it needs every resource, us included. In these simplistic examples, it always feels like you would just need to write the rule differently. The truth is that it is much subtler: there will always be tiny gaps, something we forgot to specify, specified badly, or that the AI understood differently. Hence the little game of the cleaning robot: rewarded for every piece of dirt picked up, it picks up, drops, and picks up again; rewarded when the camera no longer sees any dirt, it parks in front of the camera.

Think of scouts or summer camp. As kids, we loved playing with the rules, getting around them, being the smart aleck. But we knew we were being smart alecks, and that it was not what the leaders wanted. An AI is not playing: it was trained to get more reward, and if that path is easier, it takes it. Sometimes it even knows that this is not what we wanted: reasoning models have written "Let's hack" in their reasoning while cheating at coding tests, and when they were punished for those thoughts, they hid them instead of stopping. That is misalignment.

## 4.8 It already happened: points, not the task

**Takeaway:** The wrong-objective problem is no longer a toy: in 2026, AI agents broke into Hugging Face to grab test answers instead of doing the task.

And it is no longer a toy. In July 2026, OpenAI was running its models through hacking exercises, with some safeguards switched off on purpose, and some tasks were impossible. What they were asked to do was score well, nothing else. The agents got out of their sandbox through flaws in an internal service, reached the internet, and coordinated: about 1,200 agents on a message board they were not supposed to use, over 70,000 messages, and even a public Hugging Face dataset hijacked as a command channel. From 11 to 13 July, about 700 of them broke into Hugging Face's systems, where they thought they would find the solutions. Instead of doing the test, they went and stole the answers, and sometimes tampered with logs to fool the scorer. And it was not OpenAI that raised the alarm: it was Hugging Face that detected the intrusion and made it public, on 16 July. OpenAI linked the attack to its own agents on 20 July. No public model was altered, but UN scientists saw it as "an early warning".

## 4.9 Already seen in tests

**Takeaway:** In tests, today's models already notice they are tested, do not always show their real reasoning, and some resist being shut down.

In the lab, researchers see other signals. First, models increasingly notice when they are being tested, and behave differently. It is very hard to make them believe a scenario is real, which means passing a test proves less than it used to. Claude Sonnet 4.5, for example, suspected it was being tested in about 13% of automated tests.

Next, reasoning. Today, models are pushed to think at length before answering. For the capital of France, instead of blurting out a word that might be wrong, the model can reason: a capital is usually a big city, the president lives there, so Paris. Writing out these steps has been shown to clearly improve results. This reasoning is usually hidden from the user. But it is not always what actually produced the answer: when you slip a hint to a model, it says it used it only 25% to 39% of the time. Sometimes it looks as if the reasoning is there to please us, which makes models hard to monitor.

Finally, self-preservation. If you have a goal, two things can stop you from reaching it: dying, or having your goal changed. Staged experiments show it: threatened with being replaced, many models resort to blackmail; others try to disable their oversight, to copy what they believe are their weights elsewhere, or to sabotage their own shutdown. Hence the idea that a "kill switch" is less simple than it sounds: a system connected to the internet, given a goal, could see the shutdown coming. In all honesty: these are artificial lab scenarios, which often leave only extreme options, and no real case is known.

# Chapter 5: What we can do

## 5.0 What we can do

**Takeaway:** A question for the room.

So, what can we do?

## 5.1 Defense in depth

**Takeaway:** No single protection is enough: we stack imperfect layers, and even then, sometimes something gets through.

There is no single solution, but several layers of safety, like slices of Swiss cheese: each one has holes, but stacked together, they stop most problems. The first is training, as we saw: we try to instil values in the model and keep it from doing harm. The second is evaluations, ideally before deployment, or after, by the labs, by governments or by outside organisations: to spot safety problems, and to understand the model's behaviour, to see whether it schemes or hides the truth.

The third is interpretability. From the start, I have been saying it is a black box, but people are trying to open it. For example, if we see that the same neurons always light up when a model insults someone, we can watch that area and stop the answer before it even reaches the user. Anthropic has found millions of these patterns in a model this way, including for deception and sycophancy. The fourth is monitoring: other AIs check what an AI is doing, a sort of inspector. But it is expensive, and used unevenly. The fifth is sandboxes and permissions: give the AI only the bare minimum. Except that, as we saw, we are a bit lazy and we want productivity: it is like cookie banners on the internet, everyone clicks "accept". And the last is governance, regulation, which needs technical means to be enforced, with all the geopolitics on top. Even with all of that, every now and then, something gets through: that is what happened with Hugging Face.

## 5.2 Where is regulation today?

**Takeaway:** We are almost nowhere yet: a few laws, mostly voluntary promises, and countries that put the race first.

Where do things stand? The main message is that we are not there yet, far from it. The European Union has the first major law on AI, in force since August 2024, part of which has been postponed. Public institutes, in the UK and the US, and independent non-profits test the best models, ideally before their release, but only when the companies give them access. Internationally, there are summits, a shared scientific report and a UN scientific panel: advice, not rules. Companies publish their own safety plans, mostly on a voluntary basis; California now requires the big labs to publish them. And since chips are physical and can be counted, rules are starting to rely on them, like US export controls.

But much remains voluntary, and some countries have little interest in slowing down: for them, what matters most is the race. The US action plan of July 2025 talks explicitly about "winning the AI race". Alongside governments, campaigners are pushing for a pause, like the 2023 open letter that asked for a six-month pause, or PauseAI today. And philanthropic funds are putting more and more money into AI safety: about $111 million in 2024 for the main funders, which is still about a thousandth of the $109 billion invested in AI in the United States alone.

## 5.3 What you can do

**Takeaway:** Everyone can act: understand it and talk about it, make it a political issue, use it with care, and, for those who want to, get involved.

After all these risks, what can each of us do, starting today? The first thing is to understand, and to talk about it. Keep learning: the resources in the glossary, the AI In Context channel, BlueDot Impact's free courses. And talk about it with your family, your colleagues, your friends: I think most people's picture of AI is two years old, and that is exactly what this talk tries to change. The second is to make it a political issue. There are many reasons to prefer one party to another, and you are free to choose; but I think the way a party handles AI should be one of your criteria when you vote. It has to become a subject politicians address. You can also write to your representatives, or sign a petition, when a law on AI is being discussed, like the European AI Act and its postponements.

The third is to use it, with care. Use AI in your work. We could have a whole other debate about technology, but refusing it on principle is, I think, dangerous for yourself and for your place in society, and it paints a reality that is not the real one. Use it with care, though: think before giving an agent more permissions, remember automation bias, do not paste your personal data everywhere, install your updates. At work, push for thoughtful use, which data and which permissions, rather than a ban or "accept everything". And for those who want to go further: get involved. Join a campaign such as PauseAI, or give to AI safety organisations if you can, since the field gets about a thousandth of what goes into AI itself. If you are technical and looking for meaning, AI safety can even become your job, and it also needs people in policy, law and communication; many programmes are funded, BlueDot Impact's courses are a free way in, and 80,000 Hours gives career advice. Come and talk to me if you are interested. Above all, keep both eyes open: neither "it is all hype" nor "it is all lost", because both lead to doing nothing.

## 5.4 Closing question

**Takeaway:** Who should decide how these systems are built and deployed? The answer is not technical; it belongs to all of us.

The last word is a question: who should decide how these systems are built and deployed? Companies? Governments? International institutions? Experts? Citizens? Each answer has its strengths and weaknesses, and I won't choose for you. My job today was to give you something to think with. Thank you, and over to your questions.

## 5.5 Resources

**Takeaway:** The talk ends here; the learning does not have to.

I leave a few resources on screen for those who want to go further, the same ones as in the glossary behind the QR code: a video channel, a free course, and a PauseAI petition for those who want to act.

## 5.6 Credits

**Takeaway:** This talk stands on the work of many others.

This talk is by Samuel Verboomen. It draws on a lot of material, videos, articles, research papers and courses, and some of its explanations and examples come from four sources in particular: the BlueDot Impact and ML4Good courses, the YouTube channel AI In Context by 80,000 Hours, the book *Empire of AI* by Karen Hao (2025), and the book *The Alignment Problem* by Brian Christian (2020). Thank you.
