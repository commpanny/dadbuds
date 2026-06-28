# DadBuds Sticker Landing Design Spec

## Goal

Convert QR sticker traffic at `dadbuds.lol` with the least possible friction.

The landing page should answer three questions above the fold:

- What is this?
- Is it for me?
- What is the smallest action I can take?

## Page Structure

### `/`

Purpose: redirect sticker QR traffic to `/join/`.

Rules:

- Netlify redirects `/` to `/join/`.
- The fallback HTML also redirects to `/join/` and preserves query parameters.

### `/join/`

Purpose: larger intake for motivated visitors.

Header:

- no eyebrow
- DadBuds logo
- primary line: `Join Spokane beta`
- secondary line: `Or request DadBuds in your ZIP code.`
- no supporting paragraph

Fields:

- email
- ZIP code
- sign up for Spokane beta checkbox, checked by default
- bring DadBuds to my ZIP code checkbox, checked by default
- referral code, defaulted to `BOYSOFSUMMER` unless the QR/query ref provides another value
- DadBuds marketing consent, optional and unchecked by default
- optional cross-Commpanny consent, unchecked by default

Rules:

- Keep the form short enough to fit above the fold on normal phone and desktop views.

### `/success/`

Purpose: confirm completion after full signup.

### `/privacy/` and `/terms/`

Purpose: minimum public trust and consent support for a small beta.

## Copy Rules

- Use short, direct language.
- Avoid founder essays.
- Avoid explaining the whole operating model.
- Use "Spokane beta" as the primary frame.
- Treat non-Spokane users as useful market signal, not a secondary audience.

## Visual Direction

- Warm paper background.
- DadBuds logo as a friendly object, not a giant hero essay.
- Rounded controls are acceptable for form fields and city chips.
- Buttons are plain, high-contrast, and action-labeled.
- City chips are interest sparks, not navigation tabs.

## Form Behavior

Full intake:

- `dadbuds-spokane-beta`
- Netlify Forms compatible
- UTM/ref parameters are persisted into hidden fields
- Referral defaults to `BOYSOFSUMMER` unless `?ref=` or `?referral_code=` supplies a different value

## Tonight Deploy Notes

Upload `dadbuds-tonight.zip` to Netlify Drop, add `dadbuds.lol` as the primary domain, and update Namecheap DNS.
