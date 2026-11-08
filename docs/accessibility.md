# Accessibility audit — public site

**Target:** WCAG 2.2 Level AA (covers Section 508, which references WCAG 2.0 AA, and the
ADA Title II rule, which references WCAG 2.1 AA).
**Scope:** the public site under `src/app/(frontend)`. The Payload admin is out of scope.
**Method:** code review of every page and component, with contrast ratios calculated
from the actual color tokens. The site could not be run during the audit (no database
in the review environment), so the findings still need a pass with a real browser and
screen reader. See "Verify before calling it done" below.

## Already in place before the audit

- A "Skip to main content" link on every page, and a `<main id="main-content">` target
  in every layout.
- A visible keyboard focus ring throughout the site (`.tr :focus-visible`).
- `prefers-reduced-motion` support site-wide.
- `lang="en"`, a `.sr-only` utility class, and labeled controls in the audio/video player.

## What was fixed

### Color contrast (1.4.3 text, 1.4.11 non-text)

| Item | Before | After |
|---|---|---|
| Muted gray text (`--ink-mute`, light theme) on paper / paper-3 | 4.48 / 3.74 | 5.64 / 4.71 |
| Small gold labels and numbers (`--gold-deep`, light theme) | 3.10 | 5.64 |
| Placeholder text in form fields | 2.43 | 5.64 |
| Form field borders | 1.3–1.6 | 3.4 (new `--field-border` token) |
| Footer subscribe field border, on wine | 2.04 | 3.63 |
| Magazine muted text on paper-2 | 4.22 | 5.16 |
| Tailwind `text-obsidian/30–60`, `text-gold` on parchment | 1.9–4.3 | 4.8–6.0 |
| Non-matching Academy cards (faded with opacity) | ~2.1 | full contrast; the card background recedes instead |
| Invalid-field border | none | red border, 4.1 in both themes |

### Focus and keyboard (2.1.1, 2.4.3, 2.4.7, 2.4.11)

- The focus ring is gold on the dark surfaces (utility bar, footer, sky hero, Academy
  beta band, magazine header), where the wine ring was invisible.
- Escape closes every dropdown and mobile menu and returns focus to the button that
  opened it.
- The magazine issues drawer is `inert` when closed, so Tab no longer reaches its hidden
  links.
- Dialogs keep focus trapped; before, a re-render sent focus back to the trigger.
- Focus moves to the confirmation message after a successful form submission, and into
  the player after a video is opened.
- The Mechanism Explorer tabs and the case-form toggle work with the arrow keys.
- Minimum 24px target size for the Academy "reset" control (2.5.8).

### Screen readers (1.1.1, 1.3.1, 2.4.4, 2.4.6, 4.1.2, 4.1.3)

- The research nav was marked up as an ARIA application menu without the keyboard
  behavior that requires; it is now plain, labeled link groups.
- Links to the current page carry `aria-current="page"`.
- Form errors are marked `aria-invalid`, linked to their message, and announced, and
  focus moves to the first missing field. Status messages use live regions that are
  always present in the page.
- Fields have `autocomplete` values (1.3.5), and optional fields are labeled "(optional)".
- Chart summaries and "key moment" markers are exposed as text, not color alone (1.4.1).
- Repeated links ("Read", "Register", "Watch & listen", "Course details") now say what
  they lead to. Links that open a new tab say so.
- Heading levels: one `h1` per page (an `h1` written in the CMS body now renders as
  `h2`), and skipped levels are fixed (footer `h5` → `h2`, list titles `h4` → `h3`, plus
  hidden section headings where a level was missing).
- Labels added to the audio player, the scheduler iframe and the video iframes, and
  decorative marks and placeholders are hidden from assistive technology.

## Needs a person (content or third-party)

1. **Captions and transcripts (1.2.2, 1.2.3, 1.2.1).** Every Cloudflare Stream video
   needs a caption track uploaded; the player only shows CC when a track exists. Every
   podcast episode needs a transcript in the CMS. YouTube embeds rely on captions
   already being on the YouTube videos.
2. **Alt text in the CMS (1.1.1).** Images in the Media collection, briefing covers and
   magazine hero/column images need meaningful alt text wherever the image carries
   meaning. Covers that include words need those words in the alt text.
3. **Cal.com scheduler.** It is a third-party embed; test it with a keyboard and a screen
   reader. The "open in a new tab" link is the fallback.
4. **Outcome chart colors.** Steps within a bar are told apart by color, with a text
   legend and a "View as table" alternative. Check that adjacent steps meet 3:1 against
   each other, or add separators between segments.
5. **Magazine "Play" button.** On the Commentary section it does nothing; wire it up or
   remove it.
6. **Very small type.** Some 9–10.5px uppercase labels pass contrast but are hard to read.
   Consider raising them to at least 12px.
7. **No custom 404 page** under `(frontend)`, so a missing issue shows Next's default
   page with no skip target.

## Verify before calling it done

- Run axe DevTools or Lighthouse on the home, research, academy, advisory/conversation,
  contact, a case file and a podcast episode, in both light and dark themes.
- Keyboard-only pass: Tab through each page, open and close every menu and dialog,
  and submit each form with errors and then successfully.
- A screen-reader pass with VoiceOver (Safari) or NVDA (Firefox/Chrome) on the forms,
  nav, Mechanism Explorer and media player.
- Zoom to 200% and 400% and check for clipped content or horizontal scrolling
  (1.4.4, 1.4.10).

## Keeping it accessible

- Use the tokens (`--ink-mute`, `--gold-deep`, `--field-border`), not lighter custom
  grays or golds, for text and field borders.
- Don't dim content with `opacity`; it lowers text contrast.
- Every new image needs alt text (or `alt=""` if decorative), every field a `<label>`,
  and every icon-only button an `aria-label`.
