# LinguaFlow AI

**Translate anything, understand everything.**

LinguaFlow AI is a modern, full-stack multilingual translation web application featuring automatic source-language detection, real-time translation, voice dictation, text-to-speech pronunciation, bookmarking, and persistent browser history across 32 global and regional languages.

---

## Key Features

- **Side-by-Side Translation Workspace**: Clean dual-panel editor supporting long multi-paragraph passages up to 5,000 characters, RTL script alignment (Arabic, Urdu), and `Ctrl + Enter` keyboard shortcuts.
- **32 Supported Languages**: Includes English, Kannada, Telugu, Hindi, Tamil, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Urdu, Spanish, French, German, Japanese, Chinese (Simplified & Traditional), Korean, Arabic, Portuguese, Russian, Italian, Dutch, Turkish, Vietnamese, Thai, Indonesian, Polish, Ukrainian, Greek, Swedish, and Swahili.
- **Searchable Language Selector & Recent Languages**: Quickly filter languages by English name, native script, or ISO code, with automatic tracking of recently used languages.
- **Automatic Language Detection**: Identifies Unicode scripts and Latin-script languages automatically when set to **Auto-detect**.
- **Real-Time Translation & Manual Mode**: Toggle debounced live translation as you type or translate on demand.
- **Voice Input & Text-to-Speech**: Dictate source text using browser Web Speech Recognition (`SpeechRecognition`) and listen to pronunciation for both source and translated text via `speechSynthesis`.
- **Collapsible History & Favorites Sidebar**:
  - Grouped cleanly by **Today** and **Previous Days** with timestamps.
  - Instant search across previous translations.
  - Bookmark favorite translations and filter by **Favorites**.
  - One-click restore into the workspace, individual deletion, or full history clear.
- **Profile & Preferences**:
  - Editable display name and selectable profile avatars.
  - Light mode (soft ivory / deep navy) and Dark mode toggle.
  - Configurable default source/target languages, speech speed, and translation provider (`Smart Hybrid`, `MyMemory Open API`, `LibreTranslate`, or `Neural AI`).
- **Export & Clipboard Actions**: Copy source or translated text with toast confirmations, paste from clipboard, or export translations as UTF-8 `.txt` files.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
- **Backend**: Node.js, Express, TypeScript (`tsx`)
- **Translation Engines**:
  - **MyMemory Translation API** (zero-key open REST API with automatic multi-paragraph chunking)
  - **LibreTranslate** (configurable custom or public endpoint)
  - **Server-Side Neural Engine** (`@google/genai` when `GEMINI_API_KEY` is configured)
- **Persistence**: Browser `localStorage` for translation history, favorites, recent languages, profile, and settings.

---

## Project Structure

```text
LinguaFlow AI/
├── index.html
├── metadata.json
├── package.json
├── server.ts
├── server/
│   └── translator.ts
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── components/
│   │   ├── LanguageSelector.tsx
│   │   ├── OrbitalGlobe.tsx
│   │   ├── ProfileSettingsModal.tsx
│   │   ├── Sidebar.tsx
│   │   ├── ToastContainer.tsx
│   │   ├── TopBar.tsx
│   │   └── TranslationWorkspace.tsx
│   ├── data/
│   │   └── languages.ts
│   ├── types/
│   │   └── translation.ts
│   └── utils/
│       └── storage.ts
└── README.md
```

---

## Setup & Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables** (optional — MyMemory API works out-of-the-box without keys):
   Copy `.env.example` to `.env` and configure any optional values:
   ```env
   GEMINI_API_KEY="your_api_key_if_using_neural_engine"
   TRANSLATION_PROVIDER="auto"
   LIBRETRANSLATE_URL=""
   LIBRETRANSLATE_API_KEY=""
   MYMEMORY_EMAIL=""
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   The app will start on `http://localhost:3000`.

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## Usage

1. Select a **Source Language** (or keep **Auto-detect language**) and a **Target Language**, or click one of the **Quick pairs** shortcuts.
2. Type, paste, or dictate (`Speak`) text in the left panel.
3. Click **Translate** (or press `Ctrl + Enter`), or rely on **Real-time translation** as you type.
4. Use **Listen** for pronunciation, **Copy** to copy the result, **Export TXT** to save a `.txt` file, or **Save** to bookmark the translation.
5. Open the collapsible left sidebar to search past translations, revisit **Favorites**, or click your profile card to customize your avatar, theme, default languages, and translation provider.

---

## Screenshots

- **Light Mode Workspace**: Soft ivory canvas, deep navy typography, dual side-by-side panels, and quick language shortcuts.
- **Dark Mode & Sidebar**: Deep navy workspace with collapsible history grouped by Today and Previous Days.
- **Profile & Preferences Modal**: Avatar picker, default language configuration, speech rate control, and translation provider selection.
