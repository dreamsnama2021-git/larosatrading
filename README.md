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
The form sends enquiries through Web3Forms (https://web3forms.com), the same setup as the Uday Multiprint site.
Create a free access key at web3forms.com for **info@larosatrading.com** and paste it into
`assets/form-config.js` (`web3formsAccessKey`). Until a key is set, the form opens the
visitor's email app instead, so no enquiry is lost.

## Preview locally
```
npx serve .
```
