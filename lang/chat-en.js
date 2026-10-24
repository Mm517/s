/* Chat assistant answers (English).
   Each entry: id, t = chip label, k = keywords that trigger it, a = answer, next = follow-up chips,
   act = optional button: book | call | wa | directions
   Offer percentages here are SAMPLES – match them to lang/en.js (offers section). */
window.I18N = window.I18N || {};
window.I18N.chat = window.I18N.chat || {};
window.I18N.chat.en = {
  start: ['offers', 'book', 'price', 'hours', 'location', 'pain'],
  fallback: "I'm not sure I understood. Pick a topic below, or leave it with us: the clinic will call you on the number you gave.",
  fallbackNext: ['offers', 'book', 'contact'],
  entries: [
    { id: 'offers', t: 'Offers', k: ['offer', 'discount', 'deal', 'promo', 'sale', 'cheaper', 'save', 'package'],
      a: 'Current offers: 15% off when two of you come together, 25% off for groups of three or more (families, friends, colleagues), and a free first check-up for new patients.',
      next: ['duo', 'group', 'firstvisit', 'book'] },
    { id: 'duo', t: 'Offer for two', k: ['two of us', 'couple', 'duo', 'both', 'with my wife', 'with my husband', 'with a friend', 'together', 'pair'],
      a: 'Come as two and each of you gets 15% off the same visit. Choose "2 people" in the booking form and we will apply it.', next: ['group', 'book'], act: 'book' },
    { id: 'group', t: 'Group / family offer', k: ['group', 'family', 'three', 'four', 'five', 'kids', 'friends', 'colleagues', 'team', 'many'],
      a: 'Groups of three or more get 25% off. Bring the family, friends or work colleagues. Pick the group size in the booking form, or tell us how many you are and we will arrange back-to-back times.', next: ['duo', 'book'], act: 'book' },
    { id: 'firstvisit', t: 'Free first check-up', k: ['free', 'first visit', 'first time', 'new patient', 'consultation', 'check-up', 'checkup', 'exam'],
      a: 'New patients get a free first check-up with the doctor. You get a clear plan and price before any treatment starts.', next: ['book', 'price'], act: 'book' },
    { id: 'book', t: 'Book an appointment', k: ['book', 'appointment', 'reserve', 'schedule', 'booking', 'available', 'slot', 'when can'],
      a: 'You can book online in under a minute: pick a service, a day and a free time. We will confirm by phone.', next: ['hours', 'offers'], act: 'book' },
    { id: 'price', t: 'Prices', k: ['price', 'cost', 'how much', 'fee', 'expensive', 'pay', 'payment', 'instalment', 'installment'],
      a: 'The price depends on the case, so the doctor examines you first, then gives you a clear plan and price before starting. The first check-up is free for new patients, and our offers lower the cost for groups.', next: ['offers', 'book'] },
    { id: 'hours', t: 'Opening hours', k: ['hour', 'open', 'close', 'time', 'friday', 'saturday', 'today', 'late', 'working'],
      a: 'We are open 6 days a week, 9:00 AM to 9:00 PM. Friday is our day off.', next: ['book', 'location'] },
    { id: 'location', t: 'Location', k: ['where', 'location', 'address', 'map', 'direction', 'find you', 'mansoura', 'street', 'parking'],
      a: 'El-Madina St., Mansoura, Dakahlia. Tap below for directions on the map.', next: ['hours', 'book'], act: 'directions' },
    { id: 'pain', t: 'Sudden pain', k: ['pain', 'hurt', 'ache', 'swelling', 'swollen', 'bleeding', 'emergency', 'urgent', 'broken', 'knocked', 'toothache'],
      a: 'Sorry you are in pain. Please call the clinic now and we will fit you in as soon as possible. For heavy bleeding, facial swelling or fever, go to the nearest emergency room as well.', next: ['book', 'contact'], act: 'call' },
    { id: 'services', t: 'Our services', k: ['service', 'treatment', 'do you do', 'offer treatment', 'what do you'],
      a: 'Cleaning and whitening, fillings, root canal, crowns and bridges, braces and aligners, implants, children\'s dentistry, cosmetic dentistry and emergency care.', next: ['whitening', 'implant', 'braces'] },
    { id: 'whitening', t: 'Whitening', k: ['whiten', 'whitening', 'bleach', 'stain', 'yellow', 'scaling', 'cleaning', 'plaque'],
      a: 'We remove stains and plaque and whiten for a brighter look. Often done in one visit. The doctor checks your gums first.', next: ['offers', 'book'] },
    { id: 'implant', t: 'Implants', k: ['implant', 'missing tooth', 'lost tooth', 'replace tooth', 'denture'],
      a: 'An implant replaces the root with titanium, then a custom crown sits on top. Scroll to the "A lost tooth, rebuilt" section to see how it is built. Book a check-up to see if you are a candidate.', next: ['price', 'book'] },
    { id: 'braces', t: 'Braces', k: ['brace', 'aligner', 'straight', 'crooked', 'orthodont', 'invisalign'],
      a: 'We offer modern braces and clear aligners. A first visit lets the doctor assess your teeth and explain the options and time.', next: ['price', 'book'] },
    { id: 'children', t: 'Children', k: ['child', 'kid', 'baby', 'son', 'daughter', 'toddler', 'pediatric', 'paediatric'],
      a: 'Yes, we treat children. The first visit is gentle and friendly so kids feel safe. Kids also count in our family offer.', next: ['group', 'book'] },
    { id: 'rootcanal', t: 'Root canal', k: ['root canal', 'nerve', 'infection', 'abscess'],
      a: 'A root canal saves an infected tooth with gentle, precise treatment. If you have pain or swelling, call us so we can see you soon.', next: ['pain', 'book'] },
    { id: 'contact', t: 'Talk to the clinic', k: ['human', 'person', 'call me', 'talk', 'speak', 'phone', 'number', 'whatsapp', 'reception', 'contact'],
      a: 'Our team has your details and will call you. You can also call or message us right now.', next: ['book'], act: 'call' },
    { id: 'hello', t: '', k: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'salam', 'peace'],
      a: 'Hello! How can I help? You can ask about offers, booking, prices or opening hours.', next: ['offers', 'book', 'price'] },
    { id: 'thanks', t: '', k: ['thank', 'thanks', 'great', 'perfect', 'ok', 'okay'],
      a: 'You are welcome! Anything else you would like to know?', next: ['offers', 'book'] }
  ]
};
