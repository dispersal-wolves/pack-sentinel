# Contributing

Changes should preserve three properties: collector output is untrusted, incidents remain explainable, and the default installation is local.

Before opening a pull request, run:

```bash
npm run qa
```

Add fixtures and tests for every adapter change. Schema changes require a forward-only migration and an update to the contract documentation. Avoid dependencies when the Node.js runtime already provides the required behavior.
