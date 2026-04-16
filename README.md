# Hex Brawl Knowledge Base

> A search-first static knowledge base for League of Legends Hex Brawl interaction questions. **Built with Claude Code agentic workflow.**

Search-first static knowledge site for Hex Brawl (海克斯大乱斗) interaction Q&A. Curated structured data, deterministic browser-side search, explicit confidence scoring and conflict resolution for community-disputed questions.

Powered by: Claude Code • LLM-assisted curation • Agent-driven development • Offline-first static architecture

## Features

- 🔍 **Instant search** - No backend required, all search runs in your browser
- 📊 **Confidence scoring** - Know how reliable each answer is
- ⚖️ **Conflict-aware** - Explicitly tracks when community splits on a question
- 🏷️ **Entity filtering** - Filter by champion, augment, mechanic, confidence
- ⌨️ **Keyboard-first** - `/` focus, `Esc` clear, arrow keys navigate
- 🔗 **Share-friendly** - Copy direct link to any question, OG tags for微信群 sharing
- 📦 **100% static** - Zero infrastructure, deploy anywhere

## Curated Coverage

- **195/195** - Full coverage of all Hex Brawl augments with curated effect summaries
- **1100+** - Searchable question/answer records
- **42** - Hand-curated high-frequency questions
- **8** - Structured community conflict records

## Handoff

- [Current handoff note](docs/handoff-2026-04-14.md)

## Commands

- `npm test`
- `npm run validate:data`
- `npm run build`
- `npm run serve`

## Local Preview

1. Run `npm run build`
2. Run `npm run serve`
3. Open `http://localhost:4173/`

## Project Philosophy

This project explores a hybrid approach: **LLM curates the knowledge, humans approve the structure, code delivers deterministic answers**. No real-time LLM inference needed — just fast, reliable search from curated data.

Built as an experiment in agentic software development where an AI Claude Code builds out the feature set incrementally from a high-level product spec.
