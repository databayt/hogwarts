# Licensing

Hogwarts is dual-licensed:

1. **Server Side Public License v1 (SSPL-1.0)** for open-source use
2. **Commercial License** for SaaS deployments and enterprise customers

## What SSPL Permits

- View, read, and study the source code
- Modify the code for your own use
- Self-host for your own school or organization
- Contribute improvements back to the project
- Use for educational and research purposes

## What Requires a Commercial License

If you offer Hogwarts (or a modified version) as a **service to third parties** -- meaning users interact with the software over a network without receiving a copy -- you must either:

1. Release the **complete source code** of your entire service stack (including all infrastructure, monitoring, deployment tooling, etc.) under the SSPL, **or**
2. Obtain a **commercial license** from databayt

This is the core distinction: **self-hosting for your own use is free**. Offering it as a hosted service to others requires a commercial license (unless you open-source your entire stack under SSPL).

## Commercial License

The commercial license includes:

- Right to offer Hogwarts as a hosted SaaS without SSPL obligations
- Enterprise support with SLAs
- Priority bug fixes and security patches
- Access to premium features and modules
- Custom deployment assistance
- Training and onboarding support

Contact **licensing@databayt.org** for pricing and terms.

## FAQ

**Can I self-host Hogwarts for my school?**
Yes. Self-hosting for your own organization is fully permitted under SSPL at no cost.

**Can I modify the code?**
Yes. You can modify, extend, and customize Hogwarts for your own use.

**Can I offer Hogwarts as a SaaS to other schools?**
Only with a commercial license, or by releasing your complete service source code under SSPL.

**What about the shadcn/ui components in `src/components/ui/`?**
Those components originate from shadcn/ui and are MIT-licensed. You may use them independently under MIT terms. See the NOTICE file for details.

**Are the npm dependencies affected?**
No. Third-party dependencies retain their original licenses (MIT, Apache-2.0, ISC, etc.). Only the Hogwarts platform code is SSPL-licensed.

**Can I use Hogwarts code in my open-source project?**
Yes, provided your project is compatible with SSPL-1.0. Note that SSPL is not compatible with GPL-2.0-only.

**Who holds the copyright?**
Copyright is held by databayt and its contributors. Contributors grant databayt the right to distribute under both SSPL and commercial licenses (see CONTRIBUTING.md).
