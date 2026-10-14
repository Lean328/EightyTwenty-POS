// Domain types for the EightyTwenty POS. JSDoc only — no runtime code.
// Backend integration: these shapes are the contract the UI reads; map API DTOs onto them.

/** @typedef {'pos'|'web'|'app'} Channel */
/** @typedef {'dinein'|'pickup'|'takeaway'|'delivery'} OrderType */
/** @typedef {'new'|'preparing'|'ready'|'completed'|'refunded'|'held'} OrderStatus */
/** @typedef {'cash'|'card'|'wallet'|'gift'|'reward'} PaymentMethod */
/** @typedef {'cashier'|'manager'|'admin'} Role */
/** @typedef {'pending'|'confirmed'|'completed'|'cancelled'} ReservationStatus */
/** @typedef {'enquiry'|'quoted'|'confirmed'|'delivered'|'cancelled'} CateringStatus */
/** @typedef {'shared'|'app'|'web'} ContentScope */
/** @typedef {'draft'|'published'} ContentState */

/**
 * @typedef {Object} MenuItem
 * @property {string} id
 * @property {string} cat        Category id (see CATEGORIES)
 * @property {string} name
 * @property {number} price      AUD, GST inclusive
 * @property {string[]} diet     Dietary labels (GF*, DF*, Vegan, Vegetarian)
 * @property {string} img        Image path (photo library)
 * @property {string} desc
 * @property {ModifierGroup[]} mods
 * @property {boolean} [featured]
 */

/**
 * @typedef {Object} ModifierGroup
 * @property {string} id
 * @property {string} name
 * @property {boolean} required
 * @property {number} max        1 = single choice, 0 = unlimited
 * @property {Array<[string, number]>} options  [label, surcharge]
 */

/**
 * @typedef {Object} OrderLine
 * @property {string} key        Unique line key
 * @property {string} itemId
 * @property {string} name
 * @property {number} price      Unit price incl. selected modifiers
 * @property {number} qty
 * @property {Record<string,string[]>} sel   Modifier group id → chosen labels
 * @property {string[]} adjust   Dietary adjustments
 * @property {string} note
 */

/**
 * @typedef {Object} Order
 * @property {string} id         Human reference e.g. #8020-4417
 * @property {Channel} channel
 * @property {OrderType} type
 * @property {OrderStatus} status
 * @property {string} cafe       Location id
 * @property {string} time       HH:MM (24h)
 * @property {string} [table]
 * @property {string} [customerId]
 * @property {OrderLine[]} lines
 * @property {number} total
 * @property {boolean} paid
 * @property {PaymentMethod[]} [methods]
 * @property {{label:string, amount:number}[]} [discounts]
 */

/**
 * @typedef {Object} Customer
 * @property {string} id
 * @property {string} name
 * @property {string} phone
 * @property {string} email
 * @property {number} stamps     Current coffee stamps (reward at STAMPS_PER_REWARD)
 * @property {number} rewards    Unredeemed free coffees
 * @property {string} homeCafe
 * @property {string[]} dietary
 * @property {string} notes
 * @property {string} since
 * @property {boolean} wallet    Apple Wallet pass installed
 */

/**
 * @typedef {Object} Reservation
 * @property {string} id
 * @property {string} cafe
 * @property {string} date       YYYY-MM-DD
 * @property {string} time       HH:MM
 * @property {number} guests
 * @property {string} name
 * @property {string} phone
 * @property {string} notes
 * @property {ReservationStatus} status
 * @property {string} [customerId]
 * @property {string} [table]
 */

/**
 * @typedef {Object} CateringEnquiry
 * @property {string} id
 * @property {string} packageId  CATERING id
 * @property {number} guests
 * @property {string} date
 * @property {string} time
 * @property {'delivery'|'pickup'} fulfil
 * @property {string} address
 * @property {string} cafe
 * @property {string} name
 * @property {string} contact
 * @property {string[]} dietary
 * @property {string} notes
 * @property {number} quote      AUD estimate
 * @property {CateringStatus} status
 * @property {string} [customerId]
 */

/**
 * @typedef {Object} GiftCard
 * @property {string} code       16-digit, shown as last 4
 * @property {number} issued
 * @property {number} balance
 * @property {string} issuedOn
 * @property {string} [customerId]
 * @property {{d:string, what:string, amt:number}[]} history
 */

/**
 * @typedef {Object} ContentBlock
 * @property {string} id
 * @property {ContentScope} scope
 * @property {string} title
 * @property {string} section
 * @property {Record<string,string|boolean>} fields
 * @property {ContentState} state
 * @property {string} updated
 */

export {};
