Dr. Ahmed El-Sayed – Dental clinic template (v4)
================================================
Run:  open the folder with a local server (VS Code "Live Server", or: python3 -m http.server)
      then visit http://localhost:8000   (frames load via JS, double-click will not work)

Folder layout (flat: no folder contains another folder, every folder has fewer than 40 items)
  index.html
  css/       12 style files, loaded in numbered order (01-base ... 14-chat)
  js/        config.js (edit per client), core.js, frames.js, scroll.js, ui.js, booking.js, chat.js, main.js
  lang/      en.js, ar.js (site texts)  +  chat-en.js, chat-ar.js (chat assistant answers)
  img/       doctor.jpg          certs/   ada, dental, completion (.webp)
  hero-01 ... hero-09       313 frames (35 per folder)
  anatomy-01 ... anatomy-06 192 frames (32 per folder)
  tour-01 ... tour-06       192 frames (32 per folder)

Edit per client  ->  js/config.js
  phone, whatsapp, mapsQuery, bookingEndpoint (+ bookingHeaders), busyEndpoint, leadEndpoint
  openHour / closeHour / slotMinutes / daysAhead / closedWeekdays / minLeadMinutes / demoSeed
  FRAMES: folder prefix, total frames, frames per folder (change when you swap a video)

Offers (NEW)
  Section #offers: 15% for two, 25% for three or more, free first check-up.  THE PERCENTAGES ARE SAMPLES.
  To change them edit: lang/en.js + lang/ar.js (o1..o3, offDuo, offGroup) and lang/chat-en.js + lang/chat-ar.js (offers, duo, group, firstvisit).
  The booking form has a "Number of people" field; it is saved with the booking (people) and shows the matching offer note.

Site chat (NEW)
  Visitor opens "Chat with us", enters name + phone (+ who is coming) first, then asks questions.
  Answers are keyword based and bilingual: lang/chat-en.js, lang/chat-ar.js (id, t = chip label, k = keywords, a = answer).
  Details are POSTed as JSON to CONFIG.leadEndpoint (empty = demo mode, nothing is sent) and also fire a "lead" event on document;
  every message fires a "chatmessage" event on document. Replace the keyword bot with an AI/API later by editing ask() in js/chat.js.
  Chat history is not stored on a server, only the visitor's details are kept in their browser.

Swapping a video
  ffmpeg -i video.mp4 -fps_mode passthrough -c:v libwebp -quality 85 -start_number 1 frames_%06d.webp
  then split the files into folders of at most 39 (hero-01, hero-02 ...) and update FRAMES in js/config.js.

Libraries: GSAP 3.12.5 + ScrollTrigger from cdnjs (needs internet, or download and host them).
Doctor photo, certificates and reviews are SAMPLES: replace with the clinic's real ones.
