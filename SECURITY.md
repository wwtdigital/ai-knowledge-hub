# Security

## Overview

This application implements multiple layers of security to protect against common vulnerabilities and ensure safe operation.

## Security Features

### 1. API Authentication

All API endpoints require authentication via Bearer tokens:

- **`/api/analyze`** - Requires `API_KEY`
- **`/api/trend-report`** - Requires `API_KEY`
- **`/api/cron/fetch-transcripts`** - Requires `CRON_SECRET`

**Usage:**
```bash
curl -X POST https://your-app.vercel.app/api/analyze \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"transcript": "...", "title": "..."}'
```

### 2. Input Validation

All API endpoints validate input using Zod schemas:

- **Maximum transcript length**: 100,000 characters
- **Maximum title length**: 500 characters
- **Maximum transcripts per report**: 50
- Type checking and format validation

### 3. Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **10 requests per minute** per IP address
- Cron endpoints are exempt from rate limiting
- Returns `429 Too Many Requests` when exceeded

### 4. File Path Sanitization

All file operations include path traversal protection:

- Filenames are sanitized to remove dangerous characters
- Paths are validated to stay within designated directories
- Directory traversal attempts are blocked

### 5. Fail-Closed Security

The cron endpoint requires `CRON_SECRET` to be set:

- Returns `500 Server Error` if secret is not configured
- Does not fall back to open access
- Validates secret before processing

## Environment Variables

Required environment variables (all must be set):

```env
AI_GATEWAY_API_KEY=vck_...  # Vercel AI Gateway key
API_KEY=...                  # For /api/analyze and /api/trend-report
CRON_SECRET=...              # For /api/cron/fetch-transcripts
```

### Generating Secrets

```bash
# Generate API_KEY
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -base64 32
```

### Adding to Vercel

```bash
vercel env add API_KEY production
vercel env add CRON_SECRET production
vercel env add AI_GATEWAY_API_KEY production
```

## Security Best Practices

### For Development

1. **Never commit `.env.local`** - it's in `.gitignore`
2. **Rotate secrets regularly** - especially after team changes
3. **Use different secrets for dev/prod** - don't reuse
4. **Limit API key access** - only share with authorized team members

### For Production

1. **Monitor API usage** - watch for unusual patterns
2. **Review Vercel logs** - check for failed auth attempts
3. **Update dependencies** - run `npm audit` regularly
4. **Backup transcripts** - commit to git frequently

## Threat Model

### Protected Against

✅ **Unauthorized API access** - API key authentication
✅ **Brute force attacks** - Rate limiting
✅ **Large payload attacks** - Input size limits
✅ **Directory traversal** - Path sanitization
✅ **Cron job abuse** - Secret-based auth
✅ **Injection attacks** - Input validation

### Not Protected Against (Future Work)

⚠️ **Distributed attacks** - Need Redis/KV for distributed rate limiting
⚠️ **API key theft** - Consider JWT with expiration
⚠️ **DDoS** - Rely on Vercel's infrastructure

## Incident Response

If you suspect a security issue:

1. **Immediately rotate all secrets**:
   ```bash
   openssl rand -base64 32 | vercel env add API_KEY production
   openssl rand -base64 32 | vercel env add CRON_SECRET production
   ```

2. **Review Vercel logs** for suspicious activity

3. **Check git history** for accidentally committed secrets

4. **Redeploy** to ensure all instances use new secrets

## Reporting Security Issues

To report a security vulnerability:

1. **Do not** create a public GitHub issue
2. Email the team directly
3. Include details and reproduction steps
4. Allow 48 hours for response

## Compliance Notes

- No PII (Personally Identifiable Information) is collected
- YouTube transcripts are public data
- API keys and secrets are never logged
- All data is stored in markdown files (version controlled)
