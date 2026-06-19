# Static Hosting Thumbnail Recipe

Use this recipe for the Convex Static Hosting Component thumbnail style Mike
liked.

## Main Visual

- Mike large on the left, head and shoulders, recognizable face, black Convex
  cap visible.
- Big text: `NO DASHBOARDS`.
- Background: dark, cinematic tech scene.
- Middle: blurred generic hosting/dashboard panels with red X marks.
- Right: glowing card with the real Convex colored swirl, `convex.site`, and a
  small `Live` badge.
- Add a white arrow from the dashboard mess toward the Convex hosting card.

## Why It Works

- The hook is immediately understandable: skip dashboard pain.
- The red X marks and "NO DASHBOARDS" text carry the frustration.
- The right-side `convex.site` card makes the destination obvious.
- The real Convex swirl matters. If the model makes a cube, hexagon, or generic
  hosting mark, fix that in the next prompt.

## Prompt Template

```text
Use case: ads-marketing
Asset type: YouTube thumbnail edit, 16:9 landscape
Primary request: Create a polished YouTube thumbnail for a video about the
Convex Static Hosting Component.
Input image roles: Use the visible Mike photo as identity reference. Use the
visible Convex colored swirl symbol as the exact brand/logo reference.
Subject: Mike must appear as a large recognizable head-and-shoulders portrait
on the left, black Convex cap visible, skeptical side-eye expression, hand pose
kept if available.
Concept: Avoiding third-party hosting dashboard pain. Show generic blurred
dashboard panels and settings cards in the middle/background with red X marks,
then a clear arrow to a glowing Convex hosting card on the right.
Right card: Use the official Convex colored swirl symbol, not a cube or
hexagon. The card can say "convex.site" and "Live".
Text (verbatim): "NO DASHBOARDS"
Style/medium: premium tech YouTube thumbnail, cinematic lighting, crisp
editorial compositing, bold depth, high contrast, polished and punchy.
Color palette: dark black background, Convex red/yellow/purple glow, white
text, red X marks.
Constraints: very little text; text must be exactly "NO DASHBOARDS"; preserve
Mike's recognizable face and cap; no real third-party logos; keep the right
card readable.
Avoid: fake logo, cube logo, hexagon logo, misspelled text, extra words,
cluttered UI, distorted face, extra fingers, watermark, cheap collage look.
```

## Alternate Hooks

Use these only when the video angle changes:

| Hook                | Thumbnail text    | Visual angle                                    |
| ------------------- | ----------------- | ----------------------------------------------- |
| Hosting on Convex   | `HOST ON CONVEX`  | Static app files flying into Convex             |
| Live app            | `STATIC APP LIVE` | Browser window on `convex.site` with live badge |
| Fast deploy         | `ONE COMMAND`     | Terminal command pointing to a live site        |
| Skip provider setup | `SKIP HOSTING`    | Build/upload/live pipeline ending in Convex     |

## Common Fix Prompts

### Wrong logo

```text
Keep the thumbnail composition, Mike, text, and lighting. Change only the logo
on the right-side hosting card. Replace the generated cube/hexagon mark with
the official Convex colored swirl symbol from the reference image. Keep
"convex.site" and "Live" readable.
```

### Too much clutter

```text
Keep Mike, "NO DASHBOARDS", the red X idea, and the Convex hosting card. Remove
small UI text and extra panels. Make the concept readable at small YouTube feed
size.
```

### Mike is not recognizable

```text
Keep the same thumbnail layout, but make Mike match the provided photo more
closely: same face shape, eyes, black Convex cap, head-and-shoulders crop, and
skeptical expression. Do not turn him into a generic presenter.
```
