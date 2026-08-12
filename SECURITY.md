# Security Policy

## Supported Versions

Security fixes are applied to the latest code on the `main` branch and the
currently deployed version of the website. Older revisions are not supported.

## Reporting a Vulnerability

Please report suspected vulnerabilities using
[GitHub's private vulnerability reporting](https://github.com/awstephan/maggiemaesaustin.com/security/advisories/new).

Do not report security vulnerabilities through public GitHub issues,
discussions, or social media.

Please include:

- A description of the vulnerability and its potential impact
- The affected page, endpoint, component, or configuration
- Reproduction steps or a minimal proof of concept
- Any suggested mitigation, if known
- Whether the vulnerability has been disclosed elsewhere

Never include Nostr private keys (`nsec`), wallet credentials, SMTP
credentials, access tokens, or unnecessary personal data in a report.

## Response Process

We aim to:

- Acknowledge reports within 3 business days
- Provide an initial assessment within 10 business days
- Share status updates while a confirmed issue is being addressed
- Coordinate disclosure after a fix or mitigation is available

Timelines may vary depending on severity and complexity. This project does not
currently offer a paid bug bounty.

## Scope

Reports concerning the following are in scope:

- The Maggie Mae's website and its source code
- The private-event inquiry API
- Authentication and authorization behavior
- Nostr event publishing, encryption, and trusted-author validation
- Wallet and payment integration behavior caused by this application
- Exposure of secrets or sensitive user information

Vulnerabilities in third-party Nostr relays, browser extensions, wallets,
hosting providers, or dependencies should generally be reported to their
maintainers unless this application uses them insecurely.

## Responsible Research

When investigating a vulnerability:

- Use test accounts and data whenever possible
- Do not access, modify, or retain data belonging to others
- Do not disrupt the website, relays, or supporting services
- Do not perform denial-of-service testing or automated high-volume scanning
- Allow reasonable time for investigation and remediation before disclosure

Nostr events may be replicated across independent relays and cannot be reliably
removed after publication. Use disposable test identities and never publish
sensitive information during research.

We will not pursue action against good-faith security research that follows
this policy.
