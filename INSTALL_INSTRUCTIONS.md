# Installation Instructions for New Features 📦

## Install Required Package

To enable certificate download functionality, you need to install the `html2canvas` package:

### Option 1: Using npm (Recommended)
```bash
npm install html2canvas@^1.4.1 --legacy-peer-deps
```

### Option 2: Using pnpm
```bash
pnpm add html2canvas@^1.4.1
```

### Option 3: Using yarn
```bash
yarn add html2canvas@^1.4.1
```

## Verify Installation

After installation, verify by checking package.json:
```bash
grep "html2canvas" package.json
```

You should see:
```json
"html2canvas": "^1.4.1"
```

## What This Package Does

`html2canvas` allows the certificate component to:
- Convert the certificate HTML/CSS to a canvas
- Generate a high-quality PNG image
- Enable staff to download their certificates
- Works entirely in the browser (no server needed)

## If Installation Fails

If you encounter dependency conflicts, use the `--legacy-peer-deps` flag as shown in Option 1 above.

## Next Steps

Once installed, the certificate download feature will work automatically! 🎉

## Testing

To test the certificate feature:
1. Complete a training
2. Click "View Your Certificate"
3. Click "Download Certificate"
4. Certificate should download as a PNG file

That's it! Enjoy the new features! 🚀

