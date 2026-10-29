ALPINE ASCENTS — MULTI-PAGE WEBSITE
========================================

HOW TO OPEN
1. Extract Alpine_Ascents.zip.
2. Open the extracted folder in VS Code.
3. Install/enable the VS Code Live Server extension if needed.
4. Right-click index.html and choose "Open with Live Server".
5. Use the navbar to move between pages. Open gallery.html for Summit Atlas.

The gallery loads data/mountains.json with fetch(), so open it through Live
Server (or another local HTTP server). Opening gallery.html directly as a
file:// URL will block the data request in many browsers.

PAGES INCLUDED
- index.html          Home
- about.html          About Us
- history.html        History & Records
- techniques.html     Types and Techniques
- safety.html         Hazards and Shelter
- expeditions.html    Expeditions and sample success-story themes
- clubs.html          Clubs, organizations and embedded map
- gallery.html        Summit Atlas: 20 searchable, filterable mountain profiles
- mountain-details.html  Reusable story page; select a mountain with ?id=k2
- news.html           Latest development topics
- guidelines.html     General mountaineering guidelines
- contact.html        Contact form

FILES
- style.css           Shared responsive styles
- script.js           Site behaviors plus gallery filters, favorites and details rendering
- data/mountains.json Mountain profiles, history, coordinates, references and photo metadata

IMPORTANT NOTES
- This is a front-end website for a student project. External images, Google Fonts, and the embedded map need an internet connection.
- Summit Atlas uses direct Wikimedia Commons image uploads where a peak-specific photo was located. Each card and story links to its Commons file page for author and license details; check those terms before reuse.
- Amin Brakk currently has no confirmed freely licensed peak-specific photo in the researched sources. Its card uses a labeled "Photo unavailable" fallback rather than embedding an all-rights-reserved image. A source page is linked for reference.
- Passu Sar's first-ascent record is disputed; the dataset says so instead of selecting an unverified claim. The requested "Dirang" entry is the documented peak Diran. The Trango Towers record uses Great Trango Tower's main summit elevation because the Towers are a group, not one summit.
- Missing or disputed facts, including Amin Brakk's coordinates and first ascent, are marked unknown in the data and story page.
- The visitor count is stored in the current browser only; it is not a real multi-user counter.
- The ticker shows the device's local date and time. It does not fetch location yet. Browser geolocation requires permission and typically works on localhost/HTTPS.
- The contact form does not send or store messages. A backend or form service is needed for real submissions.
- Verify historical facts, records, organization links, and any live news before final submission.
- Mountaineering can be dangerous; this educational website is not a substitute for qualified training or local professional guidance.
