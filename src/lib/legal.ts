import { OFFERS, formatUsd } from "@/lib/plans";
import { SUPPORT_EMAIL } from "@/lib/utils";

// Legal copy, in one place. Keep it in plain English and in step with what the product does:
// if a feature starts collecting new data or a price changes, update these and LEGAL_UPDATED.

export const LEGAL_UPDATED = "10 October 2026";

// Refunds for Full access: inside this window and under this much use, no questions asked.
export const REFUND_DAYS = 14;
export const REFUND_MAX_ANSWERED = 200;

const ACCESS = formatUsd(OFFERS.access.amountUsd);
const WRITER = formatUsd(OFFERS.writer.amountUsd);
const MAIL = `[${SUPPORT_EMAIL}](mailto:${SUPPORT_EMAIL})`;

export const COMPANY = "Argonaut QBanks";
export const COMPANY_ADDRESS = "Oakwood Lane, Kensington, London, United Kingdom";

export const TERMS = `
These terms are the agreement between you and ${COMPANY}, of ${COMPANY_ADDRESS} ("Argonaut", "we", "us"), which runs Argonaut USMLE, for using argonautusmle.com, the question bank, ARGO analytics, the Library, the Daily Challenge and everything else we offer (together, "the service"). By creating an account or using the service, you agree to them. If you don't agree, please don't use the service.

## 1. Who can use Argonaut

You must be at least 18, or the age of majority where you live, to create an account. You're responsible for keeping your login details safe and for everything that happens under your account. One account is for one person: don't share it, sell it or let anyone else use it.

## 2. What you get

**Free.** A free account includes the Daily Challenge and leaderboard, sample questions with full explanations, free Library chapters and basic stats.

**Full access (${ACCESS}, paid once).** Unlocks every question, the full Library and all of ARGO for as long as Argonaut operates the service. It does not renew and there is no expiry date. "Lifetime access" means the lifetime of the service, not of any one feature: we keep improving the product and may add, change or retire individual features, but we won't take away the question bank and analytics you paid for while the service runs. If we ever shut the service down for good, we'll give at least 60 days' notice by email.

**ARGO question writing (${WRITER} a month, optional).** An add-on for Full access accounts that writes new questions aimed at your weak spots. It renews monthly until you cancel. You can cancel at any time in Plan and billing; it keeps working until the end of the month you've paid for, and isn't charged again.

Prices are in US dollars and include any taxes we're required to collect unless shown otherwise. Payments are processed by Stripe. We may change prices for new purchases, but never retroactively for something you've already paid for. Refunds are covered by our [refund policy](/refunds).

## 3. Our content and how you can use it

The questions, explanations, Library chapters, Nuggets, analytics and software are owned by Argonaut or our licensors and protected by copyright. We give you a personal, non-transferable, non-commercial licence to use them for your own exam preparation while your account is in good standing.

You may not:

- copy, screenshot in bulk, record, scrape, download, publish, sell or share questions, explanations or other content, including in study groups, forums, social media or other question banks;
- use bots, scripts or automated tools to access the service or extract content;
- use the content to train or build another product, including AI models;
- reverse engineer the service, get around access controls, or interfere with how it runs;
- use the service for anything unlawful, or harass other users through leaderboards, usernames or any other feature.

Notes, highlights and flashcards you create are yours. You let us store and process them so we can show them back to you.

## 4. Educational use only: not medical advice

Argonaut is a study tool for the USMLE. Content is written and reviewed with care, but medicine changes and mistakes happen. Nothing on Argonaut is medical advice, and it must never be used to diagnose or treat a real patient. If you think something is wrong in a question or explanation, report it from the question and we'll look at it.

We can't promise any particular exam result. Your score depends on many things outside our control.

## 5. Not affiliated with the USMLE

Argonaut is independent. We are not affiliated with, endorsed by or sponsored by the Federation of State Medical Boards (FSMB), the National Board of Medical Examiners (NBME) or the USMLE program. USMLE® is a registered trademark of the FSMB and NBME. Our questions are original practice material, not real exam questions.

## 6. Suspension and closing your account

You can delete your account at any time in Settings. We may suspend or close an account that breaks these terms, for example by sharing the account or copying content. If we close an account for a serious breach, we don't owe a refund. In other cases we'll tell you why and, where it's fair, refund any unused add-on period.

## 7. The service "as is"

We work hard to keep Argonaut accurate and available, but we provide it "as is" and "as available". To the fullest extent the law allows, we don't give warranties of any kind, express or implied, including that the service will be uninterrupted, error-free or fit for a particular purpose.

## 8. Limits on our liability

To the fullest extent the law allows, Argonaut won't be liable for indirect, incidental, special or consequential losses, or for lost profits, data or opportunities, arising from your use of the service. Our total liability for any claim relating to the service is limited to the amount you paid us in the 12 months before the claim. Nothing in these terms limits liability that can't legally be limited, or the rights you have as a consumer under the law where you live.

## 9. Governing law

These terms are governed by the laws of England and Wales, and the courts of England and Wales have jurisdiction over any dispute. If you live elsewhere as a consumer, you keep the protection of the mandatory laws of your country and can also bring a claim in your local courts.

## 10. Changes to these terms

We may update these terms as the service changes. If a change matters, we'll tell you by email or in the app before it takes effect. If you keep using Argonaut after that, the new terms apply. If you don't agree, you can stop using the service and delete your account.

## 11. Contact

Questions about these terms? Email ${MAIL}, or write to ${COMPANY}, ${COMPANY_ADDRESS}.
`;

export const PRIVACY = `
This policy explains what personal data ${COMPANY} ("Argonaut", "we", "us"), which runs Argonaut USMLE, collects, why, and what you can do about it. Short version: we collect what we need to run a question bank that adapts to you, we don't sell your data, and we don't use advertising trackers.

## Who we are

${COMPANY}, ${COMPANY_ADDRESS}, is the data controller for personal data processed through Argonaut USMLE. You can reach us at ${MAIL}.

## What we collect

**Account details.** Your name, email address and password (stored only as a secure hash by our authentication provider). If you sign in with Google, we receive your name, email address and profile picture from Google.

**Profile.** Your username, country, target exam, exam date and medical school, if you choose to give them.

**Study data.** What you answer and how: the choice you pick, changes of mind, time taken, confidence, struck-out options, highlights, marked questions, notes, flashcards, test history and Daily Challenge results. This is what ARGO uses to find your weak spots.

**Payments.** Payments are handled by Stripe. We never see or store your full card number. We keep a record of what you bought, when, the amount, and your Stripe customer ID.

**Messages.** What you send us when you email support or report a problem with a question.

**Technical data.** Our hosting and database providers log basic request data (IP address, browser type, pages requested, timestamps) to keep the service secure and working.

## How we use it

- To run your account and give you the service you signed up for.
- To power ARGO: analysing your answers to estimate your strengths and weaknesses and choose what you practise next.
- To show anonymous, aggregated peer statistics (for example, "62% answered correctly").
- To show your display name, username, country, score and streak on the Daily Challenge leaderboard. Use a username you're happy to be public.
- To take payments and keep the records the law requires.
- To send emails you need, such as sign-in links, password resets and receipts. We don't send marketing email without your consent.
- To keep the service secure, prevent abuse (such as account sharing or content scraping) and fix problems.

We rely on these legal bases where they apply: performing our contract with you, our legitimate interest in running and improving a secure service, your consent where we ask for it, and legal obligations such as tax records.

## AI features

Some optional features use Anthropic's Claude to generate content, such as flashcards and ARGO-written questions. To do that we send the relevant question content and, for question writing, a summary of the topics you find hardest. We don't send your name or email address. Anthropic processes this data on our behalf and doesn't use it to train its models.

## Who we share it with

We don't sell or rent your personal data. We share it only with service providers that help us run Argonaut, under contracts that limit what they can do with it:

- **Supabase**: database, authentication and email delivery.
- **Vercel**: website hosting.
- **Stripe**: payment processing.
- **Google**: sign-in, if you choose "Continue with Google".
- **Anthropic**: AI features, as described above.

We may also disclose data if the law requires it, to protect people's safety or our rights, or as part of a merger or sale of the business, in which case this policy continues to apply.

Our providers store and process data in the United States. Where data moves across borders, we rely on the safeguards the law provides, such as standard contractual clauses.

## Cookies and local storage

We use only the cookies needed to keep you signed in. We store a few preferences on your device, such as your light or dark theme and, if you play the Daily Challenge without an account, a random guest token so your result can move to your account when you sign up. We don't use advertising or cross-site tracking cookies.

## How long we keep it

We keep your data while your account is open. When you delete your account, your profile, study data, notes and flashcards are deleted. Anonymous, aggregated statistics (such as how many people answered a question correctly) stay, because they can't identify you. Records of your payments stay with Stripe, our payment processor, for as long as tax and accounting laws require, usually up to seven years.

## Your rights

Depending on where you live (including under the GDPR, UK GDPR and California law), you can ask to access, correct, export or delete your personal data, object to or restrict how we use it, and withdraw consent you've given. You can edit your profile and delete your account yourself in Settings. For anything else, email ${MAIL} and we'll respond within 30 days. If you're unhappy with our answer, you can complain to the UK Information Commissioner's Office ([ico.org.uk](https://ico.org.uk)) or the data protection authority where you live.

## Security

Data is encrypted in transit, access is restricted by row-level security so each account can only read its own data, and staff access is limited to what's needed to run the service. No system is perfectly secure, but we take it seriously and will tell you if a breach affects you.

## Children

Argonaut is for medical students and graduates. It isn't meant for anyone under 18, and we don't knowingly collect data from children.

## Changes

If we change this policy in a way that matters, we'll tell you by email or in the app before it takes effect.

## Contact

Questions or requests about your data: ${MAIL}, or write to ${COMPANY}, ${COMPANY_ADDRESS}.
`;

export const REFUNDS = `
We want you to pay for Argonaut because it works for you, not because you're stuck with it.

## Full access (${ACCESS}, one payment)

If Argonaut isn't right for you, email ${MAIL} within **${REFUND_DAYS} days** of your purchase and we'll refund the full ${ACCESS}, as long as you've answered fewer than **${REFUND_MAX_ANSWERED} questions** since buying. No forms and no guilt trip. Refunds go back to the original payment method, and your account returns to the free plan.

After ${REFUND_DAYS} days, or once you've answered ${REFUND_MAX_ANSWERED} questions or more, Full access isn't refundable, because by then you've had real use of the bank. If something went wrong on our side, such as a technical fault that stopped you using what you paid for, tell us and we'll put it right, including with a refund where that's fair.

## ARGO question writing (${WRITER} a month)

Cancel any time in Plan and billing. Cancelling stops the next renewal; the add-on keeps working until the end of the month you've already paid for. We don't refund part-months. If you were charged for a renewal you didn't mean to keep, email us within 7 days of the charge and haven't used the add-on since, and we'll refund it.

## Charged twice or by mistake?

Email ${MAIL} with the email address on your account and roughly when you paid. Duplicate or mistaken charges are always refunded in full.

## How long refunds take

We process refunds within 5 business days. Your bank or card provider may take another 5 to 10 business days to show it.

## Your legal rights

This policy doesn't take away any rights you have under consumer law where you live. If you're in the EU or UK, you have a 14-day right to withdraw from digital purchases; when you buy Full access, you agree to get access straight away and acknowledge that this right ends once you've started using the content. Our ${REFUND_DAYS}-day refund above still applies on its terms.
`;
