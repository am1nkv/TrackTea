# TrackTea

I drink way too much bubble tea and had no idea how much sugar I was actually putting away each month. So I built this to keep myself honest.

TrackTea is a little mobile app for logging the drinks you buy — matcha, boba, coffee, juice, whatever — along with how much they cost and how much sugar is in them. Snap a photo, and it'll try to figure out the sugar for you so you don't have to guess.

## What it does

- Log a drink in a couple of taps: pick the type, punch in the sugar and price, done
- Take a photo of your drink and let Gemini estimate the sugar for you (optional, more on that below)
- A home dashboard showing what you've spent and how much sugar you've had this month, plus a bar chart for the week
- A running history of everything you've logged
- Accounts + sync through Supabase, so your log follows you between devices

Everything is scoped per user with row-level security, so nobody else can see your drinks unless you make them public.

## Tech

It's an Expo / React Native app written in TypeScript. Supabase handles auth, the database, and photo storage. Charts come from `react-native-gifted-charts`. The AI sugar estimate calls Google's Gemini 1.5 Flash model.

## Running it locally

You'll need Node, the Expo tooling, and a Supabase project.

```bash
git clone https://github.com/am1nkv/TrackTea.git
cd TrackTea
npm install
```

Copy `.env.example` to `.env` and fill in your keys:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_GEMINI_API_KEY=...   # optional
```

Set up the database by running the contents of `supabase-schema.sql` in your Supabase project's SQL editor. That creates the tables, the row-level security policies, and the storage bucket for photos.

Then start it:

```bash
npm start
```

Scan the QR code with Expo Go on your phone, or hit `a` / `i` for an emulator.

## The photo thing

If you drop a Gemini API key into your `.env`, the Add screen gets a bit smarter — after you take a photo it sends the image off, guesses the brand and drink, and pre-fills the sugar field for you. It also tells you how confident it is.

A word of warning: it's an estimate, not gospel. It's good at recognizing the big chains whose nutrition info is public, but sugar level (25%, 50%, 100%), toppings, and cup size all move the number around. Treat it as a starting point and tweak it. If you leave the key out, the app just works normally and you type the sugar in yourself.

Grab a free key from [Google AI Studio](https://aistudio.google.com/apikey) if you want to try it.

## Tests

```bash
npm test
```

There's a decent chunk of unit test coverage over the utilities, components, and auth context.

## Notes

This is a personal project, so the roadmap is basically "whatever annoys me next." A few things marked V2 in the schema (shop names, sugar percentage, public profiles) aren't wired up yet.
