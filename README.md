# La Rosa – static website

Static (no WordPress) copy of https://larosatrading.com — same design, sections and animations.

```
index.html            Home
who-we-are/           Who We Are
services/             Services
products/             Products
contact-us/           Contact Us
it-supplies/          IT Supplies
privacy-policy/       Privacy Policy
terms-conditions/     Terms & Conditions
404.html              Page-not-found page
assets/base.css       Shared base styles
assets/img/           All images, optimized to WebP
```

## Deploy
Upload **everything in this folder** (except README.md and .claude) to the site root,
e.g. Hostinger → File Manager → `public_html`. Works on any static host
(Hostinger, Netlify, Vercel, Cloudflare Pages, GitHub Pages). URLs stay the same as the
WordPress site (`/who-we-are/`, `/services/`, …), so existing links and Google results keep working.

## Contact form
The form posts to FormSubmit (`https://formsubmit.co`) and emails **info@larosatrading.com**.
The very first submission sends a one-time activation email to that inbox — click
"Activate" once and all later messages arrive normally. To use another address, change
`ENDPOINT` in `contact-us/index.html`.

## Preview locally
```
npx serve .
```
