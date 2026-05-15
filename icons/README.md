# Icons

Put image assets here.

## Files this project expects

| File | Purpose | Recommended size |
|---|---|---|
| `logo.png` | Hero image referenced at the top of the project README | Wide (1000–1500px wide), the rectangular logo |
| `icon-16.png` | Toolbar icon at standard density | 16 × 16 PNG, square |
| `icon-48.png` | Extensions page icon | 48 × 48 PNG, square |
| `icon-128.png` | Chrome Web Store / install dialog icon | 128 × 128 PNG, square |

The extension still loads if these are missing — Chrome falls back to a default icon. To enable the toolbar icon once the three square PNGs are in place, add this block to `manifest.json` as a sibling of `"action"`:

```json
"icons": {
  "16": "icons/icon-16.png",
  "48": "icons/icon-48.png",
  "128": "icons/icon-128.png"
}
```

## Tips for cropping the mascot

The full logo is rectangular (wordmark + mascot). For the **toolbar icon**, crop just the astronaut character to a square. ImageMagick one-liner:

```sh
# Assuming logo.png is the full image and the mascot fills roughly the right two-thirds
magick logo.png -gravity center -crop 540x540+0+30 +repage icons/icon-128.png
magick icons/icon-128.png -resize 48x48 icons/icon-48.png
magick icons/icon-128.png -resize 16x16 icons/icon-16.png
```

Adjust the crop offsets to taste.
