## Deal Tracker
## Description
> Deal Tracker is an application that makes it easy for sales executives to track deals through the sales life cycle.
## Table of Contents
* [Installation](#installation)
* [Usage](#usage)
* [License](#license)
* [Team](#team)
* [Questions](#questions)

## Installation
#### Please follow this command to install npm dependencies:
> npm i

Copy `.env.example` to `.env` and set `LOCAL_URL` to a MySQL database (requires Node 18+).

Create a dedicated database user instead of using `root`:

```sql
CREATE DATABASE deal_tracker CHARACTER SET utf8mb4;
CREATE USER 'deal_tracker'@'localhost' IDENTIFIED BY 'a-strong-password';
GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,ALTER,INDEX,DROP,REFERENCES ON deal_tracker.* TO 'deal_tracker'@'localhost';
```

Tables are created on startup. After changing a model, back up (`mysqldump -u deal_tracker -p deal_tracker > backup.sql`), then start once with `DB_SYNC_ALTER=true` to apply the change to existing tables. Adding a unique or NOT NULL constraint fails if existing rows violate it, so clean those first.

`npm start` runs the server; `npm run dev` restarts it on file changes.

## Deployed Link
> https://deal-tracker-app.herokuapp.com/deals.html

## Usage
> Enables the user to: create, track, update and delete deals.

![Deal Tracker Demo](./public/assets/img/Deal-Tracker-Demo.gif)

## Team
Amanda Cerjak: [acerjak](https://api.github.com/users/acerjak "GitHub Profile")

Ian Kirby: [vertjames](https://github.com/vertjames "GitHub Profile")

Logan Morris: [Logan96M](https://github.com/Logan96M "GitHub Profile")

Jordan Muliaman: [jmuliaman97](https://github.com/jmuliaman97 "GitHub Profile")

## License
<img src='https://img.shields.io/badge/License-MIT-blue' alt='License Badge'>

## Questions
> Please let us know if you have any questions!

***
#### Created June 2020
