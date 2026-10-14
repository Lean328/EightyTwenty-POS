// Website CMS content model — built from the EightyTwenty website source (EightyTwenty-main/index.html, read-only).
// Same field format as data/app-cms.js. Section `kind` drives the optional website preview layout.
// Shared records (products, packages, cafés) are the same records App CMS and POS use.
const H = 'img-pos/app/hero/';
const T = (k, label, def, o = {}) => ({ k, label, type: 'text', def, ...o });
const L = (k, label, def, o = {}) => ({ k, label, type: 'long', def, ...o });
const IMG = (k, label, def, ratio, size, where, o = {}) => ({ k, label, type: 'image', def, ratio, size, where, ...o });
export { LIBRARY, LIB_TAGS, CAFE_APP, DIET_OPTIONS } from './app-cms.js';
export const KITCHEN_DEFAULT = [];

export const GROUPS = [
  { id: 'home', name: 'Home', screens: 'eightytwentyfood.com.au', path: '/', intro: 'Rotating dish hero, the EightyTwenty way, the featured café and the three promotion cards.', sections: [
    { id: 'hero', kind: 'lumi', title: 'Rotating dish hero', where: 'Top of the home page', note: 'Five cut-out dishes rotate with their headlines. Use photos on a transparent background.', fields: [
      T('eyebrow', 'Small heading', 'Wholesome food, great coffee.'),
      { k: 'items', label: 'Dishes', type: 'list', summary: 'l1', thumb: 'img', def: [
        { _id: 'd1', l1: 'Fuel your', l2: 'morning.', img: H + 'mighty-breakfast.webp' }, { _id: 'd2', l1: 'Brunch without', l2: 'the fuss.', img: H + 'acai-bowl.webp' },
        { _id: 'd3', l1: 'Clean food.', l2: 'Big flavour.', img: H + 'breakfast-burger.webp' }, { _id: 'd4', l1: 'Coffee worth', l2: 'getting up for.', img: H + 'french-toast.webp' },
        { _id: 'd5', l1: 'Mindful by nature,', l2: 'indulgent by choice.', img: H + 'green-nourish-bowl.webp' }],
        item: [T('l1', 'Headline line 1'), T('l2', 'Headline line 2'), IMG('img', 'Dish cut-out', '', '1:1', '1000 × 1000, transparent', 'Home hero, centre', { fit: 'contain' })] }] },
    { id: 'brand', kind: 'statement', title: 'The EightyTwenty way', where: 'Below the hero', toggle: true, move: true, fields: [
      T('eyebrow', 'Small heading', 'The EightyTwenty way'), L('title', 'Headline', 'Simple food. Good coffee. Everyday balance.'), T('cta', 'Link', 'Explore the menu →')] },
    { id: 'phillip', kind: 'split', title: 'Featured café · Phillip', where: 'Home, middle', toggle: true, move: true, fields: [
      T('title', 'Heading', 'Phillip'), IMG('img', 'Café photo', 'img-pos/site/phillip-exterior-01.jpg', '16:9', '1600 × 900', 'Home featured café'),
      L('body', 'Address & hours', 'C07/11 Launceston Street, Phillip ACT 2606\nMon–Sun 7:00am – 3:00pm'), T('cta', 'Link', 'Visit Phillip →')] },
    { id: 'cards', kind: 'cards', title: 'Keep Cups · Gift cards · Wholesale', where: 'Home, three cards', toggle: true, move: true, fields: [
      { k: 'items', label: 'Cards', type: 'list', summary: 'title', thumb: 'img', def: [
        { _id: 'k1', title: 'Keep Cups', body: 'Buy a keep cup in store and the next two coffees are on us.', img: 'img-pos/site/keep-cups.jpg', cta: 'Find a store' },
        { _id: 'k2', title: 'Gift Cards', body: 'For the friend who loves our food and coffee.', img: 'img-pos/site/gift-cards.jpg', cta: 'Buy a gift card' },
        { _id: 'k3', title: 'Wholesale · The Origin Bakery', body: 'Sourdough, buns, pastries and slices for your business.', img: 'img-pos/site/brownies.jpg', cta: 'More details' }],
        item: [T('title', 'Title'), L('body', 'Text'), IMG('img', 'Photo', '', '4:3', '1200 × 900', 'Home card'), T('cta', 'Link text')] }] }
  ], dev: ['Hero rotation timing and animation', 'Café sequence animation'] },

  { id: 'menu', name: 'Menu & products', screens: 'Menu page · item details', path: '/menu', intro: 'Menu page copy and every product. Product details are shared with Inventory & menu, the app and the POS till.', sections: [
    { id: 'products', title: 'Products', where: 'Menu page and item details', catalogue: true, fields: [] },
    { id: 'intro', kind: 'statement', title: 'Page heading', where: 'Top of the menu page', fields: [
      L('title', 'Headline', 'Breakfast, brunch and lunch. All day.'), T('legend', 'Dietary key', 'GF* · DF* · Vegan · Vegetarian'), T('note', 'Under the menu', 'Prices and dietary labels as printed on the EightyTwenty menu.'),
      { k: 'showPrices', label: 'Show prices', type: 'bool', def: true }] },
    { id: 'notices', kind: 'notice', title: 'Café notices', where: 'Banner above the menu for that café', fields: [
      L('civic', 'Civic', 'Civic is our express café, with limited menu options. Weekdays only.'), L('akuna', 'Akuna St', 'Akuna St details are being confirmed, so online ordering for this café isn’t available yet. Choose another café to order.')] }
  ], dev: ['Modifier groups and option prices (Inventory & menu)', 'Category order', 'Menu is browse-only — online ordering is switched off on the public site'] },

  { id: 'ordering', name: 'Online ordering', screens: 'Cart · checkout (switched off on the public site)', path: '/checkout', intro: 'Customer-facing ordering copy. Online ordering is hidden on the live website until order creation and payments are connected, so these show only when it’s switched on.', sections: [
    { id: 'cart', kind: 'text', title: 'Cart', where: 'Order drawer', fields: [T('title', 'Heading', 'Your order'), T('empty', 'Empty cart heading', 'Your cart is empty.'), T('emptyCta', 'Empty cart button', 'Browse the menu'), T('surcharge', 'Surcharge line', 'Card surcharge (2.95%) calculated at checkout.')] },
    { id: 'checkout', kind: 'text', title: 'Checkout', where: 'Checkout page', fields: [
      T('title', 'Heading', 'Checkout'), L('delivery', 'Delivery note', 'A 10% delivery surcharge applies. Delivery zones and minimums are confirmed by the café.'),
      L('card', 'Card note', 'A 2.95% card surcharge applies. Visa · Mastercard · Amex · JCB.'), L('final', 'Before placing an order', 'Once submitted, our kitchen gets straight to work, so orders cannot be changed or cancelled.'),
      L('error', 'Missing details message', 'Please complete the highlighted details before placing your order.')] }
  ], dev: ['Switching online ordering on (needs real order creation and payments)', 'Surcharge rates, delivery zones and pickup slots', 'Order confirmation emails'] },

  { id: 'locations', name: 'Locations', screens: 'Locations · café pages', path: '/locations', intro: 'Café names, addresses, phone and hours are shared with POS Settings and the app.', sections: [
    { id: 'cf', title: 'Cafés', where: 'Locations list and each café page', fields: [{ k: 'cf', label: 'Cafés', type: 'records', source: 'cafes' }] },
    { id: 'intro', kind: 'statement', title: 'Page heading', where: 'Top of Locations', fields: [L('title', 'Headline', 'Find your nearest EightyTwenty café in Canberra.'), L('lede', 'Intro', 'Ten cafés. Choose one to see hours, directions and bookings.'), T('others', 'List heading', 'Other cafés')] },
    { id: 'gf', kind: 'text', title: 'Gluten free cafés', where: 'Phillip and Belconnen café pages', fields: [L('body', 'Text', 'The Gluten Free cafe is a part of EightyTwenty Food Group, set up as a safe place for everyone with a gluten allergy. Enjoyable, healthy food is at the core of everything we do.')] }
  ], dev: ['Open / closed status rules', 'Maps and directions links (from the address)'] },

  { id: 'reserve', name: 'Reservations', screens: 'Reserve page', path: '/reserve', intro: 'Copy on the table request page. Requests arrive in POS Reservations as pending until staff confirm them.', sections: [
    { id: 'intro', kind: 'statement', title: 'Page heading', where: 'Top of Reserve', fields: [
      T('eyebrow', 'Small heading', 'Bookings'), T('title', 'Headline', 'A table at your local,'), T('titleItalic', 'Headline (italic end)', 'kept for you.'),
      L('lede', 'Intro', 'Brunch for two or a long table for the whole family. Send us a request and we’ll confirm by email.')] },
    { id: 'info', kind: 'facts', title: 'Good to know', where: 'Beside the form', fields: [
      { k: 'items', label: 'Items', type: 'list', summary: 'title', def: [{ _id: 'i1', title: 'Confirmation', body: 'We reply by email once your table is set.' }, { _id: 'i2', title: 'Same-day', body: 'Text 0422 573 102 for today.' }, { _id: 'i3', title: 'Hours', body: 'Most cafés 6–7am to 3pm, seven days.' }], item: [T('title', 'Heading'), L('body', 'Text')] }] },
    { id: 'form', kind: 'form', title: 'Request form', where: 'Request a table card', fields: [
      T('title', 'Form heading', 'Request a table'), T('reply', 'Form note', 'Reply by email'), L('notice', 'Date note', 'Bookings need at least 12 hours’ notice. For today, text 0422 573 102.'),
      L('timeNote', 'Time note', 'Kitchen closes at 3pm. Times shown in 30-minute slots.'), T('cta', 'Button', 'Prepare booking email'), T('caption', 'Under the button', 'Send the email draft to request a table.'),
      L('error', 'Missing details message', 'Please fill in the highlighted fields so we can confirm your booking.')] },
    { id: 'done', kind: 'text', title: 'After sending', where: 'Success card', fields: [T('title', 'Heading', 'Your booking email is ready.'), L('body', 'Text', 'Send the draft from your email app to request your table. The café will confirm by email.')] },
    { id: 'rules', title: 'Booking rules', where: 'Shared with POS Reservations and the app', note: 'At least 12 hours’ notice · last booking 30 minutes before close · kitchen closes at 3pm. These are checked by the booking form, so they’re changed in Reservations, not as text.', link: ['#reservations', 'Open Reservations'], fields: [] }
  ], dev: ['Booking validation and email draft wording'] },

  { id: 'catering', name: 'Catering', screens: 'Catering page', path: '/catering', intro: 'Catering packages are shared with POS Catering and the app. Enquiries arrive in POS Catering as new enquiries — never as paid orders.', sections: [
    { id: 'pk', title: 'Packages', where: 'Shared with POS Catering and the app', fields: [{ k: 'pk', label: 'Packages', type: 'records', source: 'packages' }] },
    { id: 'intro', kind: 'statement', title: 'Page heading', where: 'Top of Catering', fields: [T('eyebrow', 'Small heading', 'Catering'), T('title', 'Headline', 'Good food, made for sharing.'), L('lede', 'Intro', 'Breakfast, lunch and afternoon tea catering for meetings, events and everyday gatherings.'), T('cta', 'Link', 'Enquire about catering ↗')] },
    { id: 'highlights', kind: 'facts', title: 'Highlights', where: 'Below the packages', note: 'Icons are website artwork and stay as they are.', fields: [
      { k: 'items', label: 'Highlights', type: 'list', summary: 'title', def: [{ _id: 'h1', title: 'Tailored to you', body: 'Made to suit your event' }, { _id: 'h2', title: 'Dietary flexibility', body: 'Vegan & gluten free available' }, { _id: 'h3', title: 'Best for', body: 'Functions, meetings, celebrations' }, { _id: 'h4', title: 'Easy enquiry', body: 'Send details, we confirm by email' }], item: [T('title', 'Title'), T('body', 'Line')] }] },
    { id: 'form', kind: 'form', title: 'Enquiry form', where: 'Bottom of Catering', fields: [L('title', 'Heading', 'To enquire about catering with us, fill in the form and we will respond as soon as we can.'), T('cta', 'Button', 'Prepare enquiry email'), T('email', 'Enquiries go to', 'info@eightytwentyfood.com.au')] }
  ], dev: ['Minimum guests, notice and estimate maths (POS Catering)', 'Email draft wording'] },

  { id: 'gift', name: 'Gift cards', screens: 'Gift cards page', path: '/gift-cards', intro: 'Gift card page copy and photo. eGift cards are sold through Square.', sections: [
    { id: 'hero', kind: 'split', title: 'Gift cards', where: 'Gift cards page', fields: [
      L('title', 'Headline', 'The gift of delicious food.'), L('body', 'Text', 'Looking for the perfect gift for a friend who loves our food and coffee? Load up one of our gift cards today and treat them to the gift of delicious food.'),
      L('note', 'Provider note', 'eGift cards are issued and redeemed through Square. Physical cards are available in store.'), IMG('img', 'Photo', 'img-pos/site/gift-cards.jpg', '4:3', '1200 × 900', 'Gift cards page'),
      T('cta', 'Button', 'Buy a gift card'), T('ctaLink', 'Button link', 'https://squareup.com/gift/MLJ2HRQQYVY0R/order')] }
  ], dev: ['Square eGift checkout', 'Gift card balances (POS Gift cards)'] },

  { id: 'about', name: 'About', screens: 'About page', path: '/about', intro: 'Brand story and acknowledgement.', sections: [
    { id: 'hero', kind: 'statement', title: 'Page heading', where: 'Top of About', fields: [T('eyebrow', 'Small heading', 'About EightyTwenty'), L('title', 'Headline', 'Simple food. Good coffee. Everyday balance.')] },
    { id: 'story', kind: 'text', title: 'Our story', where: 'About, story', fields: [L('body', 'Story', 'EightyTwenty started in Canberra as a café for clean, natural, unprocessed food: breakfast, brunch and lunch you can eat every day, and EightyTwenty coffee worth getting up for. Ten cafés on, the idea hasn’t changed: 80% mindful, 20% indulgent, and a table where everyone’s welcome.'), L('body2', 'Gluten free note', 'Two of our cafés, Belconnen and Phillip, are dedicated gluten-free kitchens, so coeliac guests can order anything on the menu.'), T('pillar', 'Pillar 03 line', 'Mindful most of the time. Indulgent when it counts.')] },
    { id: 'find', kind: 'statement', title: 'Find your café', where: 'Bottom of About', fields: [T('title', 'Headline', 'Find your café.'), T('lede', 'Line', 'Ten cafés across Canberra, open from 6am.'), T('cta', 'Link', 'See locations →')] }
  ], dev: [] },

  { id: 'wholesale', name: 'Wholesale', screens: 'Wholesale page', path: '/wholesale', intro: 'Wholesale enquiries prepare an email to the wholesale inbox — there is no POS destination for them yet.', sections: [
    { id: 'intro', kind: 'statement', title: 'Page heading', where: 'Top of Wholesale', fields: [L('title', 'Headline', 'Looking for wholesome and delicious food options?'), L('lede', 'Intro', 'Our wholefood offerings are packed with flavour and nutrition, and we’re proud to offer a variety of options to suit every taste and dietary need.')] },
    { id: 'form', kind: 'form', title: 'Enquiry', where: 'Wholesale form', fields: [L('title', 'Heading', 'To organise a wholesale order with us, complete the enquiry form and we will be in touch.'), T('cta', 'Button', 'Prepare enquiry email'), T('email', 'Enquiries go to', 'wholesale@eightytwentyfood.com.au')] }
  ], dev: ['Wholesale enquiry handling (email only — backend needed)'] },

  { id: 'account', name: 'Log in & sign up', screens: 'Log in · sign up · account', path: '/account', intro: 'Account screen copy. Accounts are a frontend preview on the website — sign-in isn’t connected.', sections: [
    { id: 'login', kind: 'text', title: 'Log in', where: 'Log in page', fields: [T('title', 'Heading', 'Welcome back'), L('body', 'Text', 'Log in to see your bookings and saved details.'), T('side', 'Side panel heading', 'New here?'), L('sideBody', 'Side panel text', 'Save your details and keep bookings in one place.')] },
    { id: 'signup', kind: 'text', title: 'Sign up', where: 'Sign up page', fields: [T('title', 'Heading', 'Create your account'), L('body', 'Text', 'One account for bookings and saved details at our cafés.'), T('side', 'Side panel heading', 'Welcome back.'), L('sideBody', 'Side panel text', 'Your bookings are right where you left them.')] },
    { id: 'reset', kind: 'text', title: 'Password reset', where: 'Reset page', fields: [T('title', 'Heading', 'Reset your password'), L('body', 'Text', 'Enter the email address linked to your account.')] }
  ], dev: ['Sign-in, password reset and account storage', 'Preview-only notices (must stay until accounts are connected)'] },

  { id: 'legal', name: 'Policies', screens: 'Privacy · refunds · accessibility · cookies', path: '/privacy', intro: 'Policy introductions and key paragraphs. Have legal wording reviewed before publishing.', sections: [
    { id: 'privacy', kind: 'text', title: 'Privacy policy', where: '/privacy', fields: [T('title', 'Heading', 'Privacy policy'), L('body', 'Introduction', 'EightyTwenty runs ten cafés across Canberra. This policy explains what personal information we collect when you order, book a table, request catering or contact us, and what we do with it. We handle personal information in line with the Privacy Act 1988 (Cth) and the Australian Privacy Principles.')] },
    { id: 'refund', kind: 'text', title: 'Refund policy', where: '/refunds', fields: [T('title', 'Heading', 'Refund policy'), L('body', 'Introduction', 'If something isn’t right, tell us. We’d rather fix it than have you leave unhappy. This policy sits alongside your rights under the Australian Consumer Law, which nothing here takes away.'),
      L('bookings', 'Bookings and catering', 'Table bookings are free and you can change or cancel one by replying to your confirmation or calling the café. Please let us know as early as you can so we can release the table.\n\nCatering is quoted per event. Because we order produce and roster staff ahead of time, deposits and cancellation terms are set out in writing on your quote and are what applies to your booking. Changes to numbers are welcome up to the cut-off stated there.'),
      L('gift', 'Gift cards', 'Gift cards can be used at any EightyTwenty café. They cannot be exchanged for cash or reloaded, and lost or stolen cards can’t be replaced, except where the Australian Consumer Law requires otherwise. If a gift card was bought in error, contact us before it’s used and we’ll help.')] },
    { id: 'access', kind: 'text', title: 'Accessibility', where: '/accessibility', fields: [T('title', 'Heading', 'Accessibility'), L('body', 'Introduction', 'We want everyone to be able to use this site and sit down comfortably in our cafés. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA, and we treat accessibility as ongoing work rather than a box to tick.'),
      L('dietary', 'Dietary access', 'Our Phillip café is 100% gluten free and our Belconnen café is a dedicated gluten free kitchen. Across the other cafés we prepare gluten free, dairy free, vegan and vegetarian dishes in shared kitchens, so we can’t guarantee an allergen-free environment. Please tell our team about an allergy before you order and we’ll talk you through what we can do safely.')] },
    { id: 'cookies', kind: 'text', title: 'Cookie policy', where: '/cookies', fields: [T('title', 'Heading', 'Cookie policy'), L('body', 'Introduction', 'Cookies are small files a website stores on your device so it can remember things between pages and visits. This page explains which ones we use and how to turn them off. It should be read with our privacy policy.')] }
  ], dev: ['Remaining policy sections (long-form legal text) — edit with the app team'] },

  { id: 'nav', name: 'Navigation & footer', screens: 'Every page', path: 'all pages', intro: 'Header links and the footer. Link destinations are fixed so pages can’t be broken from here.', sections: [
    { id: 'links', kind: 'nav', title: 'Header links', where: 'Top of every page', fields: [
      { k: 'items', label: 'Links', type: 'list', summary: 'label', def: ['Home', 'Menu', 'Locations', 'Reserve', 'Catering', 'About', 'Gift cards', 'Wholesale'].map((l, i) => ({ _id: 'n' + i, label: l, show: true })), item: [T('label', 'Label'), { k: 'show', label: 'Show in the header', type: 'bool' }] },
      T('cta', 'Header button', 'Reserve')] },
    { id: 'footer', kind: 'footer', title: 'Footer', where: 'Bottom of every page', fields: [
      L('tagline', 'Tagline', 'Clean, natural, unprocessed food\nand eighty twenty coffee.'), T('sub', 'Line under tagline', 'Ten cafés across Canberra, open from 6am.'),
      T('email', 'Email', 'info@eightytwentyfood.com.au'), T('phone', 'Phone', '0410 380 999'), T('social', 'Instagram', '@eightytwentyfood'),
      L('ack', 'Acknowledgement of Country', 'EightyTwenty acknowledges the First Peoples of this land and recognises their continuous connection to culture, community and Country, working and serving on Ngunnawal and Ngambri land.')] }
  ], dev: ['Link destinations and page routes', 'Mobile bottom bar'] },

  { id: 'seo', name: 'Website settings', screens: 'Search results · link previews', path: 'all pages', intro: 'How the site appears in search results and when shared.', sections: [
    { id: 'meta', kind: 'text', title: 'Search & sharing', where: 'Browser tab, search results, link previews', fields: [T('title', 'Site title', 'EightyTwenty · Wholesome food, great coffee'), L('desc', 'Description', 'Wholesome food, great coffee — EightyTwenty cafés across Canberra.'), IMG('share', 'Share image', 'img-pos/site/phillip-exterior-01.jpg', '1.91:1', '1200 × 630', 'Link previews on social and messaging apps')] }
  ], dev: ['Domain, analytics and cookie banner'] },

  { id: 'text', name: 'Site text', index: 'text', screens: 'Every page', intro: 'Every editable sentence on the website in one searchable list. Edits go into that page’s draft.', sections: [] },
  { id: 'media', name: 'Media & images', index: 'image', screens: 'Every page', intro: 'Every editable website image in one place. Product and package photos are shared with the app and POS.', sections: [] }
];
export const PREVIEWS = GROUPS.filter(g => !g.index && g.id !== 'seo').map(g => [g.id, g.name]);
