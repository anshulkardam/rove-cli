1. chmod +x  src/cli/main.js

2. add bin in package.json

 "bin": {
    "rove": "dist/cli/index.js"
  },

3. pnpm link