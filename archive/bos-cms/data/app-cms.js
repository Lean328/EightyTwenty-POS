// App CMS content model — built from the EightyTwentyMobile source (read-only reference, not modified).
// Every default below is the app's current copy/asset; `src` names the file it came from.
// Field: { k, label, type, def, ...opts }. Types: text · long · bool · image · number · list · records · featured.
// Coverage status per item: A = editable here · B = shared record edited here (POS/website use it too) · C = app team (code).
const I = 'img-pos/app/';
const T = (k, label, def, o = {}) => ({ k, label, type: 'text', def, ...o });
const L = (k, label, def, o = {}) => ({ k, label, type: 'long', def, ...o });
const IMG = (k, label, def, ratio, size, where, o = {}) => ({ k, label, type: 'image', def, ratio, size, where, ...o });

// Image library (original EightyTwenty assets only). Product photos are added at runtime from the shared menu.
export const LIBRARY = [
  ['Mighty Breakfast · cut-out', I + 'hero/mighty-breakfast.webp', 'hero'], ['Açai bowl · cut-out', I + 'hero/acai-bowl.webp', 'hero'], ['Breakfast Burger · cut-out', I + 'hero/breakfast-burger.webp', 'hero'],
  ['French Toast · cut-out', I + 'hero/french-toast.webp', 'hero'], ['Green Nourish Bowl · cut-out', I + 'hero/green-nourish-bowl.webp', 'hero'],
  ['Brunch table', I + 'lifestyle/brunch-table.webp', 'lifestyle'], ['Table spread', I + 'lifestyle/table-spread.webp', 'lifestyle'], ['Baristas', I + 'lifestyle/baristas.webp', 'lifestyle'],
  ['Overhead hands', I + 'lifestyle/overhead-hands.webp', 'lifestyle'], ['Smoothies cheers', I + 'lifestyle/smoothies-cheers.webp', 'lifestyle'],
  ['Keep Cups', 'img-pos/site/keep-cups.jpg', 'promo'], ['Gift cards', 'img-pos/site/gift-cards.jpg', 'promo'], ['Wholesale brownies', 'img-pos/site/brownies.jpg', 'promo'],
  ['Catering · breakfast bagel', 'img-pos/catering/breakfast-bagel.jpg', 'catering'], ['Catering · lunch sandwiches', 'img-pos/catering/lunch-sandwiches.jpg', 'catering'], ['Catering · dessert platter', 'img-pos/catering/dessert-platter.jpg', 'catering'],
  ...['braddon', 'braddon-interior', 'braddon-outdoor', 'civic', 'coombs', 'greenway', 'gungahlin', 'dickson', 'belconnen', 'phillip', 'kingston', 'kingston-interior', 'akuna'].map(id => ['Café · ' + id.replace('-', ' '), I + 'loc/' + id + '.webp', 'cafes'])
];
export const LIB_TAGS = [['all', 'All'], ['food', 'Food & drink'], ['hero', 'Cut-outs'], ['cafes', 'Cafés'], ['lifestyle', 'Lifestyle'], ['catering', 'Catering'], ['promo', 'Promotions'], ['uploads', 'Uploads']];

// App presentation for cafés (fixtures/locations.ts: headline, note, photo). Name/address/phone/hours are shared with Settings.
export const CAFE_APP = {
  braddon: ['Wholesome food, great coffee on Lonsdale St.', 'Located right at the Rainbow Roundabout', 'braddon'],
  civic: ['Quick service on Mort Street, weekdays.', 'Express café, limited menu', 'civic'],
  coombs: ['Wholesome food, great coffee in the Molonglo Valley.', 'A favourite among mums and bubs', 'coombs'],
  greenway: ['Wholesome food, great coffee on the South Side.', 'Service with a smile', 'greenway'],
  gungahlin: ['Wholesome food, great coffee, up north in Gungahlin.', 'Last stop of the light rail, across from Coles', 'gungahlin'],
  dickson: ['Wholesome food, great coffee in Dickson, near the city.', '', 'dickson'],
  belconnen: ['A gluten free café on the North Side.', 'Coeliac-friendly kitchen, including your furry friends!', 'belconnen'],
  phillip: ['100% gluten free, every day.', 'Gluten Free Café & Shoppe. The whole menu, no cross-contamination worries', 'phillip'],
  kingston: ['Rosemary by EightyTwenty, in the Inner South.', 'Great outdoor area for pet lovers', 'kingston'],
  akuna: ['Coming soon to the heart of the city.', 'Listed venue, full details to be confirmed', 'akuna']
};
// fixtures/menu.ts featured:true, in menu order — Home "From the kitchen" shows the first six with photos.
export const KITCHEN_DEFAULT = ['mighty', 'ftoast', 'benedict', 'japanese', 'hotcoffee', 'nutty'];
export const DIET_OPTIONS = ['GF*', 'DF*', 'Vegan', 'Vegetarian', 'Gluten free', 'Dairy free'];

export const GROUPS = [
  { id: 'home', name: 'Home', screens: 'Home tab', preview: 'home', intro: 'Greeting, your café card, What’s on, the gift card banner and the two photo rails.', sections: [
    { id: 'header', title: 'Greeting & header', where: 'Top of Home · HomeHeader.tsx, whatsOn.ts', note: 'The greeting is followed by the customer’s first name.', fields: [
      T('yourCafe', 'Café label', 'Your café'), T('gMorning', 'Greeting before 11am', 'Good morning'), T('gAfternoon', 'Greeting 11am – 3pm', 'Good afternoon'), T('gEvening', 'Greeting after 3pm', 'Good evening')] },
    { id: 'cafe', title: 'Your café card', where: 'Below the greeting · FeaturedCafeCard.tsx', note: 'Headline and photo come from the customer’s café — edit them in Café information.', link: ['cafes', 'Open Café information'], fields: [
      T('orderCta', 'Main button', 'Order ahead'), T('viewCta', 'Link', 'View café')] },
    { id: 'whatsOn', title: '01 · What’s on', where: 'Home · WhatsOnSection.tsx', toggle: true, move: true, note: 'The lead tile is the first offer shown in Promotions & offers.', link: ['offers', 'Open Promotions & offers'], fields: [
      T('title', 'Section heading', 'What’s on'), T('action', 'Section link', 'See all'), T('leadCta', 'Lead tile link', 'See offer'),
      L('leadSub', 'Lead offer short line (Home only)', 'Buy a keep cup, your next two coffees are on us.'),
      L('soonSub', 'Coming-soon café line', 'A new EightyTwenty café. Hours to be confirmed.'), T('cateringTag', 'Catering tile tag', 'Catering'),
      T('kingTag', 'Kingston tile tag', 'Inner South'), T('kingTitle', 'Kingston tile title', 'Rosemary by EightyTwenty'), T('kingBrief', 'Kingston tile short line', 'Rosemary, Kingston'), L('kingSub', 'Kingston tile description', 'Our Kingston café on Tench St.')] },
    { id: 'gift', title: 'Gift card banner', where: 'Home · GiftCardBanner.tsx', toggle: true, move: true, fields: [
      T('eyebrow', 'Small heading', 'Gift cards'), T('title', 'Headline', 'The gift of delicious food.'), T('cta', 'Link', 'Send a gift card'),
      IMG('img', 'Banner photo', 'img-pos/site/gift-cards.jpg', '6:5', '620 × 520', 'Home gift card banner, bottom right')] },
    { id: 'cafes', title: '02 · Our cafés', where: 'Home · HomeRails.tsx', toggle: true, move: true, note: 'Shows every open café except the customer’s own. Photos come from Café information.', link: ['cafes', 'Open Café information'], fields: [
      T('title', 'Section heading', 'Our cafés'), T('action', 'Section link', 'See all')] },
    { id: 'kitchen', title: '03 · From the kitchen', where: 'Home · HomeRails.tsx', toggle: true, move: true, fields: [
      T('title', 'Section heading', 'From the kitchen'), T('action', 'Section link', 'Full menu'), { k: 'items', label: 'Featured dishes (up to 6)', type: 'featured', def: KITCHEN_DEFAULT }] }
  ], dev: ['Greeting time-of-day rules and the customer’s name', 'Notification pill (copy is in Notifications)', 'Section numbering, animations and layout'] },

  { id: 'menu', name: 'Menu & products', screens: 'Menu tab · item sheet', preview: 'menu', intro: 'Menu header copy, shortcuts and every product. Product details are shared with Inventory & menu and the POS till.', sections: [
    { id: 'products', title: 'Products', where: 'Menu tab, item sheet, Home “From the kitchen”', catalogue: true, fields: [] },
    { id: 'header', title: 'Menu header', where: 'Menu tab · MenuHeader.tsx, MenuScreen.tsx', fields: [
      T('title', 'Heading', 'Menu'), T('change', 'Change link', 'Change'), L('legend', 'Dietary key', 'GF gluten free · DF dairy free · VG vegan · V vegetarian · opt on request.')] },
    { id: 'quick', title: 'Reserve & catering shortcuts', where: 'Menu tab · QuickActions.tsx', note: 'The catering line (“From $16.50 pp”) is worked out from the lowest package price.', fields: [
      T('resTitle', 'Reserve card title', 'Reserve a table'), T('resSub', 'Reserve card line', '12 hours’ notice'),
      IMG('resImg', 'Reserve card photo', I + 'lifestyle/brunch-table.webp', '1:1', '200 × 200', 'Menu tab, small round thumbnail'),
      T('catTitle', 'Catering card title', 'Catering'), IMG('catImg', 'Catering card photo', 'img-pos/catering/breakfast-bagel.jpg', '1:1', '200 × 200', 'Menu tab, small round thumbnail')] }
  ], dev: ['Modifier groups and option prices (Inventory & menu)', 'Cart, checkout, surcharge and order status copy', 'Category order and category images'] },

  { id: 'ordering', name: 'Ordering', screens: 'Menu header · cart · checkout', preview: 'menu', intro: 'Pickup wording customers see while ordering ahead. Orders from the app arrive in POS Orders & Kitchen with an App label.', sections: [
    { id: 'pickup', title: 'Pickup', where: 'Menu header and café cards · constants/business.ts', fields: [T('wait', 'Wait shown when a café has no published wait', '15–20 min')] },
    { id: 'rules', title: 'Ordering rules', where: 'Shared with POS', note: 'Card surcharge 2.95% · delivery adds 10% · “Later today” pickup 7:00am – 2:30pm in 30-minute slots · up to 20 of one item. These are checked at checkout, so they’re changed by the app team, not as text. The ordering questions in Help & contact are edited there.', link: ['profile', 'Open Profile & help'], fields: [] }
  ], dev: ['Cart, checkout and order status wording (not re-checked this session — the app folder was not attached)', 'Payments and Apple Pay', 'Surcharge, delivery and pickup slot rules'] },

  { id: 'offers', name: 'Promotions & offers', screens: 'What’s on screen · Home', preview: 'offers', intro: 'In-store offers shown on the What’s on screen. The first shown offer leads Home “What’s on”.', sections: [
    { id: 'offers', title: 'Offers', where: 'What’s on screen · OffersScreen.tsx · fixtures/content.ts', fields: [
      { k: 'items', label: 'Offers', type: 'list', add: 'Add an offer', canAdd: true, summary: 'name', thumb: 'img', newItem: { name: 'New offer (demo)', tag: 'In store · all cafés', line: '', fine: '', img: '', show: false },
        def: [{ _id: 'keepcups', name: 'Keep Cups', tag: 'In store · all cafés', line: 'Buy a keep cup in store and the next two coffees are on us.', fine: 'Ongoing · redeemed at the counter', img: 'img-pos/site/keep-cups.jpg', show: true }],
        item: [T('name', 'Offer name'), T('tag', 'Tag'), L('line', 'Headline'), T('fine', 'Fine print'), IMG('img', 'Offer photo', '', '3:2', '1200 × 800', 'What’s on screen (full width) and Home lead tile (round crop)', { optional: true }), { k: 'show', label: 'Show in the app', type: 'bool' }] }] },
    { id: 'screen', title: 'What’s on screen', where: 'OffersScreen.tsx', fields: [T('title', 'Screen title', 'What’s on'), T('findCta', 'Offer button', 'Find a café')] },
    { id: 'always', title: 'Always-on coffee card tile', where: 'Bottom of What’s on', fields: [
      T('eyebrow', 'Small heading', 'Always on'), T('title', 'Headline', 'Your 10th coffee is free.'), T('ready', 'When a reward is ready', 'Your free coffee is ready.'),
      T('one', 'One stamp to go', 'One more for a free coffee.'), T('many', 'More stamps to go ({n} = number)', '{n} more for a free coffee.')] }
  ], dev: ['Offer dates and redemption (no scheduling in the app yet)', 'Push delivery of offers'] },

  { id: 'loyalty', name: 'Loyalty', screens: 'Loyalty tab · member card', preview: 'loyalty', intro: 'What customers read on the coffee card. The stamp rule is shared with POS Loyalty; balances are never changed here.', sections: [
    { id: 'card', title: 'Coffee card', where: 'Loyalty tab · LoyaltyScreen.tsx', fields: [
      T('label', 'Card label', 'Coffee card'), T('perStamp', 'Earn line', '1 coffee = 1 stamp'), T('toGoOne', 'One to go', '1 coffee to go'), T('toGoMany', 'More to go ({n} = number)', '{n} coffees to go'),
      T('ready', 'Reward ready', 'Free coffee ready'), T('wallet', 'Wallet button', 'Apple Wallet'), T('show', 'Card button', 'Show card'), T('recent', 'Activity heading', 'Recent')] },
    { id: 'reward', title: 'Free coffee reward', where: 'Shown when 9 stamps are collected', fields: [
      T('title', 'Reward title', 'Free coffee'), T('sub', 'Reward line', 'Any coffee, any size.'), T('redeem', 'Main button', 'Redeem in app'), T('counter', 'Second button', 'Show at counter')] },
    { id: 'programme', title: 'How it works', where: 'Programme copy · fixtures/content.ts', fields: [
      L('eligibility', 'What earns a stamp', 'Any coffee or hot drink, any size, at any EightyTwenty café.'), T('reward', 'Reward summary', 'Your 10th coffee is free.')] },
    { id: 'rule', title: 'Stamp rule', where: 'Shared with POS Loyalty · constants/business.ts', note: 'Changing the rule affects every customer’s card from the next stamp. Existing stamps and redeemed rewards stay as they are.', fields: [
      { k: 'per', label: 'Stamps needed for a free coffee', type: 'number', min: 4, max: 12, shared: 'loyalty' }] }
  ], dev: ['Customer stamp balances and history (POS Loyalty)', 'Apple Wallet pass design', 'Barcode and member number'] },

  { id: 'reserve', name: 'Reservations', screens: 'Reserve screen', preview: 'reserve', intro: 'Copy and photo on the table request screen. Booking rules stay in Reservations.', sections: [
    { id: 'intro', title: 'Page heading', where: 'ReserveScreen.tsx', fields: [
      T('header', 'Screen title', 'Reserve'), T('eyebrow', 'Small heading', 'Bookings'), T('title', 'Headline', 'A table at your local,'), T('titleItalic', 'Headline (italic end)', 'kept for you.'),
      L('lede', 'Intro', 'Brunch for two or a long table for the whole family. Send us a request and we’ll confirm by email.')] },
    { id: 'hero', title: 'Photo & highlights', where: 'Below the intro', fields: [
      IMG('img', 'Photo', I + 'lifestyle/brunch-table.webp', '2:1', '1200 × 600', 'Reserve screen, below the intro'),
      { k: 'chips', label: 'Highlights on the photo', type: 'list', summary: 'text', canAdd: true, add: 'Add a highlight', max: 4, newItem: { text: '' }, def: [{ _id: 'c1', text: 'Open daily' }, { _id: 'c2', text: 'Indoor & outdoor' }, { _id: 'c3', text: '12h notice preferred' }], item: [T('text', 'Highlight')] }] },
    { id: 'form', title: 'Request form', where: 'Request a table card', fields: [
      T('title', 'Form heading', 'Request a table'), T('reply', 'Form note', 'Reply by email'), T('notesPh', 'Special requests hint', 'Dietary requirements, high chair, a birthday…'),
      T('cta', 'Button', 'Prepare booking email'), T('caption', 'Under the button', 'Send the email draft to request a table.'),
      L('error', 'Missing details message', 'Please fill in the highlighted fields so we can confirm your booking.')] },
    { id: 'info', title: 'Good to know', where: 'Bottom of the screen', fields: [
      T('t1', 'Item 1 heading', 'Confirmation'), L('b1', 'Item 1 text', 'We reply by email once your table is set.'),
      T('t2', 'Item 2 heading', 'Same-day'), L('b2', 'Item 2 text ({sms} = same-day number)', 'Text {sms} for today.'),
      T('t3', 'Item 3 heading', 'Hours'), L('b3', 'Item 3 text', 'Most cafés 6–7am to 3pm, seven days.')] },
    { id: 'done', title: 'After sending', where: 'Success card', fields: [T('title', 'Heading', 'Your booking email is ready.'), L('body', 'Text', 'Send the draft from your email app to request your table. The café will confirm by email.')] },
    { id: 'rules', title: 'Booking rules', where: 'Shared with POS Reservations', note: 'At least 12 hours’ notice · last booking 30 minutes before close · 2 guests by default. These are checked by the app, so they’re changed in Reservations, not as text.', link: ['#reservations', 'Open Reservations'], fields: [] }
  ], dev: ['Booking time checks and validation messages', 'Email draft wording'] },

  { id: 'catering', name: 'Catering', screens: 'Catering screen · Home tile', preview: 'catering', intro: 'Catering packages are shared with POS Catering and the website. Other copy is app-only.', sections: [
    { id: 'intro', title: 'Page heading', where: 'CateringScreen.tsx', fields: [
      T('eyebrow', 'Small heading', 'Catering'), T('title', 'Headline', 'Good food, made for sharing.'), L('lede', 'Intro', 'Breakfast, lunch and afternoon tea catering for meetings, events and everyday gatherings.'),
      T('incl', 'Details button', 'What’s included'), T('enquire', 'Package button', 'Enquire')] },
    { id: 'packages', title: 'Packages', where: 'Shared with website and POS Catering', fields: [{ k: 'pk', label: 'Packages', type: 'records', source: 'packages' }] },
    { id: 'highlights', title: 'Highlights', where: 'Below the packages', note: 'Icons are app artwork and stay as they are.', fields: [
      { k: 'items', label: 'Highlights', type: 'list', summary: 'title', def: [{ _id: 'h1', title: 'Tailored to you', sub: 'Made to suit your event' }, { _id: 'h2', title: 'Dietary flexibility', sub: 'Vegan & gluten free available' }, { _id: 'h3', title: 'Best for', sub: 'Functions, meetings, celebrations' }, { _id: 'h4', title: 'Easy enquiry', sub: 'Send details, we confirm by email' }], item: [T('title', 'Title'), T('sub', 'Line')] }] },
    { id: 'form', title: 'Enquiry form', where: 'Catering enquiry', fields: [
      T('kicker', 'Small heading', 'Catering enquiry'), L('title', 'Heading', 'To enquire about catering with us, fill in the form and we will respond as soon as we can.'),
      IMG('img', 'Photo', I + 'lifestyle/table-spread.webp', '9:5', '1200 × 667', 'Catering screen, above the enquiry form'),
      T('cta', 'Button', 'Submit enquiry'), L('estimate', 'Estimate note', 'an estimate from the listed per-person price, not a quote. Catering is quoted per event.'),
      L('error', 'Missing details message', 'Please fill in the highlighted fields so we can get back to you.')] },
    { id: 'done', title: 'After sending', where: 'Success card', fields: [T('title', 'Heading', 'Your email draft is ready.'), L('body', 'Text', 'Send it from your email app to complete the enquiry. We’ll respond as soon as we can with a quote for your event.')] }
  ], dev: ['Minimum guests, notice and estimate maths (POS Catering)', 'Email draft wording', 'Dietary option list'] },

  { id: 'gift', name: 'Gift cards', screens: 'Gift cards screen', preview: 'gift', intro: 'Copy on the gift card screen. The Home banner photo is in Home.', link: ['home', 'Home banner'], sections: [
    { id: 'card', title: 'Balance card', where: 'GiftCardsScreen.tsx', fields: [T('header', 'Screen title', 'Gift cards'), T('label', 'Card label', 'Gift card'), T('balance', 'Balance label', 'Balance'), T('meta', 'Card line', 'redeemable at any EightyTwenty café')] },
    { id: 'send', title: 'Send a gift card', where: 'Below the card', fields: [
      T('title', 'Heading', 'Send a gift card'), L('lede', 'Intro', 'Treat a friend who loves our food and coffee to the gift of delicious food.'),
      L('note', 'Provider note', 'eGift cards are issued and redeemed through Square. Physical cards are available in store.'), T('another', 'After sending', 'Send another')] },
    { id: 'terms', title: 'History & terms', where: 'Bottom of the screen', fields: [T('history', 'History heading', 'History'),
      L('terms', 'Terms', 'Gift cards can be used at any EightyTwenty café. They can’t be exchanged for cash or reloaded, and lost or stolen cards can’t be replaced, except where the Australian Consumer Law requires otherwise.')] }
  ], dev: ['Amounts ($25 / $50 / $75 / $100) and Apple Pay — tied to Square', 'Customer balances and history (POS Gift cards)'] },

  { id: 'cafes', name: 'Café information', screens: 'Our cafés · café detail · Home', preview: 'cafes', intro: 'Name, address, phone and hours are shared with POS Settings and the website. Headline, note and photo are app-only.', sections: [
    { id: 'list', title: 'Cafés', where: 'fixtures/locations.ts', fields: [{ k: 'cf', label: 'Cafés', type: 'records', source: 'cafes' }] },
    { id: 'screen', title: 'Our cafés screen', where: 'CafesScreen.tsx', fields: [T('title', 'Screen title', 'Our cafés'), T('orderCta', 'Main button', 'Order here'), T('bookCta', 'Second button', 'Book a table')] },
    { id: 'detail', title: 'Café detail', where: 'CafeDetailScreen.tsx', fields: [
      L('soon', 'Coming-soon notice', 'Opening soon — ordering and bookings open when hours are confirmed.'), T('maps', 'Directions link', 'Open in Maps'),
      T('lHours', 'Hours label', 'Hours'), T('lPhone', 'Phone label', 'Phone'), T('lServices', 'Services label', 'Services'), T('lDir', 'Directions label', 'Directions')] }
  ], dev: ['Open / closed status rules', 'Online ordering links per café', 'Pickup / delivery / dine in services'] },

  { id: 'welcome', name: 'Welcome & sign in', screens: 'Welcome · log in / sign up sheet', preview: 'welcome', intro: 'Tagline and the rotating dish hero. Sign-in itself is handled by the app.', sections: [
    { id: 'hero', title: 'Rotating dish hero', where: 'WelcomeScreen.tsx · FoodOrbit.tsx', note: 'Five dishes rotate with their headlines. Use cut-out photos on a transparent background.', fields: [
      T('tagline', 'Tagline', 'Wholesome food, great coffee.'),
      { k: 'dishes', label: 'Dishes', type: 'list', summary: 'l1', thumb: 'img', def: [
        { _id: 'd1', l1: 'Fuel your', l2: 'morning.', img: I + 'hero/mighty-breakfast.webp' }, { _id: 'd2', l1: 'Brunch without', l2: 'the fuss.', img: I + 'hero/acai-bowl.webp' },
        { _id: 'd3', l1: 'Clean food.', l2: 'Big flavour.', img: I + 'hero/breakfast-burger.webp' }, { _id: 'd4', l1: 'Coffee worth', l2: 'getting up for.', img: I + 'hero/french-toast.webp' },
        { _id: 'd5', l1: 'Mindful by nature,', l2: 'indulgent by choice.', img: I + 'hero/green-nourish-bowl.webp' }],
        item: [T('l1', 'Headline line 1'), T('l2', 'Headline line 2'), IMG('img', 'Dish cut-out', '', '1:1', '1000 × 1000, transparent', 'Welcome screen hero', { fit: 'contain' })] }] },
    { id: 'buttons', title: 'Buttons', where: 'Bottom of Welcome', fields: [T('login', 'Main button', 'Log in'), T('signup', 'Second button', 'Sign up')] },
    { id: 'sheet', title: 'Log in / sign up sheet', where: 'AuthSheet.tsx', fields: [
      L('terms', 'Sign-up fine print', 'By creating an account you agree to our Terms and Privacy Policy.'), T('have', 'Switch to log in', 'Already have an account?'),
      T('forgot', 'Forgot password link', 'Forgot password?'), T('expired', 'Session expired message', 'Your session has expired. Please log in again.')] }
  ], dev: ['Wordmark and logo', 'Sign-in, password rules and validation messages', 'Hero animation timing'] },

  { id: 'notifications', name: 'Notifications', screens: 'Inbox · settings · Home pill', preview: 'notifications', intro: 'Inbox copy and the short lines shown on Home. Messages themselves are created by orders, bookings and loyalty.', sections: [
    { id: 'inbox', title: 'Inbox', where: 'NotificationsScreen.tsx', fields: [
      T('title', 'Screen title', 'Notifications'), T('markAll', 'Mark all link', 'Mark all read'), T('clear', 'Clear link', 'Clear all'), T('settings', 'Settings link', 'Notification settings'),
      T('emptyTitle', 'Empty heading', 'You’re all caught up'), L('emptyBody', 'Empty text', 'Order updates, stamps and booking news will land here.')] },
    { id: 'pill', title: 'Home notification pill', where: 'Home, under the greeting · whatsOn.ts', fields: [
      T('order', 'Order', 'Order ready for pickup'), T('loyalty', 'Coffee card', 'Stamp added to your coffee card'), T('booking', 'Booking', 'Table booking confirmed'),
      T('offer', 'Offer', 'New offer at your café'), T('gift', 'Gift card', 'Gift card balance updated')] },
    { id: 'prefs', title: 'Notification settings', where: 'notifications/constants.ts', fields: [
      T('d1', 'Order updates', 'When your order is confirmed and ready'), T('d2', 'Bookings', 'Confirmations and reminders'), T('d3', 'Coffee card', 'New stamps and free coffees'),
      T('d4', 'Offers & news', 'What’s on at your café'), T('d5', 'Gift card activity', 'Balance changes and gifts')] }
  ], dev: ['Push delivery — no notification service is connected', 'Message text generated by orders, bookings and loyalty'] },

  { id: 'profile', name: 'Profile & help', screens: 'Profile tab · Help & contact · Privacy', preview: 'help', intro: 'Help questions, contact details and profile labels. Account details, passwords and balances are never editable here.', sections: [
    { id: 'help', title: 'Help & contact', where: 'HelpScreen.tsx · fixtures/content.ts', fields: [
      T('title', 'Screen title', 'Help & contact'), T('questions', 'Questions heading', 'Questions'),
      { k: 'faqs', label: 'Questions', type: 'list', summary: 'q', canAdd: true, add: 'Add a question', newItem: { q: 'New question', a: '' }, def: [
        { _id: 'f1', q: 'How does the coffee card work?', a: 'Every coffee earns a stamp. Collect nine and your tenth coffee is on us — any coffee, any size.' },
        { _id: 'f2', q: 'Can I change my order after paying?', a: 'Once submitted, our kitchen gets straight to work, so orders cannot be changed or cancelled.' },
        { _id: 'f3', q: 'Is there a card surcharge?', a: 'Card payments carry a 2.95% surcharge.' },
        { _id: 'f4', q: 'How much notice do bookings need?', a: 'At least 12 hours. For a table today, text 0422 573 102.' },
        { _id: 'f5', q: 'Where can I use a gift card?', a: 'At any EightyTwenty café. eGift cards are issued and redeemed through Square, and physical cards are available in store.' },
        { _id: 'f6', q: 'Which cafés are gluten free?', a: 'Phillip is 100% Gluten Free by EightyTwenty, and Belconnen is our North Side gluten free café.' }],
        item: [T('q', 'Question'), L('a', 'Answer')] },
      T('touch', 'Contact heading', 'Get in touch'), T('emailTitle', 'Email row', 'Email us'), T('smsTitle', 'Same-day row', 'Same-day bookings')] },
    { id: 'contact', title: 'Contact details', where: 'Help, Reserve and FAQ answers · constants/business.ts', fields: [T('email', 'Email', 'info@eightytwentyfood.com.au'), T('sms', 'Same-day booking SMS', '0422 573 102')] },
    { id: 'groups', title: 'Profile labels', where: 'ProfileScreen.tsx', fields: [
      T('g1', 'Group 1', 'General'), T('g2', 'Group 2', 'Payment & wallet'), T('g3', 'Group 3', 'Preferences'), T('g4', 'Group 4', 'Support'),
      T('helpRow', 'Help row', 'Help centre'), T('contactRow', 'Contact row', 'Contact your café'), T('termsRow', 'Terms row', 'Terms & privacy')] },
    { id: 'privacy', title: 'Privacy & security', where: 'PrivacyScreen.tsx', fields: [
      T('p1', 'Setting 1', 'Sign in with Face ID'), T('p1d', 'Setting 1 line', 'Skip your password on this iPhone'), T('p2', 'Setting 2', 'Use my location'), T('p2d', 'Setting 2 line', 'Show the nearest café first'),
      T('p3', 'Setting 3', 'Remember order settings'), T('p3d', 'Setting 3 line', 'Keep your café and pickup method'), T('policy', 'Policy link', 'Privacy policy'), T('termsLink', 'Terms link', 'Terms of use')] }
  ], dev: ['Customer details, passwords, payment methods and balances', 'Change password and close account', 'Order history and favourites'] },

  { id: 'nav', name: 'Navigation', screens: 'Tab bar · every screen', preview: 'home', intro: 'Tab labels. Tabs, their order and destinations are fixed by the app.', sections: [
    { id: 'tabs', title: 'Tab bar labels', where: 'TabBar.tsx', fields: [T('t1', 'Tab 1 · Home', 'Home'), T('t2', 'Tab 2 · Menu', 'Menu'), T('t3', 'Tab 3 · Loyalty', 'Loyalty'), T('t4', 'Tab 4 · Profile', 'Profile')] }
  ], dev: ['Tab icons, order and destinations', 'Screen routes and back navigation'] }
];

export const PREVIEWS = [['welcome', 'Welcome'], ['home', 'Home'], ['menu', 'Menu'], ['offers', 'What’s on'], ['loyalty', 'Loyalty'], ['reserve', 'Reserve'], ['catering', 'Catering'], ['gift', 'Gift cards'], ['cafes', 'Our cafés'], ['notifications', 'Notifications'], ['help', 'Help'], ['profile', 'Profile']];
