# Health Navigator Hub

Site Tech

Authentication: Supabase Auth (Profile/User logins + Admin logins, role-based)

Supabase connectivity for all user data, health data, saved content, nutrition index, and program/topic content

Auth pages required: Sign Up, Login, Password Reset, Email Verification (confirmation screen + redirect)

Design System

Background: black

Text: white

Generous whitespace / good section spacing throughout

All hover interactions convert to tap interactions on mobile/touch devices

Site Navigation (main menu)

Home

Topics

Nutrition Index

Programs

About

Page 1 — Home

Section 1: Cover

Human body silhouette image (attached) — left side of page

Headline: "Personalized Nutrition for All"

Section 2: Programs

Human body silhouette (attached — different image from Section 1)

Thin line connects silhouette to each program name

Desktop: hover on a program line triggers a small text box (1–2 sentence overview of the program)

Mobile: tap replaces hover for the same overview box

Clicking/tapping a program navigates to that program's own dedicated page

Program-to-anatomy connections:

Disease Compass → heart

Weight Loss → fat tissue

Strength Development → muscle

Programs list:

Disease Compass

Weight Loss

Strength Development

Section 3: Trending Topics

Displayed in numerical order matching input order (manually set, not popularity-driven)

Topics are clickable, each currently routes to a blank placeholder page (editable later)

Save/bookmark button mechanic on topic pages: to be coded later (not in initial build)

Topics list:

BPS Profiles

Supplements Dos/Donts

Superfoods

Toxicology Report

Page 2 — About

Blank for now, content editable later

Include in main site menu

Page 3 — Nutrition Index

Blank for now, content editable later

Must be wired to Supabase (not static content) — data-driven from launch

Include in main site menu

Page 4 — Topics

Blank for now, content editable later

Include in main site menu

Page 5 — Programs

Blank for now, content editable later

Include in main site menu

Each program (Disease Compass, Weight Loss, Strength Development) uses a shared page template with these sections:

Overview

Who It's For

Plan Breakdown

Call to Action (CTA)

Page 6 — Privacy Policy

Standalone page (own dedicated page, not combined with Disclaimer)

Not in main nav — linked from footer

Content TBD

Page 7 — Disclaimer

Standalone page (own dedicated page, not combined with Privacy Policy)

Not in main nav — linked from footer

Content TBD

User Hub (Profile/Client Access)

Accessible after login. Includes:

Account Settings

Edit email

Edit phone number

Edit username

Health Data Page

Displays general lab values and metrics: Age, Gender, Body Fat %, SMM (Skeletal Muscle Mass), and all general lab values

Read-only for the client — clients cannot edit their own health data

Only Admin can edit health data entries

Saved Readings Page

Stores articles/topics the client has bookmarked

Save/bookmark mechanic to be built in a later phase

Admin Access

View all user data across all accounts

Edit any user's data, including health data (clients cannot self-edit)

Full management capability over profiles, programs, topics, and page content

All admin edits to user data are logged in an audit trail (who changed what, when, previous value)

Audit trail is displayed as a per-user history view within each user's admin record (not a global log)

Subscribe for Updates (site-wide section)

No login required

Simple email input field + submit button

Stores submitted emails in Supabase for a mailing list

Placement: footer, present on every page site-wide

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/330e9ab0-55c2-4999-af41-85db6658df28).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
