# Stripe Subscriptions Setup Guide

## ✅ Vad som är implementerat (Production-Ready)

All kod är skriven och redo för deployment. Systemet är **100% låst bakom PRO-subscription**.

### 🔐 Security & PRO-Gating

#### Server-Side Protection (CRITICAL)
- ✅ `requireProUser()` helper - Kräver aktiv PRO subscription
- ✅ `getProUserOrNull()` - API route version
- ✅ **Alla server actions är skyddade:**
  - `getExamsByUserId()` - Kräver PRO
  - `createExam()` - Kräver PRO
  - `deleteExam()` - Kräver PRO
  - `regenerateSchedule()` - Kräver PRO
  - `getUserSettings()` - Kräver PRO
  - `updateUserSettings()` - Kräver PRO

#### API Routes Protection
- ✅ `/api/schedule` - Kräver PRO (AI schedule generation)
- ✅ `/api/webhooks/stripe` - Hanterar subscription events

#### Page Protection
- ✅ `/dashboard` - Auto-redirect till `/upgrade` om ej PRO
- ✅ `/dashboard/settings` - Auto-redirect till `/upgrade` om ej PRO

### 💳 Stripe Infrastructure

#### Database Schema
```prisma
model User {
  stripeCustomerId        String?   @unique    // Stripe customer ID
  stripeSubscriptionId    String?   @unique    // Active subscription ID
  stripePriceId           String?              // Current price ID
  stripeCurrentPeriodEnd  DateTime?            // Billing period end
  subscriptionStatus      String?              // active | past_due | canceled etc.
  plan                    UserPlan @default(FREE) // FREE | PRO (computed)
}
```

#### Webhook Events (Fully Implemented)
- ✅ `checkout.session.completed` - User completed payment
- ✅ `customer.subscription.created` - New subscription
- ✅ `customer.subscription.updated` - Status change
- ✅ `customer.subscription.deleted` - Cancellation

#### Server Actions
- ✅ `createCheckoutSession()` - Skapar Stripe checkout
- ✅ `createPortalSession()` - Customer portal för subscription management

### 🎨 User Interface
- ✅ `/upgrade` page - Paywall med feature list och pricing
- ✅ `UpgradeCard` component - Stripe checkout integration
- ✅ Dashboard auto-redirect för non-PRO users

---

## 🔧 Vad DU måste göra manuellt

### 1️⃣ Kör Database Migration

```bash
cd c:\Users\maxny\Desktop\solaireai
npx prisma migrate dev
```

Detta lägger till `subscriptionStatus` fältet i User-tabellen.

---

### 2️⃣ Stripe Dashboard Setup

#### A. Skapa Product & Price

1. Gå till [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Klicka **"+ Add product"**
3. Fyll i:
   - **Name:** SolaireAI PRO
   - **Description:** AI-powered study schedule management
   - **Pricing model:** Standard pricing
   - **Price:** $9.99 USD
   - **Billing period:** Monthly
   - **Payment type:** Recurring
4. Klicka **"Save product"**
5. **KOPIERA `price_id`** (börjar med `price_...`)

#### B. Konfigurera Webhook

1. Gå till [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Klicka **"+ Add endpoint"**
3. **Endpoint URL:**
   ```
   https://your-domain.com/api/webhooks/stripe
   ```
   (Ersätt `your-domain.com` med din faktiska domain)

4. **Events to send:**
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`

5. Klicka **"Add endpoint"**
6. **KOPIERA `Signing secret`** (börjar med `whsec_...`)

---

### 3️⃣ Environment Variables

Uppdatera `.env` (eller `.env.local`) med dessa värden:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_... # (Redan finns)
STRIPE_WEBHOOK_SECRET=whsec_... # KOM FRÅN STEG 2B
STRIPE_PRICE_ID=price_... # KOM FRÅN STEG 2A

# Public keys (för frontend om behövs i framtiden)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... # (Redan finns)

# App URL (för redirects)
NEXT_PUBLIC_APP_URL=https://your-domain.com # UPPDATERA MED DIN DOMAIN
```

**KRITISKT:**
- `STRIPE_WEBHOOK_SECRET` måste vara exakt samma som i Stripe Dashboard
- `STRIPE_PRICE_ID` måste vara ID:t från produkten du skapade
- `NEXT_PUBLIC_APP_URL` används för success/cancel redirects

---

### 4️⃣ Testa Subscription Flow

#### Lokal Testning med Stripe CLI (Rekommenderat)

1. Installera Stripe CLI:
   ```bash
   # Windows (via Scoop)
   scoop install stripe

   # Eller ladda ner från https://stripe.com/docs/stripe-cli
   ```

2. Login till Stripe:
   ```bash
   stripe login
   ```

3. Forwarda webhooks till localhost:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Detta ger dig en webhook secret för testning (börjar med `whsec_...`)

4. Uppdatera `.env.local` med test secret:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_... # från stripe listen
   STRIPE_PRICE_ID=price_... # ditt test price ID
   ```

5. Starta dev server:
   ```bash
   npm run dev
   ```

6. Testa checkout flow:
   - Gå till `/upgrade`
   - Klicka "Upgrade to PRO"
   - Använd test card: `4242 4242 4242 4242`
   - Datum: Valfritt framtida datum
   - CVC: Valfritt 3-siffror

#### Production Testing

Efter deployment:
1. Sätt rätt `NEXT_PUBLIC_APP_URL` i produktion
2. Uppdatera webhook URL i Stripe Dashboard
3. Testa med riktig betalning (liten summa först!)

---

## 📊 Subscription Status Flow

### User Journey

```
1. User signs up (FREE)
   ↓
2. Tries to access /dashboard
   ↓
3. Redirected to /upgrade
   ↓
4. Clicks "Upgrade to PRO"
   ↓
5. Redirected to Stripe Checkout
   ↓
6. Completes payment
   ↓
7. Stripe sends webhook → subscriptionStatus = "active"
   ↓
8. User redirected to /dashboard (now has access!)
```

### Database Updates (via Webhooks)

**checkout.session.completed:**
```javascript
{
  stripeCustomerId: "cus_...",
  stripeSubscriptionId: "sub_..."
}
```

**customer.subscription.created/updated:**
```javascript
{
  stripeSubscriptionId: "sub_...",
  stripePriceId: "price_...",
  stripeCurrentPeriodEnd: Date,
  subscriptionStatus: "active", // eller "past_due", "canceled", etc.
  plan: "PRO" // om status === "active"
}
```

**customer.subscription.deleted:**
```javascript
{
  stripeSubscriptionId: null,
  stripePriceId: null,
  stripeCurrentPeriodEnd: null,
  subscriptionStatus: "canceled",
  plan: "FREE"
}
```

---

## 🔍 Verifiering

### Checklist Efter Setup

- [ ] Migration kördes utan fel (`npx prisma migrate dev`)
- [ ] Stripe Product skapad och `price_id` kopierad
- [ ] Stripe Webhook konfigurerad med rätt URL och events
- [ ] `.env` uppdaterad med alla värden
- [ ] Webhook secret testad (via Stripe CLI eller test-checkout)
- [ ] Test-checkout genomförd framgångsrikt
- [ ] User ser dashboard efter betalning
- [ ] User redirectas till `/upgrade` om subscription upphör

### Debug Tips

**Problem: "PRO subscription required" efter betalning**
- Kolla webhook logs i Stripe Dashboard
- Verifiera att `STRIPE_WEBHOOK_SECRET` är korrekt
- Kontrollera att alla 4 events är ikryssade

**Problem: Checkout redirectar till fel URL**
- Uppdatera `NEXT_PUBLIC_APP_URL` i `.env`
- Rebuild applikationen: `npm run build`

**Problem: User fortsätter ha "FREE" efter betalning**
- Webhook troligen failar - kolla Stripe Dashboard → Webhooks → Event logs
- Kolla server logs för `[Stripe Webhook]` meddelanden

---

## 🚀 Production Deployment Checklist

- [ ] Sätt `STRIPE_SECRET_KEY` till live key (börjar med `sk_live_`)
- [ ] Sätt `STRIPE_PRICE_ID` till live price ID
- [ ] Uppdatera webhook URL till production domain
- [ ] Sätt `NEXT_PUBLIC_APP_URL` till production domain
- [ ] Test med riktigt kort (liten betalning)
- [ ] Verifiera webhook events kommer igenom
- [ ] Test cancel flow via Customer Portal

---

## 🎯 System Guarantees

✅ **Ingen free access** - Alla endpoints är server-side skyddade
✅ **Webhook idempotency** - Säkert att ta emot samma event flera gånger
✅ **Database is source of truth** - Subscription status alltid synkad från Stripe
✅ **Automatic downgrades** - Vid canceled/failed payment → instant FREE tier
✅ **No client-side bypass** - Alla checks på server

---

## 📞 Support

Om något går fel:
1. Kolla Stripe Dashboard → Webhooks → Event logs
2. Kolla server logs för `[Stripe Webhook]` meddelanden
3. Verifiera `.env` variabler
4. Testa med Stripe CLI först innan production
