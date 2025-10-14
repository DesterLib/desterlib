# @dester/eslint-config

Shared ESLint configurations for the Dester monorepo.

## Configurations

- `base.js` - Base ESLint configuration
- `next.js` - Next.js specific configuration
- `react-internal.js` - React configuration for internal packages

## Usage

In your `eslint.config.js`:

```js
import baseConfig from "@dester/eslint-config/base.js";

export default [
  ...baseConfig,
  // Your custom config
];
```
