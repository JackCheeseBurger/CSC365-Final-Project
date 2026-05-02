# Lichess Tournament Manager

A full-stack React SPA web application for organizing and running chess tournaments using Lichess player data.
Supports **Single Elimination**, **Double Elimination**, and **Swiss** formats with live bracket
visualisation, seeding, and shareable tournament links.

> **CSC 365 Final Project**  built with React 19, Express 4, and the Lichess public API.
> **By Maddax Klingensmith and Jack Lawson**

## Contents

1. [Prerequisites](#prerequisites)
2. [Installation & Setup](#installation--setup)
3. [Running the App](#running-the-app)
4. [Project Structure](#project-structure)
5. [Tournament Formats](#tournament-formats)
6. [Third-Party Libraries](#third-party-libraries)

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

No external database or API key is required. Player data is retrieved from the
[Lichess public API] (https://lichess.org/api) 

## Installation & Setup

```bash
# 1. Clone or unzip the project
cd CSC365-Final-Project

# 2. Install dependencies
npm install --legacy-peer-deps
```

No environment variables are needed. The backend writes data to `db.json`, which will be created on the first run.

## Running the App

```bash
# Start both the Express backend (port 3001) and the Vite dev server concurrently with
npm run start
```

> **Note:** `db.json` is deleted on server shutdown in the current implementation, 
> as the server uses a cleanup hook for easier testing and demonstration.
> Remove the cleanup hook if you want your backend data to persist after the server closes.

## File Structure
```
.
server/
  index.cjs # Express entry point, middleware & route mounting
  db.cjs # JSON database
  middleware/
    auth.cjs # Auth token middleware
  routes/
    auth.cjs # Register / sign-in routes
    roster.cjs # Roster CRUD routes
    tournaments.cjs # Tournament CRUD & bracket routes
  helpers/
    bracket.cjs # Pairing & round utilities
    doubleElim.cjs # Double elimination state machine
    swiss.cjs # Swiss round pairing
db.json # Flat JSON database file
package.json
index.html # Vite HTML entry point
src/
  main.jsx # React entry point
  App.jsx # Router & layout
  index.css # Global chess theme & design tokens
  api/
    client.js # Base fetch wrapper & token helper
    index.js # Exported api object
  context/
    AuthContext.jsx # Auth state
  components/
    Nav.jsx # Top navigation bar
    PrivateRoute.jsx # Auth-gated route wrapper
    ServerCheck.jsx # Server connectivity 
  pages/
    Login.jsx # Register / sign-in
    Home.jsx # Dashboard
    Players.jsx # Roster management and Lichess search
    Tournaments.jsx # Tournament list and creation
    Tournament.jsx # Tournament detail and bracket
    About.jsx # About page & documentation
    NotFound.jsx # 404 route
```

## Tournament Formats

### Single Elimination

- Players are eliminated after one loss.
- Byes are given to the highest seed when needed.
- The bracket advances when all matches in a round are complete.

### Double Elimination

- Players are eliminated after two losses.
- There is a **Winners Bracket** and a **Losers Bracket**.
- When a player loses in the Winners Bracket, they are moved to the corresponding
  round of the Losers Bracket
- The winner of each bracket meets in a **Grand Final**.

### Swiss

- Players are not eliminated; players win by score.
- Number of rounds is configurable.
- Each round, players are paired with opponents who have a similar score, without rematches.
- A standings table tracks points across rounds.

## Third-Party Libraries

[React](https://react.dev) | 19 | MIT | UI Framework |
[React Router](https://reactrouter.com) | 7 | MIT | Client-Side Routing |
[React Bootstrap](https://react-bootstrap.netlify.app) | 2 | MIT | UI Library |
[Bootstrap](https://getbootstrap.com) | 5 | MIT | Style Base |
[Vite](https://vitejs.dev) | 8 | MIT | Build Tool |
[Express](https://expressjs.com) | 4 | MIT | Backend Framework |
[bcrypt](https://github.com/kelektiv/node.bcrypt.js) | 5 | MIT | Password Hashing |
[concurrently](https://github.com/open-cli-tools/concurrently) | 9 | MIT | Run Backend and Frontend Together |
[react-brackets](https://github.com/mohux/react-brackets) | latest | MIT | Bracket Visualisation |
[Lichess API](https://lichess.org/api) | — | AGPL-3 (server) | Player Data Source |

Player data is fetched from the Lichess public API. This project is **not affiliated
with Lichess.org**. Use of the Lichess API is subject to their Terms of Service.
