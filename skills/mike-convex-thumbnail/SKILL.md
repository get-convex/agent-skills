---
name: mike-convex-thumbnail
description:
  Generate Mike-style YouTube thumbnail concepts and final drafts for Convex
  videos using Mike's local head-and-shoulders photo cutouts and local Convex
  logo assets. Use when the user asks for thumbnails, YouTube thumbnails, video
  thumb options, or a thumbnail like the Convex static hosting "NO DASHBOARDS"
  example.
---

# Mike Convex Thumbnail

Create polished YouTube thumbnails for Mike's Convex/dev videos using the image
model, Mike's local cutout photos, and local Convex brand assets.

## When to Use

- Creating YouTube thumbnail options for a Convex or developer video.
- Reworking the Convex static hosting "NO DASHBOARDS" thumbnail.
- Making a thumbnail that must include Mike's recognizable head-and-shoulders
  portrait.
- Replacing an incorrect generated mark with the real Convex logo or symbol.

## When Not to Use

- Generic thumbnail advice with no image generation requested.
- Non-Convex videos unless Mike explicitly wants the same personal thumbnail
  style.
- Deterministic compositing in code, unless Mike explicitly asks for a manual
  layout. The manual collage route looked bad for this style.

## Core Workflow

1. Inspect the available local references before prompting the image model:
   - Run `scripts/check-local-assets.ps1` from this skill if the paths may have
     moved.
   - Use `view_image` on at least one Mike headshot and the Convex symbol before
     calling the image model.
2. If the user provided a script, Notion page, or video brief, extract the main
   hook first. Keep the thumbnail concept simple enough to read at feed size.
3. Use the image model for the thumbnail. Do not build the main image by
   manually pasting cutouts and cards together unless the user asks for that.
4. Keep text short. Prefer one strong phrase such as `NO DASHBOARDS`,
   `HOST ON CONVEX`, `STATIC APP LIVE`, or `SKIP HOSTING`.
5. Prompt for Mike as a large recognizable head-and-shoulders portrait, not a
   full-body figure.
6. Prompt the Convex logo as a brand reference. If a generated logo is wrong,
   explicitly say to replace any cube or hexagon mark with the official Convex
   swirl symbol.
7. Return 3 to 5 visually distinct options when brainstorming. If Mike points at
   one option, iterate that option instead of restarting the set.

## Local Paths

Use these current local paths on Mike's machine:

| Purpose                                   | Path                                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| Mike cutout photo folder                  | `G:\My Drive\Personal\Photos of Me\convex\Backgrounds Removed`                               |
| Primary Convex symbol                     | `C:\Users\mikec\Assets\Images\symbol-color (1).png`                                          |
| Convex color logo                         | `C:\Users\mikec\Assets\Images\logo-color.png`                                                |
| Convex white wordmark                     | `C:\Users\mikec\Assets\Images\wordmark-white.png`                                            |
| Convex white symbol                       | `C:\Users\mikec\Assets\Images\symbol-white.png`                                              |
| Static hosting liked reference screenshot | `C:\Users\mikec\AppData\Local\Temp\codex-clipboard-2e3ea2e2-5464-460f-86f3-f4c4bcd6f731.png` |

The temp screenshot path may disappear. If it is missing, recreate the concept
from the recipe in `references/static-hosting-thumbnail.md`.

## Preferred Mike References

Use the folder above. These files worked well in the static hosting session:

| File                            | Best use                              |
| ------------------------------- | ------------------------------------- |
| `WIN_20250626_10_41_38_Pro.png` | Skeptical or "no dashboards" side-eye |
| `WIN_20250626_10_39_35_Pro.png` | Friendly/excited host-on-Convex idea  |
| `WIN_20250701_07_35_49_Pro.png` | Excited, looking up at a concept      |
| `WIN_20250701_07_36_01_Pro.png` | Smiling explainer pose                |
| `WIN_20250701_07_34_53_Pro.png` | Looking right with gesture            |

## Prompt Patterns

### Bad

```text
Make a thumbnail about Convex hosting with Mike and some dashboard stuff.
```

This lets the model invent Mike, invent the logo, and create clutter.

### Good

```text
Use case: ads-marketing
Asset type: YouTube thumbnail edit, 16:9 landscape
Primary request: Create a polished version of the provided thumbnail image.
Keep Mike on the left, big "NO DASHBOARDS" text, blurred generic dashboard
panels with red X marks in the middle, and a glowing live hosting card on the
right.
Input image roles: Use the provided thumbnail as composition/style reference.
Use the visible Mike photo as identity reference. Use the visible Convex
colored swirl symbol as the exact brand/logo reference.
Required change: Replace any cube or hexagon mark on the right-side card with
the official Convex colored swirl symbol. The card can say "convex.site" and
"Live".
Constraints: Head and shoulders only. Preserve Mike's recognizable face and
black Convex cap. Keep the text exactly "NO DASHBOARDS". No real third-party
logos. No watermark.
Avoid: fake logo, misspelled text, extra words, cluttered UI, distorted face,
extra fingers, cheap collage look.
```

## Static Hosting Recipe

Read `references/static-hosting-thumbnail.md` when the user asks for a thumbnail
like the Convex static hosting example or when the requested video is about
static hosting, `convex.site`, hosting without Vercel/Netlify/Cloudflare, SPA
fallback, CI deploys, custom domains, or update banners.

## Checklist

- [ ] Loaded or inspected a Mike headshot from the local photo folder.
- [ ] Loaded or inspected the real Convex symbol or wordmark.
- [ ] Used the image model for the main thumbnail draft.
- [ ] Kept the visible text short and exact.
- [ ] Preserved Mike's recognizable head-and-shoulders identity.
- [ ] Avoided real third-party hosting provider logos unless Mike explicitly
      asked for them.
- [ ] Replaced any generated cube/hexagon logo with the real Convex swirl.
