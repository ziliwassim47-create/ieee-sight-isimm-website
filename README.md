# IEEE SIGHT ISIMM Website

Welcome to the official website of IEEE SIGHT ISIMM (Special Interest Group in Humanitarian Technology) - a chapter of the IEEE ISIMM Student Branch in Tunisia.

## About This Website

This website serves as the digital home for SIGHT ISIMM, showcasing our commitment to using technology to improve the lives of underserved communities worldwide.

### What You'll Find Here

**Home Page**
- Our mission and vision for humanitarian technology
- Overview of our impact in the community
- Latest events and activities

**About Us**
- Detailed information about SIGHT and our humanitarian technology focus
- How SIGHT creates impact through sustainable projects
- Our approach to addressing global challenges
- Technology focus areas: renewable energy, healthcare, education, and clean water

**Leadership Team**
- Meet our dedicated committee members
- Chairman's message
- Contact information for each team member

**Events**
- Showcases our workshops, conferences, and community projects
- Photo galleries and event descriptions
- Information about upcoming activities
- Upcoming/previous event sections with registration links for upcoming events

**Projects**
- Dynamic showcase of SIGHT ISIMM projects
- Filtering by status, type, and search
- Project proposal links per project card

**News**
- Dynamic newsroom for announcements, opportunities, and updates
- Optional deadline-based labels (`Open` / `Closed`) when relevant
- Quick filter for open opportunities

**Awards**
- Highlights of awards and recognitions
- Year, description, and optional image support

**Sustainable Development Goals (SDGs)**
- Interactive showcase of the 17 UN SDGs
- How each goal relates to humanitarian technology
- Specific targets and technology impact areas
- Beautiful, color-coded presentation of each goal

**Admin Panel**
- Secure content management system for events, projects, news, awards, and team data
- Upload and manage optional images for events, projects, news, awards, and excom members
- Manage project proposals and deadline-based news items
- For authorized committee members only

## Our Mission

SIGHT ISIMM is dedicated to applying technology to humanitarian challenges, focusing on projects that benefit underserved populations in Tunisia and beyond. We work on sustainable solutions in areas such as:

- Renewable energy and clean technology
- Healthcare access and medical technology
- Educational technology and digital literacy
- Clean water and sanitation solutions
- Sustainable communities and infrastructure

## Technology & Design

This website is built with modern web technologies to provide a fast, responsive, and accessible experience on all devices - from mobile phones to desktop computers.

## Local setup

1. Copy `.env.example` to `.env.local` and fill in the values.
2. Run `npm install`.
3. Run `npm run dev` and open `http://localhost:3000`.

Required server variables are `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and a long random `AUTH_SECRET`. `NEXT_PUBLIC_SITE_URL` controls canonical URLs and sitemap generation.

Initialize the V2 database indexes, then import the public content:

```bash
npm run db:setup
npm run seed
```

`GET /api/health` reports whether MongoDB is connected without exposing credentials or the connection string.

## Integrated V2 backend

The backend remains inside the Next.js application under `app/api`; no separate Express server is required. The V2 member and impact workflow uses the MongoDB collections `members`, `event_registrations`, `attendance`, `project_members`, `volunteer_hours`, `certificates`, `member_notifications`, `activity_logs`, `applications`, plus the existing public-content collections.

Core connected routes include member login/session/profile/dashboard, event registration and attendance, project assignments, certificate issuance and public verification, member notifications and activities, member administration, and global Admin statistics. Public account creation is disabled: only an authenticated administrator can create a member account.

Admin authentication uses a signed, eight-hour, HttpOnly, same-site cookie. Content-management write routes and subscriber exports require that session. Keep all listed secrets out of client code and source control.

## Initial content and MongoDB seed

The V2 editorial dataset lives in `data/sight-isimm-v2.json`. Public APIs use it as a read-only fallback when MongoDB is unavailable or its public collections are empty, so the website never renders as an empty shell.

After configuring `MONGODB_URI`, persist the same content with:

```bash
npm run seed
```

The seed uses stable keys and MongoDB upserts. Running it again updates the mandate, ExCom, events, projects, awards and news instead of duplicating them. Replace provisional dates, placeholder media and general descriptions in the dataset or admin interface when official information becomes available.

## V2 foundation

The current V2 foundation uses the SIGHT ISIMM red identity (`#B91C1C`, hover `#991B1B`, soft background `#FEF2F2`), persistent system-aware light/dark mode, responsive accessible navigation, an impact-focused homepage, public detail URLs, the Impact/Partners/Join/Contact pages, metadata, sitemap, robots rules, a custom 404, and protected admin write APIs. The larger personal member platform (profiles, registrations, attendance, volunteer hours, certificates and notifications) should be introduced as a separate database migration so existing public content remains stable.

## Get Involved

Interested in humanitarian technology? The website provides information on how to:
- Join our team
- Participate in our events
- Collaborate on projects
- Support our mission

## Contact Us

- **Email**: contact@sight-isimm.org
- **Facebook**: [IEEESIGHTISIMMSA](https://www.facebook.com/IEEESIGHTISIMMSA)
- **LinkedIn**: [ieee_sight_isimm_sag](https://www.linkedin.com/company/ieee_sight_isimm_sag)

---

**IEEE SIGHT ISIMM** - Making a difference through humanitarian technology
