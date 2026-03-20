# Release checklist

- Run `npm run qa` from a clean checkout.
- Run the demo collector and inspect the dashboard.
- Exercise authentication from loopback and a non-loopback configuration.
- Verify migrations against a copy of the previous release database.
- Inspect exports for private machine data and secret values.
- Build and smoke-test the container image.
- Verify the Linux service starts under an unprivileged account.
- Update the changelog, version, compatibility table, and social preview.
- Sign and checksum release artifacts.
