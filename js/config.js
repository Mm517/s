/* ==========================================================
   CONFIG – the only file you edit per client.
   ========================================================== */
window.DC = {
  onLang: [],            // callbacks run after every language switch
  init: {},              // init functions registered by each js file
  CONFIG: {
    phone: '+20 100 000 0000',          // shown in Contact, used for tel: link
    whatsapp: '201000000000',           // digits only, with country code. '' hides the button
    mapsQuery: 'El-Madina St, Mansoura, Dakahlia, Egypt',
    bookingEndpoint: '',                // e.g. 'https://xxxx.supabase.co/rest/v1/appointments' – '' = demo mode
    bookingHeaders: {},                 // e.g. { apikey: '...', Authorization: 'Bearer ...' }
    busyEndpoint: '',                   // GET -> JSON [{date:'2026-10-25', time:'18:30'}, ...] of already booked slots
    leadEndpoint: '',                   // POST target for chat visitors' details {name, phone, people, lang}. '' = demo mode
    // appointment system
    openHour: 9, closeHour: 21,         // clinic hours (24h)
    slotMinutes: 30,                    // length of one slot
    daysAhead: 14,                      // how many days patients can book ahead
    closedWeekdays: [5],                // 0=Sun ... 5=Fri, 6=Sat. Weekly day off
    minLeadMinutes: 60,                 // no booking closer than this to "now"
    demoSeed: true                      // true = pre-fills some slots as booked so the demo looks alive.
                                        // Set to false for a live clinic; real bookings come from busyEndpoint.
  },
  // frame sequences: folder prefix, total frames, frames per folder (folders are hero-01, hero-02 ...)
  FRAMES: {
    hero:    { dir: 'hero-',    total: 313, per: 35 },
    anatomy: { dir: 'anatomy-', total: 192, per: 32 },
    tour:    { dir: 'tour-',    total: 192, per: 32 }
  }
};
