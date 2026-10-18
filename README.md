## Deal Tracker
## Description
> Deal Tracker is an application that makes it easy for sales executives to track deals through the sales life cycle.
## Table of Contents
* [About This Version](#about-this-version)
* [Installation](#installation)
* [Usage](#usage)
* [Team](#team)
* [Questions](#questions)

## About This Version
> Deal Tracker started as a June 2020 team project. This version brings it up to date while keeping the original look: Express 5, Sequelize 6 and MySQL on the back end, email and password accounts with bcrypt and database-backed sessions, per-user data access, a Content-Security-Policy, and an automated API test suite.

## Installation
#### Please follow this command to install npm dependencies:
> npm i

Copy `.env.example` to `.env`, set `SESSION_SECRET` (`openssl rand -hex 32`) and set `LOCAL_URL` to a MySQL database (requires Node 22+).

Create a dedicated database user instead of using `root`:

```sql
CREATE DATABASE deal_tracker CHARACTER SET utf8mb4;
CREATE USER 'deal_tracker'@'localhost' IDENTIFIED BY 'a-strong-password';
GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,ALTER,INDEX,DROP,REFERENCES ON deal_tracker.* TO 'deal_tracker'@'localhost';
```

Tables are created on startup. After changing a model, back up (`mysqldump -u deal_tracker -p deal_tracker > backup.sql`), then start once with `DB_SYNC_ALTER=true` to apply the change to existing tables. Adding a unique or NOT NULL constraint fails if existing rows violate it, so clean those first.

`npm test` runs the API tests against `TEST_DATABASE_URL` (its name must end in `_test`; the tests wipe it).

`npm start` runs the server; `npm run dev` restarts it on file changes.

## Usage
> Enables the user to: sign up with an email and password, then create, track, update and delete their own deals. Passwords are bcrypt-hashed, sessions are httpOnly cookies, and every deal query is scoped to the logged-in user.

![Deal Tracker Demo](./public/assets/img/Deal-Tracker-Demo.gif)

## Team
Amanda Cerjak: [acerjak](https://github.com/acerjak "GitHub Profile")

Ian Kirby: [vertjames](https://github.com/vertjames "GitHub Profile")

Logan Morris: [Logan96M](https://github.com/Logan96M "GitHub Profile")

Jordan Muliaman: [jmuliaman97](https://github.com/jmuliaman97 "GitHub Profile")

## Questions
> Please let us know if you have any questions!

***
#### Created June 2020
