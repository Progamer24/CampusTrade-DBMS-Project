# CampusTrade — Campus Marketplace

CampusTrade is a student-focused marketplace concept for buying and selling academic materials and other useful items within a campus community.

This repository contains the frontend application, built with **Next.js, React, TypeScript, and CSS**. It includes a marketplace homepage, listing details, login and registration screens, a student dashboard, a selling page, and an admin moderation interface.

> **Frontend preview:** The app currently uses sample data. Authentication, database persistence, listing publication, orders, and moderation actions are not connected to a backend.

## Features

- **Marketplace:** Browse sample listings, search, filter, sort, and save items during the current preview session.
- **Listing details:** View details for the sample listings.
- **Login and registration:** Form layouts and client-side validation for preview purposes only.
- **Student dashboard:** Displays mock profile, listing, request, order, and activity data.
- **Sell an item:** Validates a listing form and can preview a selected image locally. It does not publish or save a listing.
- **Admin dashboard:** Provides mock moderation records and controls that update only the current page preview. It does not provide admin authorization.
- **Responsive UI:** Layouts adapt to mobile, tablet, and desktop screen sizes.
- **Proposed API contract:** Documents possible frontend/backend integration fields and endpoints for review.

## Technology Stack

- Next.js 16
- React
- TypeScript
- CSS
- Node.js and npm

## Prerequisites

Before running the project, ensure the following are installed:

- **Node.js 20.9.0 or newer**
- **npm**, included with Node.js
- **Git**, if you plan to clone the repository
- **Visual Studio Code**, recommended for editing the project

## Getting Started

### 1. Get the Project

Clone the repository:

```bash
git clone https://github.com/Progamer24/CampusTrade-DBMS-Project.git
cd CampusTrade-DBMS-Project
```

Alternatively, download the repository as a ZIP file from GitHub and extract it.

### 2. Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

### 3. Start the Development Server

Run the following command:

```bash
npm run dev
```

Keep the terminal running while using the application.

### 4. Open the Website

Open your browser and visit:

**http://localhost:3000**

To stop the development server, press `Ctrl + C` in the terminal.

## Available Pages

| Route | Description |
|---|---|
| `/` | Main marketplace homepage |
| `/listings/1` | Example listing details page |
| `/login` | Login interface |
| `/register` | Registration interface |
| `/dashboard` | Student dashboard with mock data |
| `/sell` | Create-listing form preview |
| `/admin` | Admin moderation interface with mock data |

The listing-details route accepts a listing ID. The current sample listings use IDs `1` through `6`.

## Project Structure

```text
CampusTrade-DBMS-Project/
├── docs/
│   └── api-contract.md
├── public/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   ├── dashboard/
│   │   ├── listings/
│   │   │   └── [id]/
│   │   ├── login/
│   │   ├── register/
│   │   ├── sell/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   └── lib/
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

### Important Directories

- `src/app/` — Next.js App Router pages and root layout.
- `src/app/globals.css` — Shared styles and responsive layout rules.
- `src/components/` — Reusable UI components.
- `src/lib/` — Shared frontend data and utilities, including sample marketplace data.
- `docs/api-contract.md` — Proposed API fields and endpoints for backend-owner review. It is not an implemented API.
- `public/` — Static assets.

## Preview and Backend Status

The current application is a frontend preview. The following limitations apply:

- **Sample data:** Marketplace listings, dashboard profiles, orders, and moderation records are not live database results.
- **Authentication:** Login and registration forms perform client-side validation only. They do not authenticate users, create accounts, or send or store credentials.
- **Listing publication:** The sell form does not publish or save listings. Selected images are previewed locally and are not uploaded.
- **Admin functionality:** Admin controls do not verify authorization or persist moderation decisions.
- **API integration:** The API contract is a proposal for discussion. Confirm its fields, endpoints, and security requirements with the backend owner before integration.

Do not treat preview content or actions as persisted application data.

## Available Checks

Run these commands from the project root when you want to verify the application.

### Run the Linter

```bash
npm run lint
```

### Check TypeScript

```bash
npx tsc --noEmit
```

### Create a Production Build

```bash
npm run build
```

## Troubleshooting

### `npm` Is Not Recognized

Install Node.js 20.9.0 or newer, restart the terminal, and verify that Node.js and npm are available:

```bash
node -v
npm -v
```

### Port 3000 Is Already in Use

Next.js may offer another available port. Open the URL shown in the terminal, or stop the process using port 3000 before restarting the development server.

### Dependencies or Packages Are Missing

From the project root, run:

```bash
npm install
```

### The Website Does Not Open

- Ensure `npm run dev` is still running.
- Check the terminal for error messages.
- Confirm that the browser URL matches the address displayed in the terminal.

## License

No license has been specified for this repository. Contact the repository maintainers before redistributing or reusing the project outside its intended purpose.
