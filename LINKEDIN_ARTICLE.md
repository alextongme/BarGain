# How I Used Claude Code to Revamp a Legacy Full-Stack App in One Session

I recently took a 2016-era Node.js project — BarGain, a geolocation-based marketplace — and rebuilt it into a modern, production-grade app using Claude Code as my pair programmer. Here's how I approached it, what decisions I made, and what I learned about using AI-assisted development effectively at a staff-level workflow.

## The Starting Point

BarGain was one of my earliest full-stack projects. Express 4, EJS server-side templates, MongoDB 2.x with per-request connections, Google Maps with a hardcoded API key, session auth, Node 6.6.0. It worked, but it was a product of its time — hardcoded secrets, no input sanitization, single-letter variable names, and a UI that hadn't aged well.

I wanted to turn it into something I'd be proud to have in my portfolio today, while keeping it a working app — not just a static mockup.

## My Approach: Architect First, Generate Second

The most important thing I've learned about working with AI coding tools is that your value as an engineer isn't in typing code faster. It's in making the right decisions about *what* to build and *why*. Claude Code is extraordinarily capable at implementation, but it needs an architect in the driver's seat.

Before writing a single line, I had Claude read the entire codebase — every route, model, view, and stylesheet. Then I laid out the constraints:

- **It needs to actually work.** Not a demo, not a mockup. Real auth, real database, real CRUD.
- **Minimize external service dependencies.** I already run Render + Postgres for another project (Noteworthy). I wanted to reuse providers where it made sense.
- **Show technical range.** I deliberately kept MongoDB instead of switching to Postgres — my portfolio already demonstrates Postgres with Rails. Showing both is more valuable than consolidating.

That last point is worth emphasizing. Claude initially suggested switching to Postgres for consistency. I pushed back because the architectural decision wasn't about what's easiest to implement — it was about what serves my portfolio narrative. This is the kind of judgment call that AI won't make for you.

## Key Architecture Decisions

### Vanilla JS SPA Over React

For an app with 10 pages and straightforward interactions, React adds complexity without proportional benefit. I went with a vanilla JS single-page app: hash-based routing, `fetch()` for API calls, string templates for rendering. No build step, no bundler, no framework overhead.

The result is ~20KB of total JavaScript that does everything React would do for this scope. It also signals something to other engineers reviewing my work: I understand *when* to reach for a framework and when to keep it simple.

### Leaflet Over Google Maps

The original app had a Google Maps API key hardcoded directly in the EJS templates. Rather than just moving it to an env var, I replaced Google Maps entirely with Leaflet + OpenStreetMap. Free, no API key, and CARTO's dark tiles happen to look stunning against the dark UI theme.

This wasn't just a security fix — it was a dependency elimination. One fewer external service to manage, one fewer API key to rotate, zero usage limits to worry about.

### Express Serving Both API and Static Files

Instead of splitting into separate frontend and backend services, Express serves the static SPA files and the JSON API on the same process. For a portfolio project on Render's free tier, this means one service instead of two, simpler deployment, and no CORS configuration.

The tradeoff is obvious — you wouldn't do this at scale. But engineering is about matching your architecture to your constraints, not cargo-culting patterns from systems 1000x your size.

## The Revamp in Practice

Here's what changed in concrete terms:

**Before:** Express + EJS templates, MongoDB 2.x with per-request connections, Google Maps (hardcoded key), server-side Google Geolocation API, Node 6.6.0, deployed on Heroku.

**After:** Express JSON API + vanilla JS SPA, MongoDB 6.x via Atlas (connection pooling), Leaflet + OpenStreetMap (no API key), browser-native geolocation, Node 18+, deployed on Render with auto-deploy on push.

**Security fixes:** Removed hardcoded session secret, eliminated exposed API key from source, fixed RegExp injection in search, stripped password fields from all API responses, added ownership verification on listing mutations.

**Design:** Art deco dark theme with Playfair Display typography, geometric corner brackets on cards, CARTO dark map tiles, film grain texture overlay. The original gold-on-navy palette had art deco DNA — the redesign just committed to it fully.

The entire revamp — reading the codebase, planning architecture, implementing frontend and backend, configuring deployment, setting up MongoDB Atlas, enabling GitHub secret scanning — happened in a single session.

## What I Learned About AI-Assisted Development

**Claude Code is a force multiplier, not a replacement for engineering judgment.** It wrote the implementation, but I made the decisions: which database to use, whether to add a framework, how to structure the API, what the deployment topology should look like. Every time Claude suggested something, I evaluated it against my actual constraints — not just "what's technically correct" but "what serves my goals."

**The best prompt is a clear architecture.** I didn't ask Claude to "make this better." I told it exactly what I wanted: a vanilla JS SPA with hash routing, an Express JSON API, Leaflet for maps, MongoDB Atlas for persistence, Render for deployment. The more specific your direction, the better the output.

**AI excels at the tedious parts.** Converting 12 EJS templates into SPA page functions, writing CSS for 10 different page layouts, creating a complete REST API with proper error handling — this is where the time savings are enormous. I'd estimate this work would have taken me 2-3 days manually. With Claude Code, it was a few hours of directing and reviewing.

**You still need to review everything.** Claude generated clean, well-structured code, but I caught a few things: the MongoDB connection string needed URL-encoding for special characters in the password, the search endpoint needed regex escaping, listing mutations needed ownership checks. Trust but verify.

## The Result

BarGain is now live at bargain.onrender.com — a fully functional marketplace with user auth, geolocation, interactive maps, search, favorites, and CRUD operations. The codebase went from 40+ files of legacy Express/EJS to a clean 8-file architecture. There's a demo login button so anyone can try it without signing up.

More importantly, it now represents the kind of work I'd want to ship: secure defaults, intentional architecture decisions, clean separation of concerns, and a design system that actually has a point of view.

If you're thinking about using AI coding tools in your workflow, my advice is simple: invest your time in the decisions that matter, and let the tool handle the implementation velocity. That's not a new idea — it's just good engineering, accelerated.

---

*The full architecture documentation, including API endpoints, design system tokens, and technical tradeoffs, is available in the [REVAMP.md](https://github.com/alextongme/BarGain/blob/master/REVAMP.md) in the repo.*
