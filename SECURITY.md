# Security Policy

## Supported version

The current `main` branch and latest release are supported.

## Data model

Script Note is local-first. Script content is stored in browser localStorage. GitHub Gist sync is optional.

## GitHub token

The token entered in Settings is stored only in sessionStorage. Use a dedicated token with the minimum required `gist` permission and remove/revoke it when no longer needed. Never commit tokens to this repository.

## Secret Gist warning

A GitHub `public: false` Gist is unlisted/secret, not encrypted private storage. Do not use Gist sync for passwords, API keys, private keys, access tokens, or confidential code.

## Code preview

HTML/CSS/JavaScript preview runs in a sandboxed iframe without same-origin access. Previewed code is still user-supplied executable browser code and may make network requests. Only run code you understand.

## Reporting

Do not place real credentials, backup files, or sensitive source code in public issues. Report security issues privately to the repository owner.
