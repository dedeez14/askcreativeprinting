/**
 * Default texts of the three legal pages (Privacy Policy, Terms of Service, User Data Deletion) — the pages Meta
 * requires for the WhatsApp Business Platform app.
 *
 * The ERP serves the admin's version at GET /legal/{key} (Admin → Landing → Settings → Legal pages). These are the
 * SAME defaults as the ERP's resources/landing/legal/*.md, used when the ERP does not serve the endpoint yet or is
 * unreachable. Markdown subset: ## headings, paragraphs, "- " lists, **bold**, [text](url).
 * Tokens {{email}}, {{phone}}, {{address}} are filled from the site settings (fillLegalTokens in lib/legal.ts).
 */

export const DEFAULT_PRIVACY = `This Privacy Policy explains how **ASK Creative Sdn Bhd** ("ASK Creative", "we", "us") collects, uses and protects your personal data when you use our website, request a quotation, place an order, pay online or message us on WhatsApp. We follow the Malaysia Personal Data Protection Act 2010 (PDPA).

## Who we are

ASK Creative Sdn Bhd is a custom printing and sublimation company based in Sabah, Malaysia.

- Address: {{address}}
- Email: [{{email}}](mailto:{{email}})
- Phone: {{phone}}

## What personal data we collect

We only collect what we need to quote, produce, deliver and support your order:

- **Contact details** — your name, company or organisation, phone number, WhatsApp number and email address.
- **Enquiry and order details** — the products, quantities, sizes, names and numbers to print, deadlines, delivery address and any notes you send us.
- **Artwork and files** — logos, designs, photos and other files you upload or send to us for printing.
- **Payment records** — the amount, date, reference and status of your payments. We do not receive or store your card details or your online banking login.
- **Messages** — emails and WhatsApp messages you exchange with us, including attachments.
- **Website usage** — basic technical data such as pages visited, the referring campaign (for example a UTM tag), browser type and approximate location, collected through cookies or similar tools.

## How we use your personal data

- To reply to your enquiries and prepare quotations and design proofs.
- To process, produce and deliver your orders, and to keep you updated on their status.
- To issue invoices and receipts, and to keep accounting and tax records.
- To give you access to your order tracking and customer portal.
- To provide customer support and handle complaints, rework or refunds.
- To improve our website, products and services.
- To send you promotions, but only if you have agreed. You can opt out at any time.

We do not sell your personal data.

## Online payments (CHIP)

Online payments, including FPX online banking and DuitNow, are processed by our payment provider CHIP. You enter your payment details on CHIP's secure pages, not on ours. CHIP handles that payment data under its own privacy policy and security standards. We only receive confirmation of whether the payment succeeded, with its amount and reference.

## WhatsApp messages

We use the WhatsApp Business Platform provided by Meta to talk to customers. If you message us on WhatsApp, or if you give us your number for an order, we may send you messages about your enquiry, quotation, artwork proof, payment and order status.

- We use your WhatsApp number, name and the content of the conversation only to serve you and your order.
- Meta processes these messages on our behalf as a service provider, under the WhatsApp Business terms and Meta's privacy policy.
- You can ask us to stop sending you WhatsApp messages at any time by replying "STOP" or by contacting us.

## Email

We send quotations, proofs, invoices and order updates by email. Our email is hosted by a third-party email provider.

## Cookies and analytics

Our website uses cookies and similar browser storage to keep the site working, to remember the campaign that brought you to us, and to measure how the site is used. If enabled, we use Google Analytics and the Meta Pixel to understand visits and the performance of our advertising. You can block or delete cookies in your browser settings. The site will still work, but some features may be less convenient.

## Who we share your data with

We share personal data only when needed to run our business:

- Payment provider (CHIP) — to process online payments.
- Meta (WhatsApp) — to send and receive WhatsApp messages.
- Courier and delivery partners — your name, phone and delivery address.
- Hosting, email, accounting and IT service providers that store or process data for us.
- Government or regulatory authorities, when the law requires it.

Some of these providers may store data outside Malaysia. When that happens, we take reasonable steps to make sure your data is protected to a standard similar to the PDPA.

## How long we keep your data

- Enquiries that do not become orders: up to 2 years, then deleted or anonymised.
- Orders, invoices, receipts and payment records: at least 7 years, as required by Malaysian company and tax law.
- Artwork files: for as long as needed for repeat orders, unless you ask us to delete them.
- WhatsApp and email conversations: as long as needed for your orders and support.

## How we protect your data

We use access controls, staff accounts with limited rights, encrypted connections (HTTPS) and regular backups to protect your personal data. No system is completely secure, but we work to prevent loss, misuse and unauthorised access.

## Your rights

Under the PDPA, you can:

- Ask for a copy of the personal data we hold about you.
- Ask us to correct personal data that is wrong, incomplete or out of date.
- Withdraw your consent, or ask us to stop using your data for marketing.
- Ask us to delete your personal data — see our [User Data Deletion](/data-deletion) page.

Send your request to [{{email}}](mailto:{{email}}). We will reply within 21 days. We may need to confirm your identity first.

## Children

Our services are meant for adults and businesses. We do not knowingly collect personal data from children under 18 without the consent of a parent or guardian. Orders for schools or clubs should be placed by an adult representative.

## Changes to this policy

We may update this Privacy Policy from time to time. The latest version is always on this page, with the date it was last updated.

## Contact us

If you have questions about this policy or your personal data, contact us:

- Email: [{{email}}](mailto:{{email}})
- Phone: {{phone}}
- Address: {{address}}`;

export const DEFAULT_TERMS = `These Terms of Service apply when you use the ASK Creative website, request a quotation or place an order with **ASK Creative Sdn Bhd** ("ASK Creative", "we", "us"). By placing an order, you agree to these terms.

## Quotations

- Quotations are based on the details you give us: product, quantity, sizes, materials, print method and deadline.
- Prices are in Malaysian Ringgit (RM). A quotation is valid for the period stated on it, or for 14 days if no period is stated.
- If the details change — for example quantity, design, material or deadline — the price and delivery date may change too.

## Orders

- An order is confirmed when you accept the quotation and we receive the required deposit, unless we agree otherwise in writing.
- Please check sizes, names, numbers and quantities carefully before you confirm. We produce exactly what is in the approved order.

## Artwork and intellectual property

- You are responsible for the artwork, logos, names, images and text you send us. You confirm that you own them or have permission to use them.
- We will not print content that is illegal, offensive, or that we believe infringes someone else's trademark or copyright.
- You agree to cover any claims, losses or costs we face because of artwork or content you supplied.
- Designs we create for you remain our work until your order is paid in full. After full payment, you may use them for your own purposes.
- We may show photos of finished products in our portfolio and social media, unless you ask us not to.

## Proofs and approval

- For custom orders, we send you a design proof (mock-up) to approve before production.
- Please check the proof carefully: spelling, names, numbers, sizes, colours and placement. Once you approve it, we print it as approved.
- Colours on screen may look different from the printed product because of screens and materials. Small colour differences are normal and are not a defect.
- Changes requested after approval may cost extra and may delay delivery.

## Deposits and payment

- Most orders need a deposit before production starts. The amount is shown on your quotation or invoice.
- The balance must be paid before collection or delivery, unless we have agreed credit terms with you in writing.
- You can pay by bank transfer or online through our payment provider CHIP (including FPX and DuitNow). Payment links we send you are for your order only.
- We may hold production or delivery until payment is received.

## Production and delivery

- Production time starts after artwork approval and receipt of the deposit.
- Delivery dates are estimates. We do our best to meet them, but we are not responsible for delays caused by late approval, late payment, courier delays or events outside our control.
- You can collect your order from our office, or we can arrange delivery. Delivery costs are charged separately unless stated otherwise.
- Please check your order when you receive it and tell us about any problem within 7 days.

## Cancellations and refunds

- You can cancel before production starts. We may deduct the cost of design work and any materials already bought for your order.
- Once production has started, custom-made items cannot be cancelled or refunded, because they are made only for you.
- If an item has a production defect or does not match the approved proof, tell us within 7 days of receiving it. We will reprint, repair or refund the affected items, at our choice.
- We do not accept returns for mistakes that were in the approved proof or order details, or for normal colour and size variations.
- Approved refunds are paid back to the original payment method or by bank transfer.

## Our liability

- We take care with every order. If something goes wrong, our total liability is limited to the amount you paid for the affected items.
- We are not liable for indirect losses, such as lost profit, lost business or event costs.
- Nothing in these terms removes rights you have under Malaysian consumer law that cannot be excluded.

## Use of our website

- Please give accurate information when you use our forms.
- Do not misuse the website, for example by uploading harmful files or trying to access systems you are not allowed to.
- Prices and product information on the website may change without notice. The quotation we send you is what applies.

## Privacy

We handle your personal data as described in our [Privacy Policy](/privacy-policy).

## Governing law

These terms are governed by the laws of Malaysia. Any dispute will be handled by the courts of Malaysia. We always try to solve problems with you directly first.

## Changes to these terms

We may update these terms from time to time. The version on this page on the date of your order applies to that order.

## Contact us

- Email: [{{email}}](mailto:{{email}})
- Phone: {{phone}}
- Address: {{address}}`;

export const DEFAULT_DATA_DELETION = `You can ask **ASK Creative Sdn Bhd** to delete the personal data we hold about you, including data we received through our website, email, or WhatsApp messages with our business. This page explains how.

## How to request deletion

Send us a request by one of these ways:

- **Email:** [{{email}}](mailto:{{email}}) with the subject "Data deletion request".
- **WhatsApp:** send the message "Delete my data" to the ASK Creative WhatsApp number you chat with us on.
- **Phone:** {{phone}}

Please include:

- Your full name.
- The phone number and/or email address you used with us.
- Your company or order reference, if you have one.

We may ask you to confirm your identity before we delete anything. This protects you from someone else deleting your data.

## What we delete

After we confirm your request, we delete or anonymise:

- Your contact details in our enquiry and customer records.
- Enquiries and quotations that did not become orders.
- Artwork and files you sent us, unless they are part of an order record we must keep.
- Our copies of WhatsApp and email conversations with you, where we are not required to keep them.
- Marketing preferences — you will no longer receive promotional messages.

## What we must keep

Malaysian company and tax law requires us to keep accounting records for at least 7 years. So we keep:

- Invoices, receipts, credit notes and payment records.
- The order details shown on those documents, including the name on the invoice.

We keep these records only for as long as the law requires and do not use them for marketing. When the retention period ends, we delete them.

## How long it takes

We will confirm that we received your request and complete it within 21 days. If we cannot delete some data, we will tell you what we kept and why.

## Messages in your own WhatsApp

Deleting your data from our systems does not delete the messages stored in your own WhatsApp app. You control those messages: you can delete the chat with ASK Creative in WhatsApp at any time. Your WhatsApp account itself is managed by Meta under WhatsApp's terms and privacy policy.

## Questions

For more about how we handle your personal data, read our [Privacy Policy](/privacy-policy) or contact us at [{{email}}](mailto:{{email}}).`;
