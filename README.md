# Lichess Tournament Manager

A full-stack React SPA web application for organizing and running chess tournaments using Lichess player data.
Supports **Single Elimination**, **Double Elimination**, and **Swiss** formats with live bracket
visualisation, drag-and-drop seeding, and shareable tournament links.

> **CSC 365 Final Project** — built with React 19, Express 4, and the Lichess public API.
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
npm install prop-types --legacy-peer-deps  
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
> You can kill the app with ctrl+c in the console.

## File Structure
```
.
server.cjs  # Express Backend
db.json # Flat JSON Database
package.json
index.html  # Vite HTML entry point
src/
  main.jsx  # React entry point
  App.jsx # Router & authentication
  api.js  # File for API calls
  index.css # Global chess theme & design tokens
    context/
      AuthContext.jsx # Auth State
    components/
      nav.jsx # Top Navigation Bar Component
    pages/
      Login.jsx # Register / sign-in
      home.jsx # Dashboard
      Players.jsx # Roster management and Lichess search
      tournaments.jsx # Tournament list and creation
      tournament.jsx  # Tournament detail and bracket
      about.jsx # About page & documentation
      NotFound.jsx  # 404 Route
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
