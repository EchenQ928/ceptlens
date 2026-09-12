#!/usr/bin/env bash
set -u
echo 'Service health'
systemctl is-active nginx ceptlens
nginx -t
echo 'HTTPS routing directives (no key material)'
nginx -T 2>&1 | awk '/^# configuration file/ || /^[[:space:]]*(listen|server_name|ssl_certificate|ssl_certificate_key|ssl_reject_handshake|ssl_protocols|return|allow|deny)[[:space:]]/'
echo 'Listeners'
ss -ltn | awk 'NR==1 || /:443[[:space:]]/ || /:8765[[:space:]]/'
echo 'Backend health'
curl -fsS --max-time 10 http://127.0.0.1:8765/api/content/status
echo
echo 'Loopback HTTPS with normal certificate verification'
curl -v --max-time 15 --resolve ceptlens.com:443:127.0.0.1 https://ceptlens.com/api/content/status 2>&1
echo
echo 'Public HTTPS from the server'
curl -v --max-time 15 https://ceptlens.com/api/content/status 2>&1
echo
echo 'TLS certificate metadata'
timeout 15 openssl s_client -connect 127.0.0.1:443 -servername ceptlens.com </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
