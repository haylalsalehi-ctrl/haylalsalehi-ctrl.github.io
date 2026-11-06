# Archived: "Ask me about Yemen" consultation panel

Removed from the live pages on 2026-11-06. To restore it, paste each block back into its page
just before `<script src="/site.js"></script>` (and the JSON-LD snippet back into the Person entry, if present).
The styles (`.ask-*` in style.css) and behavior (the "Ask me about Yemen panel" block in site.js) stay in place;
site.js does nothing when the panel is missing.

## English page (index.html)

```html
<!-- Ask me about Yemen -->
<button class="ask-fab" id="ask-fab" aria-expanded="false" aria-controls="ask-panel" hidden>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
  Ask me about Yemen
</button>
<div class="ask-panel" id="ask-panel" role="dialog" aria-labelledby="ask-title" hidden>
  <button class="ask-close" id="ask-close" aria-label="Close">×</button>
  <h2 id="ask-title">Ask me about Yemen</h2>
  <p>One-on-one consultations on Yemen and the wider MENA region: the conflict and the Houthi movement, the humanitarian situation, and the politics and policy shaping both. Suited to NGOs, policy teams, businesses, and researchers who need a clear, evidence-based briefing.</p>
  <a class="ask-book" id="ask-book" href="https://cal.com/hayl-al-salehi-tbyrlt/yemen-mena-consultation" target="_blank" rel="noopener">Book a time &amp; pay with PayPal →</a>
  <div class="ask-note">Choose a time, then pay securely with PayPal at booking. Consultations in English or Arabic. By booking, you agree to the <a href="/legal/#terms">consultation terms</a>.</div>
  <div class="ask-media">Journalist or media request? <a href="/legal/#contact" data-mail data-subject="Media%20request%3A%20Yemen">Email me</a>.</div>
</div>
```

### JSON-LD offer (English page (index.html))

```json
      "makesOffer": {
        "@type": "Offer",
        "itemOffered": { "@type": "Service", "name": "Yemen and MENA consultation", "description": "One-on-one consultations on Yemen and the wider Middle East and North Africa." },
        "priceSpecification": { "@type": "UnitPriceSpecification", "price": 100, "priceCurrency": "USD", "unitCode": "HUR" }
      },
```

## Arabic page (ar/index.html)

```html
<!-- Ask me about Yemen -->
<button class="ask-fab" id="ask-fab" aria-expanded="false" aria-controls="ask-panel" hidden>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
  اسألني عن اليمن
</button>
<div class="ask-panel" id="ask-panel" role="dialog" aria-labelledby="ask-title" hidden>
  <button class="ask-close" id="ask-close" aria-label="إغلاق">×</button>
  <h2 id="ask-title">اسألني عن اليمن</h2>
  <p>جلسات استشارية فردية حول اليمن ومنطقة الشرق الأوسط وشمال أفريقيا، تتناول النزاع وجماعة الحوثيين والوضع الإنساني والسياسات المؤثرة فيهما. وهي موجّهة إلى المنظمات غير الحكومية وفرق السياسات والشركات والباحثين ممن يحتاجون إلى إحاطة واضحة قائمة على الأدلة.</p>
  <a class="ask-book" id="ask-book" href="https://cal.com/hayl-al-salehi-tbyrlt/yemen-mena-consultation" target="_blank" rel="noopener">احجز موعدًا وادفع عبر PayPal ←</a>
  <div class="ask-note">اختر الموعد، ثم ادفع بأمان عبر PayPal عند الحجز. تُعقد الاستشارات بالعربية أو الإنجليزية. بإتمام الحجز، فإنك توافق على <a href="/ar/legal/#terms">شروط الاستشارة</a>.</div>
  <div class="ask-media">صحفي أو جهة إعلامية؟ <a href="/ar/legal/#contact" data-mail data-subject="%D8%B7%D9%84%D8%A8%20%D8%A5%D8%B9%D9%84%D8%A7%D9%85%D9%8A%3A%20%D8%A7%D9%84%D9%8A%D9%85%D9%86">راسلني</a>.</div>
</div>
```

### JSON-LD offer (Arabic page (ar/index.html))

```json
      "makesOffer": {
        "@type": "Offer",
        "itemOffered": { "@type": "Service", "name": "استشارات في الشأن اليمني وقضايا الشرق الأوسط وشمال أفريقيا", "description": "جلسات استشارية فردية حول اليمن ومنطقة الشرق الأوسط وشمال أفريقيا." },
        "priceSpecification": { "@type": "UnitPriceSpecification", "price": 100, "priceCurrency": "USD", "unitCode": "HUR" }
      },
```
