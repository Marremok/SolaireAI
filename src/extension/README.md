# SolaireAI Chrome Extension

A Chrome extension for Pro users to quickly access their TodayBox (today's study sessions and upcoming exams) without opening the full SolaireAI website.

## Features

✅ **Pro User Gate** - Only accessible to users with active Pro subscription
✅ **Today's Sessions** - View all study sessions scheduled for today
✅ **Upcoming Exams** - See your top 3 upcoming exams with relative dates
✅ **Rest Day Detection** - Shows friendly message on configured rest days
✅ **Auto-refresh** - Data refreshes automatically when popup opens
✅ **Dark Theme** - Matches the main SolaireAI app aesthetic
✅ **Secure Auth** - Uses existing Clerk session cookies

## Setup

### 1. Install Dependencies

```bash
cd src/extension
npm install
```

### 2. Create Extension Icons

The extension needs three icon files in `public/icons/`:
- `icon16.png` (16x16px)
- `icon48.png` (48x48px)
- `icon128.png` (128x128px)

See [public/icons/README.md](public/icons/README.md) for instructions on creating icons.

**Quick temporary solution:** Create simple blue squares with "SA" text for development.

### 3. Development

Start the development server:

```bash
npm run dev
```

This will:
- Start Vite dev server on `http://localhost:5174`
- Enable Hot Module Replacement (HMR)
- Build extension to `dist/` folder

### 4. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `src/extension/dist` folder
5. The extension icon should appear in your toolbar

### 5. Test the Extension

1. Make sure you're signed in to https://solaireai.app
2. Make sure you have an active Pro subscription
3. Click the extension icon in your toolbar
4. You should see your TodayBox data!

## Production Build

Build the extension for production:

```bash
npm run build
```

This creates an optimized build in `dist/` folder ready for Chrome Web Store submission.

## Project Structure

```
src/extension/
├── public/
│   └── icons/              # Extension icons (16, 48, 128px)
├── src/
│   ├── components/         # React components
│   │   ├── TodayBox.tsx           # Main TodayBox component
│   │   ├── SessionCard.tsx        # Individual session card
│   │   ├── UpcomingExamCard.tsx   # Upcoming exam card
│   │   ├── LoadingState.tsx       # Loading skeleton
│   │   ├── ErrorBoundary.tsx      # Error boundary wrapper
│   │   └── UpgradePrompt.tsx      # Non-Pro user prompt
│   ├── hooks/
│   │   └── useTodayBox.ts         # React Query data fetching hook
│   ├── lib/
│   │   ├── api.ts                 # API client functions
│   │   ├── colors.ts              # Subject color system (copied from main app)
│   │   ├── date.ts                # Date utilities (copied from main app)
│   │   ├── types.ts               # TypeScript interfaces
│   │   └── utils.ts               # Utility functions (cn)
│   ├── styles/
│   │   └── globals.css            # Tailwind + theme CSS variables
│   ├── App.tsx                    # Root component with React Query
│   └── index.tsx                  # React DOM entry point
├── manifest.json                   # Chrome extension manifest (v3)
├── popup.html                      # Extension popup HTML
├── vite.config.ts                  # Vite configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Dependencies and scripts
```

## How It Works

### Authentication Flow

1. User clicks extension icon
2. Extension makes `GET /api/todaybox` request with `credentials: 'include'`
3. Clerk middleware validates session cookie
4. API checks if user has Pro subscription via `getProUserOrNull()`
5. Returns data or appropriate error (401/403)

### State Handling

The extension handles multiple states:
- **Loading**: Shows skeleton UI while fetching
- **Authenticated + Pro**: Shows full TodayBox
- **Not Authenticated (401)**: Shows sign-in prompt
- **Not Pro (403)**: Shows upgrade prompt with benefits
- **Network Error**: Shows retry button

### Data Caching

- React Query caches data for 30 seconds
- Automatically refetches when popup opens
- 3 retry attempts with exponential backoff
- No retries for auth errors (401/403)

## API Endpoint

The extension connects to:
```
GET https://solaireai.app/api/todaybox
```

**Response format:**
```typescript
{
  sessions: SessionData[];        // Today's study sessions
  upcomingExams: ExamData[];      // Top 3 upcoming exams
  isRestDay: boolean;             // Is today a rest day?
  restDays: string[];             // User's rest day settings
  subjects: SubjectConfig[];      // User's subject-color mappings
}
```

## Troubleshooting

### Extension doesn't load
- Check that all icon files exist in `public/icons/`
- Run `npm run build` and reload the extension
- Check console for errors (F12 on popup)

### Authentication fails
- Make sure you're signed in to https://solaireai.app in the same browser
- Check that `host_permissions` in manifest.json includes `https://solaireai.app/*`
- Verify cookies are enabled for solaireai.app

### Shows "Not Pro" even though I have Pro
- Check your subscription status on the main website
- Try signing out and back in
- Check Network tab (F12) to see the API response

### Styling looks broken
- Run `npm install` to ensure Tailwind is installed
- Check that `src/styles/globals.css` exists
- Verify Vite is building CSS correctly

### HMR not working
- Make sure dev server is running (`npm run dev`)
- Check that port 5174 is not in use
- Try reloading the extension in `chrome://extensions/`

## Development Tips

- **Fast iteration**: Changes update automatically with HMR
- **Debug mode**: Open DevTools on the popup (right-click → Inspect)
- **Network requests**: Check Network tab to see API calls
- **React Query**: Install React Query DevTools for debugging

## Future Enhancements

Ideas for v1.1+:
- Offline support with chrome.storage caching
- Badge notifications (unread session count)
- Quick actions (mark session complete)
- Session timer (Pomodoro)
- Background sync (update every 5 minutes)
- Keyboard shortcuts

## License

Part of the SolaireAI project.
