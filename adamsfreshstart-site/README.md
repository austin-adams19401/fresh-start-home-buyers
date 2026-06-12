# Fresh Start Home Buyers — adamsfreshstart.com

Static marketing site for Fresh Start Home Buyers (Adams Real Estate Holdings, LLC). One-page seller lead-capture site hosted on Netlify with Netlify DNS, email on Google Workspace.

## Structure

```
.
├── index.html        # the landing page (all CSS inline, no build step)
├── thank-you.html    # post-form-submit confirmation page
├── netlify.toml      # publish dir, headers, www → apex redirect
├── README.md
└── .gitignore
```

No framework, no build, no dependencies. It's plain HTML/CSS so it deploys instantly and is trivial to edit.

## Local preview

Just open `index.html` in a browser. Or serve it:

```
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Deploy (Netlify, Git)

1. Push this folder to a Git repo (GitHub/GitLab/Bitbucket).
2. In Netlify: Add new site → Import from Git → pick the repo.
3. Build command: leave empty. Publish directory: `.`
4. Every push to the main branch auto-deploys.

Full domain + email walkthrough is in `../SETUP-website-and-email.md`.

## The lead form

Uses Netlify Forms (form name `seller-lead`). Netlify detects it from the static HTML at deploy time, no backend. After deploy, add an email notification in Netlify → Forms → Settings so leads reach austin@adamsfreshstart.com.

## Editing

The copy is a starting draft. Edit the hero, the situation cards, and the "how it works" steps in `index.html` to match how you actually talk to sellers. Brand colors are CSS variables at the top of the `<style>` block:

- green `#20473B`, gold `#C68A3E`, cream `#F6F1E7`

## Key details

- Domain: adamsfreshstart.com
- Email: austin@adamsfreshstart.com
- Phone: (385) 244-0881 (Google Voice)
- Service area: Davis & Weber Counties, Utah
