# RetroForge TODO Items

## Features

### Tipping Integration
- Add tipping support for cart creators via:
  - PayPal
  - Patreon
  - Other third-party tipping platforms (as long as free APIs are available)
- Display tipping options on cart detail pages
- Allow cart creators to add tipping links to their carts
- Note: Users can receive tips, but carts must remain free to play on RetroForge platform

### Share Button
- Add "Share" button to Arcade page
- Allow users to share links to Arcade pages (not direct .rf file distribution)
- Support social media sharing
- Generate shareable links

### Bundled Binary Downloads
- Add download option for bundled binaries (engine + cart) from Arcade pages
- Ensure bundled binaries follow same distribution restrictions as cart files
- Generate platform-specific bundled binaries on-demand or pre-build

## Legal & Compliance

### Terms Acceptance Flow
- Create acceptance modal/page that appears before:
  - First download of engine binary
  - Account creation
  - First cart upload/play
- Track acceptance in user profile/consent table
- Allow users to view and re-accept terms when updated

## Platform Improvements

### Cart Distribution Enforcement
- Add validation to prevent cart file (.rf) downloads from unauthorized sources
- Implement checks to prevent cart publishing on external platforms
- Monitor and enforce distribution restrictions

## Technical Debt

- [Any other technical improvements needed]

