---
title: "TLS (Transport Layer Security)"
type: concept
tags: [networking, security, encryption, authentication, distributed-systems]
sources: [understanding-distributed-systems]
created: 2026-05-14
updated: 2026-05-14
---

# TLS (Transport Layer Security)

## Definition

TLS is a protocol that runs on top of TCP and provides three guarantees for network communication: **encryption** (data is unreadable to third parties), **authentication** (parties verify each other's identity), and **integrity** (data has not been tampered with or corrupted in transit). (→ [[sources/understanding-distributed-systems]] ch. 3)

## Why It Matters

The network is not a trusted medium. Without TLS, any intermediary on the path between client and server can read or modify traffic. TLS is the baseline security layer for all networked communication — not just public internet traffic, but any internal east–west traffic as well. The CPU penalty of encryption is negligible on modern hardware with dedicated cryptographic instructions.

## Encryption

TLS uses a hybrid scheme:

1. **Asymmetric encryption** (slow, expensive) is used only for the initial key exchange. Each party generates a key pair (public + private). Through mathematical properties of the key pair (Diffie-Hellman-style), they can derive a shared secret without ever transmitting it over the wire.
2. **Symmetric encryption** (fast, cheap) is then used for all application data, using the shared secret established above.

The shared key is periodically renegotiated to limit the amount of data exposed if a key is compromised.

## Authentication

Authentication uses **digital signatures** based on asymmetric cryptography:

- The server has a key pair. When it sends data, it signs it with its private key.
- The client uses the server's public key to verify the signature — proving the data came from the entity holding the private key.

The outstanding problem: how does the client know the server's public key is genuine? The answer is **certificates**:

- A certificate contains: the owning entity's identity, expiration date, public key, and a digital signature from a third-party **certificate authority (CA)**.
- CAs are themselves represented by certificates, forming a **certificate chain** that terminates at a self-signed **root CA**.
- A client trusts a certificate if it, or one of its ancestors, appears in the client's trusted store. Root CAs (e.g., Let's Encrypt) are typically pre-installed by the OS vendor.

When a TLS connection opens, the server sends its full certificate chain. The client scans the chain upward until it finds a trusted anchor, then verifies back down, checking signatures and expiration at each step. If all checks pass, the server is authenticated.

## Integrity

Even encrypted data can be tampered with (bit-flipping). TLS uses a **message authentication code (HMAC)** — a secure hash of the message — included with each message. The recipient recomputes the hash and rejects the message if it doesn't match, protecting against both tampering and corruption.

This also addresses a gap in TCP's own checksum: TCP's checksum fails to detect errors in roughly 1 in 16 million to 10 billion packets. With 1 KB packets, this is expected once per 16 GB–10 TB transmitted. TLS HMAC catches these.

## Handshake

When a TLS connection is established, a handshake occurs:

1. **Cipher suite negotiation** — client and server agree on: key exchange algorithm, signature algorithm, symmetric encryption algorithm, HMAC algorithm.
2. **Key exchange** — use the agreed algorithm to establish the shared secret for symmetric encryption.
3. **Certificate verification** — client verifies the server's certificate chain. Optionally, the server verifies a client certificate (mutual TLS / mTLS).

**Round trips:**
- TLS 1.2: 2 round trips before data can flow.
- TLS 1.3: 1 round trip (significant improvement for high-latency connections).

Creating a new TLS connection is not free — this is yet another reason to keep servers geographically close to clients and reuse connections via connection pools.

## Operational Risk: Certificate Expiry

One of the most common TLS-related outages is a lapsed certificate. When a certificate expires, clients cannot verify the server's identity and refuse to connect — bringing the application down entirely. Automation for monitoring and auto-renewing certificates approaching expiry (e.g., Let's Encrypt + certbot, or managed certificates from cloud providers) is well worth the investment.

## mTLS

Standard TLS authenticates only the server. **Mutual TLS (mTLS)** authenticates both sides — the server also verifies the client's certificate. mTLS is used in service meshes for east–west service-to-service authentication (→ [[patterns/sidecar-service-mesh]]).

## Related Concepts

- [[concepts/zero-trust]] — TLS/mTLS is the transport layer of a zero-trust architecture
- [[patterns/sidecar-service-mesh]] — service meshes automate mTLS for east–west traffic
- [[distributed/http]] — HTTP runs over TLS (HTTPS); HTTP/3 (QUIC) integrates TLS at the transport layer
- [[distributed/dns]] — DNS over TLS replaces plaintext UDP for secure hostname resolution
- [[concepts/oauth2-and-authn]] — TLS is the transport prerequisite for OAuth2 flows

## Key Quotes

> "TLS should be used for all communications, even those not going through the public internet." (→ [[sources/understanding-distributed-systems]] ch. 3)
