// Codes Print9 uses most, with GST rates.
// basis:
//   "notified"  = rate read from the official notification text (source given)
//   "standard"  = item is NOT in the notified 5% list, so the standard 18% applies;
//                 or a widely reported rate not yet read from the notification. Confirm with your CA.
// Checked on 11 Oct 2026 against: Notification 9/2025-Central Tax (Rate) dated 17.09.2025
// (in force from 22.09.2025), amendments 19/2025 (31.12.2025) and 01/2026 (30.04.2026) — neither
// amendment touches these items — and Notification 15/2025-Central Tax (Rate) amending 11/2017.

const N9_I = "Notification 9/2025-CT(Rate), Schedule I (5%)";
const N9_II = "Notification 9/2025-CT(Rate), Schedule II (18%)";
const N15 = "Notification 15/2025-CT(Rate) amending 11/2017, Sl. 26, heading 9988";
const STD = "Not in the notified 5% list — standard 18%. Confirm with your CA.";

export const PRINT9_CODES = [
  // ---------- Printed matter & paper ----------
  { group: "Printed matter & paper", code: "4901", kw: "brochure leaflet pamphlet flyer handbill booklet", item: "Brochures, leaflets and similar printed matter", rate: 5, basis: "notified", src: N9_I + ", S.No. 324", note: "Printed books under 4901 are exempt (nil)." },
  { group: "Printed matter & paper", code: "4911", kw: "visiting card business card poster catalogue photo print flyer standee certificate menu card tag", item: "Other printed matter — posters, catalogues, visiting cards, printed photos, flyers not under 4901", rate: 18, basis: "standard", src: STD },
  { group: "Printed matter & paper", code: "4910", kw: "calendar desk calendar wall calendar", item: "Calendars of any kind, printed", rate: 18, basis: "standard", src: STD },
  { group: "Printed matter & paper", code: "4909", kw: "greeting card invitation wedding card postcard", item: "Greeting cards and printed postcards", rate: 18, basis: "standard", src: STD },
  { group: "Printed matter & paper", code: "4821", kw: "sticker label vinyl sticker product label barcode", item: "Paper labels and stickers, printed or not", rate: 18, basis: "standard", src: STD },
  { group: "Printed matter & paper", code: "4817", kw: "envelope cover", item: "Envelopes, letter cards, plain postcards", rate: 18, basis: "standard", src: STD },
  { group: "Printed matter & paper", code: "481730", kw: "stationery kit gift box writing set", item: "Boxes, pouches, wallets and writing compendiums of paper, with assorted paper stationery", rate: 5, basis: "notified", src: N9_I + ", S.No. 321" },
  { group: "Printed matter & paper", code: "4819", kw: "box carton packaging mono carton gift box", item: "Cartons, boxes and cases of corrugated or non-corrugated paper/paperboard (4819 10, 4819 20)", rate: 5, basis: "notified", src: N9_I + ", S.No. 322" },
  { group: "Printed matter & paper", code: "4820", kw: "diary notebook register bill book letter pad letterhead pad receipt book", item: "Registers, account books, letter pads, diaries, bill books", rate: 18, basis: "standard", src: STD, note: "Exercise books and notebooks are reported exempt (nil) from 22.09.2025 — confirm with your CA." },
  { group: "Printed matter & paper", code: "4802", kw: "paper maplitho bond copier paper a4 paper", item: "Uncoated paper for printing/writing (maplitho, bond)", rate: 18, basis: "standard", src: STD },
  { group: "Printed matter & paper", code: "4810", kw: "art paper art card coated paper gloss matt board", item: "Coated paper and board (art paper, art card)", rate: 18, basis: "standard", src: STD },
  { group: "Printed matter & paper", code: "48", alt: "39, 48", kw: "paper bag carry bag shopping bag", item: "Paper sacks/bags and bio-degradable bags", rate: 5, basis: "notified", src: N9_I + ", S.No. 319 (headings 39, 48)" },
  // ---------- Consumables ----------
  { group: "Consumables", code: "3215", kw: "ink sublimation ink toner printing ink", item: "Printing ink, sublimation ink, writing/drawing ink", rate: 18, basis: "notified", src: N9_II + ", S.No. 57" },
  { group: "Consumables", code: "3920", kw: "lamination laminating film pouch film gloss lamination matt lamination", item: "Plastic film/sheet, non-cellular — lamination film", rate: 18, basis: "notified", src: N9_II + ", S.No. 121" },
  { group: "Consumables", code: "3921", kw: "sheet plastic sheet pvc sheet", item: "Other plastic plates, sheets, film", rate: 18, basis: "notified", src: N9_II + ", S.No. 122" },
  // ---------- Gifting ----------
  { group: "Gifting", code: "6912", kw: "mug coffee mug ceramic mug sublimation mug cup plate", item: "Ceramic mugs and tableware (other than porcelain or china)", rate: 5, basis: "notified", src: N9_I + ", S.No. 404" },
  { group: "Gifting", code: "7323", kw: "steel bottle water bottle tumbler steel mug flask", item: "Household articles and utensils of iron & steel", rate: 5, basis: "notified", src: N9_I + ", S.No. 416" },
  { group: "Gifting", code: "6109", kw: "t-shirt tshirt tee polo apparel uniform", item: "T-shirts and other knitted apparel (Ch. 61), sale value up to ₹2,500 per piece", rate: 5, basis: "notified", src: N9_I + ", S.No. 388", note: "Above ₹2,500 per piece: 18%." },
  { group: "Gifting", code: "62", kw: "shirt jacket apron apparel uniform", item: "Non-knitted apparel (Ch. 62), sale value up to ₹2,500 per piece", rate: 5, basis: "notified", src: N9_I + ", S.No. 389", note: "Above ₹2,500 per piece: 18%." },
  { group: "Gifting", code: "6505", kw: "cap hat", item: "Caps and hats, knitted or of textile fabric", rate: 5, basis: "notified", src: N9_I + ", S.No. 394" },
  { group: "Gifting", code: "6601", kw: "umbrella", item: "Umbrellas", rate: 5, basis: "notified", src: N9_I + ", S.No. 395" },
  { group: "Gifting", code: "8306", kw: "trophy memento metal frame statue award", item: "Statuettes, ornaments and photo frames of base metal", rate: 5, basis: "notified", src: N9_I + ", S.No. 420" },
  { group: "Gifting", code: "4414", kw: "photo frame wooden frame", item: "Wooden frames for photographs, paintings, mirrors", rate: 18, basis: "notified", src: N9_II + ", S.No. 161" },
  { group: "Gifting", code: "4202", kw: "bag backpack laptop bag tote wallet pouch", item: "Bags, cases, wallets (general)", rate: 18, basis: "notified", src: N9_II + ", S.No. 145", note: "Cotton or jute hand/shopping bags (4202 22 20, 4202 22 30): 5% — Schedule I, S.No. 289–290." },
  { group: "Gifting", code: "3926", kw: "keychain badge id holder plastic", item: "Other articles of plastic — plastic keychains, badges, holders", rate: 18, basis: "notified", src: N9_II + ", S.No. 127" },
  // ---------- Services ----------
  { group: "Services", code: "9988", kw: "job work printing", item: "Printing job work on the customer's own paper — books, journals, and Ch. 48/49 goods taxed at 5% or nil", rate: 5, basis: "notified", src: N15 },
  { group: "Services", code: "9988", alt: "9988 (other)", kw: "job work", item: "Other printing job work on the customer's materials", rate: 18, basis: "standard", src: "Standard rate for job work not specifically listed. Confirm with your CA." },
  { group: "Services", code: "998912", kw: "printing service digital printing offset printing", item: "Printing services using Print9's paper and the customer's content (brochures, cards, pamphlets)", rate: 18, basis: "standard", src: "Widely reported rate after 22.09.2025; not read from the notification here. Confirm with your CA.", note: "Printing of books, newspapers and journals with the printer's paper is reported at 5%." },
  { group: "Services", code: "998391", kw: "design graphic design logo design", item: "Specialty design services, incl. graphic design", rate: 18, basis: "standard", src: "Standard rate for services. Confirm with your CA." },
  { group: "Services", code: "998361", kw: "advertising", item: "Advertising services", rate: 18, basis: "standard", src: "Standard rate for services. Confirm with your CA." },
];

export const GOODS_OR_SERVICE_NOTE =
  "Goods or service? Per CBIC Circular No. 11/11/2017-GST, when the customer gives the content and Print9 uses its own paper, " +
  "printing of brochures, pamphlets, books, annual reports and similar items is a supply of printing SERVICE (SAC 9989); " +
  "printed envelopes, letter cards, printed boxes, napkins and similar items are a supply of GOODS (Chapter 48/49).";
