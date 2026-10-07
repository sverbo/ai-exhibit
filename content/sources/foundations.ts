import type { SourceRecord } from "@ai-exhibit/presentation-core";

/**
 * Sources for chapters 0 to 3: what deployed AI products can do (chapter 0),
 * and the models used by the local demos (chapters 2 and 3).
 */
export const foundationsSources: SourceRecord[] = [
  {
    id: "fnd-chatgpt-agent-system-card",
    title: "ChatGPT Agent System Card",
    url: "https://cdn.openai.com/pdf/839e66fc-602c-48bf-81d3-b21eacc3459d/chatgpt_agent_system_card.pdf",
    publisher: "OpenAI",
    date: "2025-07-17",
    retrieved: "2026-10-02",
    kind: "report",
    claim:
      "A publicly deployed agent product combines a remote visual browser, a terminal for running code and data analysis, and connectors to external apps, and is trained to ask the user for confirmation before finalizing actions such as completing a purchase or sending an email.",
    evidence: "observed",
    verification: "verified",
    notes:
      "Introduction lists the tools (visual browser, terminal with limited network access, Connectors). Section 3.2.2.1 'User confirmations' gives purchases and emails as examples of confirmed actions. The openai.com product page returned 403 to automated fetches; the PDF was read instead.",
  },
  {
    id: "fnd-claude-computer-use-docs",
    title: "Computer use tool (Claude API documentation)",
    url: "https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/computer-use-tool",
    publisher: "Anthropic",
    retrieved: "2026-10-02",
    kind: "documentation",
    claim:
      "A commercially available model can operate a desktop computer: it takes screenshots and controls the mouse and keyboard.",
    evidence: "observed",
    verification: "verified",
    notes: "Docs describe screenshot capabilities and mouse/keyboard control for autonomous desktop interaction.",
  },
  {
    id: "fnd-claude-tool-use-docs",
    title: "Tool use with Claude (Claude API documentation)",
    url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview",
    publisher: "Anthropic",
    retrieved: "2026-10-02",
    kind: "documentation",
    claim:
      "The model itself decides when to call a tool, based on the request and the tool's description, and returns a structured call that software executes; results are sent back to the model. Available tools include web search, web fetch and sandboxed code execution for data analysis.",
    evidence: "observed",
    verification: "verified",
  },
  {
    id: "fnd-claude-code-docs",
    title: "Claude Code overview (documentation)",
    url: "https://code.claude.com/docs/en/overview",
    publisher: "Anthropic",
    retrieved: "2026-10-02",
    kind: "documentation",
    claim:
      "An agentic coding tool reads a codebase, edits files, runs commands, plans and verifies changes, and can be started on long-running tasks that the user checks back on later.",
    evidence: "observed",
    verification: "verified",
  },
  {
    id: "fnd-claude-for-chrome",
    title: "Claude for Chrome",
    url: "https://claude.com/blog/claude-for-chrome",
    publisher: "Anthropic",
    date: "2025-08",
    retrieved: "2026-10-02",
    kind: "documentation",
    claim:
      "A browser extension lets a model navigate websites, click, fill forms and act on the user's behalf, and asks before high-risk actions such as publishing, purchasing or sharing personal data.",
    evidence: "observed",
    verification: "verified",
    notes:
      "Pilot announced August 2025; the page says availability expanded to paid plans by December 2025. Same page reports prompt-injection red-teaming results, useful for chapter 4/5 but not used here.",
  },
  {
    id: "fnd-google-ap2",
    title: "Announcing Agent Payments Protocol (AP2)",
    url: "https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol",
    publisher: "Google Cloud",
    date: "2025-09-16",
    retrieved: "2026-10-02",
    kind: "documentation",
    claim:
      "An open protocol, backed by Google and payments companies, is designed so AI agents can initiate payments on a user's behalf, with cryptographically signed 'mandates' recording what the user authorized (for example a price limit).",
    evidence: "observed",
    verification: "verified",
    notes: "Supports the existence of infrastructure for agent payments under authorization, not the scale of its adoption.",
  },
  {
    id: "fnd-anthropic-constitutional-classifiers",
    title: "Constitutional Classifiers: Defending against universal jailbreaks",
    url: "https://www.anthropic.com/research/constitutional-classifiers",
    publisher: "Anthropic",
    date: "2025-02-03",
    retrieved: "2026-10-02",
    kind: "paper",
    claim:
      "Model providers deploy separate classifiers that screen both user inputs and model outputs, as one layer of protection on top of the model's own training.",
    evidence: "observed",
    verification: "verified",
  },
  {
    id: "fnd-smollm2-model-card",
    title: "SmolLM2-135M model card",
    url: "https://huggingface.co/HuggingFaceTB/SmolLM2-135M",
    publisher: "Hugging Face",
    retrieved: "2026-10-02",
    kind: "documentation",
    claim:
      "The base model used in the live demos has 135 million parameters, was trained on 2 trillion tokens, is Apache-2.0 licensed, and primarily understands and generates English.",
    evidence: "none",
    verification: "verified",
  },
  {
    id: "fnd-smollm2-135m-config",
    title: "SmolLM2-135M config.json",
    url: "https://huggingface.co/HuggingFaceTB/SmolLM2-135M/blob/main/config.json",
    publisher: "Hugging Face",
    retrieved: "2026-10-02",
    kind: "documentation",
    claim:
      "In the demo model each token becomes a vector of 576 numbers; the vocabulary has 49,152 tokens; the network has 30 layers.",
    evidence: "none",
    verification: "verified",
    notes: "hidden_size 576, vocab_size 49152, num_hidden_layers 30.",
  },
  {
    id: "fnd-instructgpt",
    title: "Training language models to follow instructions with human feedback",
    url: "https://arxiv.org/abs/2203.02155",
    publisher: "arXiv (OpenAI)",
    authors: ["Long Ouyang", "Jeff Wu", "Xu Jiang", "et al."],
    date: "2022-03-04",
    retrieved: "2026-10-02",
    kind: "paper",
    claim:
      "Post-training a pretrained model on human demonstrations and then on human preference rankings (RLHF) makes it far better at following instructions: human raters preferred a 1.3B-parameter post-trained model over the 175B base GPT-3.",
    evidence: "evaluation",
    verification: "verified",
  },
  {
    id: "fnd-minilm-multilingual-model-card",
    title: "paraphrase-multilingual-MiniLM-L12-v2 model card",
    url: "https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    publisher: "Hugging Face / sentence-transformers",
    retrieved: "2026-10-02",
    kind: "documentation",
    claim:
      "The embedding model behind the word map turns a word or sentence into a vector of 384 numbers, covers 50 languages, and is built for similarity and semantic search.",
    evidence: "none",
    verification: "verified",
    notes: "The demo runs the ONNX conversion Xenova/paraphrase-multilingual-MiniLM-L12-v2.",
  },
  {
    id: "fnd-qwen25-model-card",
    title: "Qwen2.5-0.5B model card",
    url: "https://huggingface.co/Qwen/Qwen2.5-0.5B",
    publisher: "Qwen team, Alibaba Cloud (Hugging Face)",
    retrieved: "2026-10-02",
    kind: "documentation",
    claim:
      "The base model used in the French live demos has 0.49 billion parameters, supports over 29 languages including French, and is Apache-2.0 licensed.",
    evidence: "none",
    verification: "verified",
  },
  {
    id: "fnd-qwen25-config",
    title: "Qwen2.5-0.5B config.json",
    url: "https://huggingface.co/Qwen/Qwen2.5-0.5B/blob/main/config.json",
    publisher: "Qwen team, Alibaba Cloud (Hugging Face)",
    retrieved: "2026-10-02",
    kind: "documentation",
    claim:
      "In the French demo model each token becomes a vector of 896 numbers; the vocabulary has 151,936 entries; the network has 24 layers.",
    evidence: "none",
    verification: "verified",
    notes: "hidden_size 896, vocab_size 151936, num_hidden_layers 24.",
  },
  {
    id: "fnd-claude-google-workspace",
    title: "Claude takes research to new places (Google Workspace integration)",
    url: "https://claude.com/blog/research",
    publisher: "Anthropic",
    date: "2025-04-15",
    retrieved: "2026-10-02",
    kind: "documentation",
    claim:
      "A commercially available assistant connects to a user's Gmail, Google Calendar and Google Docs: it can search emails, review documents and see calendar commitments.",
    evidence: "observed",
    verification: "verified",
    notes:
      "Page says Claude 'now integrates with Gmail and Calendar, in addition to Google Docs' and 'can securely search emails, review documents, and see your calendar commitments'. anthropic.com/news/research redirects here.",
  },
  {
    id: "fnd-gemini-messages-android",
    title: "Send text messages with the Gemini mobile app on Android (Gemini Apps Help)",
    url: "https://support.google.com/gemini/answer/15574940",
    publisher: "Google",
    retrieved: "2026-10-02",
    kind: "documentation",
    claim:
      "A commercially available assistant on Android phones can send text messages for the user through the phone's default messaging app.",
    evidence: "observed",
    verification: "verified",
    notes:
      "Same help page lists limits: it cannot read or reply to existing messages, cannot message group chats, and messages it creates are not end-to-end encrypted. A sibling page (answer/15574928) covers calls and messages on WhatsApp.",
  },
  // Slide 1.7, "No memory": what a model really receives at every message.
  {
    id: "fnd-claude-messages-stateless",
    title: "Using the Messages API (Claude API documentation)",
    url: "https://platform.claude.com/docs/en/build-with-claude/working-with-messages",
    publisher: "Anthropic",
    retrieved: "2026-10-07",
    kind: "documentation",
    claim:
      "The model keeps nothing between requests: the API is stateless, so the application sends the full conversation history with every new message.",
    evidence: "observed",
    verification: "verified",
    notes:
      "Section 'Multiple conversational turns': 'The Messages API is stateless, which means that you always send the full conversational history to the API.' The page also shows that earlier turns can be written by the application ('synthetic assistant messages'). That the model's weights do not change while you chat is our plain-words explanation of this statelessness; the page does not use those words.",
  },
  {
    id: "fnd-claude-context-windows",
    title: "Context windows (Claude API documentation)",
    url: "https://platform.claude.com/docs/en/build-with-claude/context-windows",
    publisher: "Anthropic",
    retrieved: "2026-10-07",
    kind: "documentation",
    claim:
      "The context window is the model's working memory, separate from its training data. At each turn, the input holds all previous conversation history plus the new message, and the system prompt and tool definitions count too. Chat interfaces can drop the oldest part first; compaction summarizes earlier parts so a conversation can continue past the limit.",
    evidence: "observed",
    verification: "verified",
    notes:
      "Quotes: the context window 'is different from the large corpus of data the language model was trained on, and instead represents a \"working memory\" for the model'; 'Input phase: Contains all previous conversation history plus the current user message'; 'Everything in the request counts toward the context window: the system prompt, every message in messages (including tool results, images, and documents), and your tool definitions'; footnote: 'Chat interfaces such as claude.ai can also manage the context window on a rolling \"first in, first out\" basis'; 'Compaction automatically summarizes earlier parts of the conversation on the server, so the conversation can continue past the context window limit.'",
  },
  {
    id: "fnd-claude-tool-use-system-prompt",
    title: "Define tools: tool use system prompt (Claude API documentation)",
    url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools",
    publisher: "Anthropic",
    retrieved: "2026-10-07",
    kind: "documentation",
    claim:
      "When an application gives a model tools, the descriptions of those tools are written into a system prompt that the model receives with the request.",
    evidence: "observed",
    verification: "verified",
    notes:
      "Section 'Tool use system prompt': 'When you call the Claude API with the tools parameter, the API constructs a special system prompt from the tool definitions, tool configuration, and any user-specified system prompt.' The template shown includes '{{ TOOL DEFINITIONS IN JSON SCHEMA }}' and '{{ USER SYSTEM PROMPT }}'. The tool use overview (fnd-claude-tool-use-docs) adds that tool names, descriptions and schemas are billed as input tokens.",
  },
  {
    id: "fnd-claude-app-system-prompts",
    title: "System prompts (Claude release notes)",
    url: "https://platform.claude.com/docs/en/release-notes/system-prompts",
    publisher: "Anthropic",
    retrieved: "2026-10-07",
    kind: "documentation",
    claim:
      "Chat apps give the model a system prompt the user does not see, with up-to-date information such as the current date and instructions on how to behave and what to avoid; Anthropic publishes the one used in its own apps.",
    evidence: "observed",
    verification: "verified",
    notes:
      "Overview: 'Claude's web interface (claude.ai) and mobile apps use a system prompt to provide up-to-date information, such as the current date, to Claude at the start of every conversation. The system prompt also encourages certain behaviors' and 'These system prompt updates do not apply to the Claude API.' The Claude Opus 5.5 prompt dated September 22, 2026 (page claude-opus-5-5) holds a date placeholder ('{{currentDateTime}}') and instructions such as 'Claude never curses unless the person asks or curses a lot themselves'. It also lists the memory settings ('Search and reference past chats, generate memory from chat history').",
  },
  {
    id: "fnd-claude-memory-help",
    title: "Use Claude's chat search and memory to build on previous context (Claude Help Center)",
    url: "https://support.claude.com/en/articles/11817273-how-does-claude-s-memory-work",
    publisher: "Anthropic",
    retrieved: "2026-10-07",
    kind: "documentation",
    claim:
      "\"Memory\" in chat apps is a feature around the model: the app saves notes from your chats and carries them into new conversations, and it can search past chats when needed, as a tool call.",
    evidence: "observed",
    verification: "verified",
    notes:
      "Quotes: 'Claude can also remember context from your chats and carry it into new conversations'; 'Claude saves memory as a set of individual topics as you chat, rather than summarizing conversations after they end. Mention that a deadline moved, and your next conversation already knows.'; past-chat searches 'use Retrieval-Augmented Generation (RAG) and will appear as tool calls during your conversations'; 'With the addition of memory, Claude transforms from a stateless chat interface into a knowledgeable collaborator'. Memory can be paused, reset or turned off per chat.",
  },
  {
    id: "fnd-anthropic-2025-consumer-terms",
    title: "Updates to Consumer Terms and Privacy Policy",
    url: "https://www.anthropic.com/news/updates-to-our-consumer-terms",
    publisher: "Anthropic",
    date: "2025-08-28",
    retrieved: "2026-10-07",
    kind: "documentation",
    claim:
      "Depending on the provider, the plan and your settings, your conversations may be used later to train new models; this is a separate, later training run, not the model learning while you chat.",
    evidence: "observed",
    verification: "verified",
    notes:
      "Quotes: 'We will train new models using data from Free, Pro, and Max accounts when this setting is on'; users choose in their privacy settings; 'These updates do not apply to services under our Commercial Terms', including Team and Enterprise plans and the API; 'If you delete a conversation with Claude it will not be used for future model training.' One provider's policy, as of the retrieval date: other providers have their own settings.",
  },
];
