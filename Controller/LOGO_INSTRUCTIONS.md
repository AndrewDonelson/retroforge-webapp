# Logo Setup Instructions

The Retro logo has been added to the controller at the bottom center!

## Setup in Next.js 16

1. Place `logo.svg` in your Next.js `public` folder:
   ```
   your-project/
   ├── public/
   │   └── logo.svg  <-- Put it here
   ├── app/
   └── components/
   ```

2. The controller component references it as `/logo.svg` which will work automatically.

3. The logo is:
   - Positioned at bottom center
   - Semi-transparent (60% opacity)
   - Responsive sized (scales with controller)
   - Non-interactive (pointer-events: none)
   - Has a subtle drop shadow
   - SVG format for crisp rendering at any size

## Customization

If you want to adjust the logo appearance, modify these styles in Controller.tsx:

```css
.logo-container {
  opacity: 0.6;  /* Change transparency */
}

.controller-logo {
  height: min(24px, 3vw);  /* Adjust size */
}
```

Enjoy your branded controller! 🎮
