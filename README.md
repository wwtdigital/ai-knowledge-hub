# AI Knowledge Hub

YouTube transcript indexing system that automatically fetches, processes, and stores transcripts from AI-focused YouTube channels as markdown files in your git repository for team-wide knowledge sharing and trend analysis.

## Features

- 🎥 Automatic YouTube transcript fetching from configured channels
- 📝 Markdown file storage (version controlled, no API limits)
- 🤖 Claude Sonnet 4 analysis via Vercel AI Gateway (no provider setup needed!)
- ⏰ Daily automated runs via Vercel Cron (7 AM ET)
- 📊 Trend report generation from aggregated content
- 🔧 Modular architecture for adding multiple YouTube channels
- 📑 Auto-generated index file for easy browsing
- 🔍 Searchable via GitHub or any text search tool

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Runtime**: Node.js 18+
- **Hosting**: Vercel (with Cron Jobs)
- **AI**: Claude Sonnet 4 via Vercel AI Gateway
- **Storage**: Markdown files (committed to git)
- **Language**: TypeScript

## Project Structure

```
ai-knowledge-hub/
├── app/
│   ├── api/
│   │   ├── cron/
│   │   │   └── fetch-transcripts/   # Daily cron job endpoint
│   │   ├── analyze/                 # Claude analysis endpoint
│   │   └── trend-report/            # Trend report generation
│   ├── layout.tsx
│   └── page.tsx
├── config/
│   └── channels.ts                  # YouTube channel configuration
├── lib/
│   ├── youtube.ts                   # YouTube transcript fetching
│   ├── storage.ts                   # Markdown file operations
│   └── ai-analysis.ts               # Claude AI integration
├── scripts/
│   └── seed.js                      # 90-day history seed script
├── transcripts/                     # 📁 All transcripts stored here
│   ├── INDEX.md                     # Auto-generated index
│   └── YYYY-MM-DD_channel_title.md  # Individual transcripts
└── vercel.json                      # Vercel cron configuration
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add:

```env
# Vercel AI Gateway API Key
AI_GATEWAY_API_KEY=your_ai_gateway_api_key_here

# Cron Secret (generate a random string for securing the cron endpoint)
CRON_SECRET=your_random_secret_here
```

**Get your Vercel AI Gateway API key:**
1. Go to https://vercel.com/dashboard
2. Navigate to your account settings
3. Find "AI Gateway" section
4. Create or copy your API key
5. You get $5 free credits every 30 days!

**Note**: The AI Gateway uses Claude Sonnet 4 at list price with no markup. You can also bring your own Anthropic key if you prefer.

**Generate a cron secret:**
```bash
openssl rand -base64 32
```

### 3. Local Development

```bash
npm run dev
```

Visit http://localhost:3000

### 4. Seed Historical Data (90 days)

Before deploying, seed your repository with historical transcripts:

```bash
npm run seed
```

This will:
- Fetch all videos from the last 90 days
- Download their transcripts
- Save them as markdown files in `transcripts/`
- Generate an index file at `transcripts/INDEX.md`
- Skip any videos that already exist

**Note**: This may take 10-30 minutes depending on the number of videos.

After seeding, **commit the transcripts to git**:

```bash
git add transcripts/
git commit -m "Initial transcript seed - 90 days of AI Daily Brief"
git push
```

Now your team can browse transcripts directly on GitHub!

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Configure Environment Variables in Vercel:
1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add all variables from your `.env.local`

#### Configure Cron Secret:
The cron job is secured with a bearer token. To test it:

```bash
curl -X GET https://your-app.vercel.app/api/cron/fetch-transcripts \
  -H "Authorization: Bearer your_cron_secret"
```

### 6. Verify Cron Job

The cron job runs daily at 7 AM ET (11:00 UTC). To verify:

1. Check Vercel Dashboard → Your Project → Cron Jobs
2. You should see the scheduled job listed
3. Monitor the first run to ensure it works

**Important**: The cron job will create new transcript files and update the index. Make sure to pull these changes regularly or set up auto-deployment when transcripts are updated.

## Usage

### Browsing Transcripts

**On GitHub:**
1. Navigate to the `transcripts/` folder in your repo
2. Open `INDEX.md` for a browsable list
3. Click any transcript link to view the full content

**Locally:**
```bash
# View the index
cat transcripts/INDEX.md

# Search transcripts
grep -r "GPT-4" transcripts/

# Or use your IDE's search
```

### Adding New YouTube Channels

Edit `config/channels.ts`:

```typescript
export const channels: ChannelConfig[] = [
  {
    id: 'ai-daily-brief',
    name: 'AI Daily Brief',
    youtubeHandle: '@TheAIBreakdown',
    enabled: true,
  },
  {
    id: 'new-channel',
    name: 'Another AI Channel',
    youtubeHandle: '@YourChannel',
    enabled: true,
  },
];
```

Add the channel name to your Notion database's "Channel" select property.

### Manual Transcript Fetch

Manually trigger the cron job (will save new transcripts to `transcripts/`):

```bash
curl -X GET https://your-app.vercel.app/api/cron/fetch-transcripts \
  -H "Authorization: Bearer your_cron_secret"
```

Then commit the new transcripts:
```bash
git pull  # Get latest changes
git add transcripts/
git commit -m "Add new transcripts from $(date +%Y-%m-%d)"
git push
```

### Generate Trend Reports

Use the trend report API:

```bash
curl -X POST https://your-app.vercel.app/api/trend-report \
  -H "Content-Type: application/json" \
  -d '{
    "transcripts": [
      {
        "title": "Video 1",
        "transcript": "...",
        "date": "2024-01-15"
      }
    ]
  }'
```

## Workflow

1. **Daily**: Vercel cron runs at 7 AM ET, fetches new transcripts, saves to `transcripts/`
2. **Auto-commit** (optional): Set up GitHub Actions to auto-commit new transcripts
3. **Team Access**: Team browses transcripts on GitHub or pulls latest changes
4. **Analysis**: Use Claude API endpoints to generate insights on-demand

## Automatic Git Commits (Optional)

To auto-commit transcripts from cron job, you could:
1. Add git operations to the cron endpoint
2. Use GitHub Actions to periodically check and commit
3. Or manually pull/commit after each cron run

## Vercel AI Gateway Benefits

✅ **No provider setup** - Just use your Vercel AI Gateway key
✅ **$5 free credits monthly** - Great for testing and small teams
✅ **List pricing** - No markup on tokens
✅ **Multi-model support** - Easy to switch between models
✅ **Bring your own key** - Use your own Anthropic key with 0% markup

## Future Enhancements

- [ ] Automatic AI analysis on new transcripts
- [ ] Weekly automated trend reports (committed as markdown)
- [ ] GitHub Actions for auto-committing new transcripts
- [ ] Vector database integration for semantic search
- [ ] Slack/Discord notifications for new insights
- [ ] Dashboard for visualizing trends over time
- [ ] Try other models via AI Gateway (GPT-4, Gemini, etc.)

## Troubleshooting

### "Could not fetch transcript" errors
- Some videos may have transcripts disabled
- Try a different video to verify the system works

### Transcripts not appearing
- Check the `transcripts/` directory was created
- Verify file permissions
- Check Vercel logs for errors

### Cron job not running
- Verify it's deployed to Vercel (not local dev)
- Check Vercel Dashboard → Cron Jobs for execution logs
- Ensure `vercel.json` is committed to git

### Team can't see transcripts
- Ensure `transcripts/` directory is committed to git
- Push changes to your remote repository
- Team members need to pull latest changes

## License

MIT
