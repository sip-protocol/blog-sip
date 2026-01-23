# SIP Protocol Blog Style Guide

Standards for writing and publishing articles on blog.sip-protocol.org.

## Article Types

### 1. Full Articles (Published)
Standard blog posts with complete frontmatter. These appear on the site.

### 2. Thread Drafts (Internal)
Twitter/X thread versions for social media. Filename: `*-thread.md`. Always `draft: true`.

---

## Frontmatter Requirements

Every published article MUST include these fields:

```yaml
---
title: 'Article Title: Subtitle Here'
description: 'One-sentence summary for SEO and social cards (150-160 chars ideal)'
pubDate: 'Jan 23 2026'
category: 'technical' # or: tutorials, announcements, thought-leadership
tags: ['tag1', 'tag2', 'tag3'] # 3-6 tags, lowercase
draft: false
author: 'SIP Protocol Team'
tldr: 'TL;DR summary in 1-2 sentences. Appears in TLDR box at top of article.'
keyTakeaways:
  - 'First key point readers should remember'
  - 'Second key point'
  - 'Third key point (3-5 total)'
targetAudience: 'Who this article is for (developers, investors, etc.)'
prerequisites:
  - 'What readers should know before reading'
  - 'Can be empty array [] for intro articles'
relatedPosts:
  - 'slug-of-related-post-1'
  - 'slug-of-related-post-2'
---
```

### Optional Fields

```yaml
updatedDate: 'Jan 25 2026'        # If article was updated
heroImage: './images/hero.png'    # Hero image (rarely used)
series: 'privacy-education'       # Series name
seriesNumber: 18                  # Position in series
canonicalUrl: 'https://...'       # If republished from elsewhere
noIndex: false                    # Hide from search engines
featured: true                    # Show on homepage featured section
```

---

## Categories

| Category | Use For |
|----------|---------|
| `technical` | Deep-dives on cryptography, architecture, protocols |
| `tutorials` | Step-by-step guides, code walkthroughs |
| `announcements` | Roadmaps, releases, milestones, partnerships |
| `thought-leadership` | Predictions, opinions, industry analysis |

---

## Writing Style

### Tone
- **Professional but accessible** — explain complex topics without jargon
- **Confident, not arrogant** — state facts, avoid hype
- **Educational** — readers should learn something

### Structure
1. **Hook** — engaging first paragraph (problem statement, provocative question, or bold claim)
2. **Context** — brief background (2-3 paragraphs max)
3. **Main content** — organized with clear h2/h3 headings
4. **Conclusion** — summary and call-to-action

### Formatting
- Use `##` for main sections, `###` for subsections
- Tables for comparisons
- Code blocks with language tags (```typescript, ```bash)
- ASCII diagrams for architecture (wrapped in ```)
- **Bold** for emphasis, *italics* sparingly
- Keep paragraphs short (3-5 sentences max)

### Code Examples
- Always include language identifier
- Keep examples concise and runnable
- Add comments for non-obvious lines
- Use realistic variable names

```typescript
// Good
const stealthAddress = sip.generateStealthAddress(recipientKey)

// Bad
const x = sip.f(k)
```

---

## SEO & Discoverability

### Title
- 50-60 characters ideal
- Include primary keyword
- Use colon for subtitle: "Main Topic: Specific Angle"

### Description
- 150-160 characters
- Summarize value proposition
- Include primary keyword naturally

### Tags
- 3-6 tags per article
- Lowercase, hyphenated if needed
- Mix broad (`privacy`, `solana`) and specific (`pedersen-commitments`)

---

## Related Posts

Always include 2-4 related posts:
- Prerequisite reading (link backward)
- Follow-up topics (link forward)
- Same series articles
- Complementary topics

```yaml
relatedPosts:
  - 'stealth-addresses-eip-5564'  # Uses slug, not filename
  - 'viewing-keys-compliance'
```

---

## Thread Drafts

For Twitter/X repurposing:

```yaml
---
title: "Twitter Thread: [Topic]"
description: "Twitter thread version for social media"
pubDate: 'Jan 23 2026'
draft: true  # ALWAYS true
author: 'SIP Protocol Team'
---
```

Format:
```markdown
# Twitter Thread

**Copy-paste ready for X/Twitter. Each section is one tweet.**

---

**Tweet 1 (Hook)**
[Tweet content, <280 chars]

---

**Tweet 2 (Context)**
[Tweet content]
```

---

## Pre-Publish Checklist

- [ ] All required frontmatter fields present
- [ ] `draft: false` for publication
- [ ] Description under 160 characters
- [ ] 3-6 relevant tags
- [ ] `relatedPosts` includes 2-4 articles
- [ ] All code blocks have language identifiers
- [ ] Links work (internal and external)
- [ ] No placeholder text remaining
- [ ] Spell-check completed
- [ ] Read aloud for flow

---

## File Naming

- Lowercase, hyphenated: `my-article-title.md`
- No dates in filename (use `pubDate` in frontmatter)
- Thread drafts: `original-article-thread.md`

---

## Images

- Store in `src/content/blog/images/` or use external URLs
- Always include alt text
- Optimize for web (< 500KB)
- Prefer diagrams over screenshots when possible

---

## Updates

When updating an existing article:
1. Add/update `updatedDate` field
2. Note significant changes at top if substantial revision
3. Keep original `pubDate` unchanged

---

*Last updated: January 2026*
