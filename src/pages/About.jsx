import { Card, Row, Col, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

/*About Data*/
const FEATURES = [
  {
    icon: '♚',
    title: 'Three Tournament Formats',
    desc: 'Run Single Elimination, Double Elimination, or Swiss tournaments',
  },
  {
    icon: '♛',
    title: 'Live Lichess Integration',
    desc: 'Search any Lichess username to pull their real rating and profile data from their Lichess account.',
  },
  {
    icon: '♜',
    title: 'Persistent Roster',
    desc: 'Save players to a roster and add them to any tournament with a single click.',
  },
  {
    icon: '♟',
    title: 'Full result control',
    desc: 'Repeat matches or restart entire brackets while keeping players registered',
  },
  {
    icon: '♝',
    title: 'Public Tournaments',
    desc: 'Every tournament can be viewed and joined by other users. Or share the link for guests to view with no account.',
  },
  {
    icon: '♞',
    title: 'Unique Accounts',
    desc: 'Player rosters and tournaments are tied to their owners only they can modify brackets, report results, or reset matches.',
  },
];

const STACK = [
  { label: 'React 19', color: '#61dafb', text: '#000' },
  { label: 'React Router v7', color: '#f44250', text: '#fff' },
  { label: 'React Bootstrap', color: '#7952b3', text: '#fff' },
  { label: 'Vite 8', color: '#646cff', text: '#fff' },
  { label: 'Node.js / Express',color: '#3c873a', text: '#fff' },
  { label: 'bcrypt', color: '#4b2e1e', text: '#f5e6d3' },
  { label: 'react-brackets', color: '#e07b39', text: '#fff' },
  { label: 'Lichess API', color: '#2e1a12', text: '#f5e6d3' },
];

const USER_GUIDE = [
  { step: '01', title: 'Create an Account', desc: 'Start by registering with a username and password.' },
  { step: '02', title: 'Build Your Roster', desc: 'Search Lichess usernames or manually add competitors to your roster on the Players page.' },
  { step: '03', title: 'Create a Tournament', desc: 'Choose a name, format, optional time control, and date.' },
  { step: '04', title: 'Add Players', desc: 'Click roster chips to add players, or let others join via the shareable link. Drag rows to arrange the seeding order.' },
  { step: '05', title: 'Generate the Bracket', desc: 'Click Generate Bracket. The app will place players based on your chosen seeding order.' },
  { step: '06', title: 'Run the Tournament', desc: 'Report results for each match. The bracket will advance on its own, no matter the format.' },
];

/*Sub Components*/
function Section({ title, children, style }) {
  return (
    <section style={{ marginBottom: 48, ...style }}>
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        color: 'var(--wood-dark)',
        borderBottom: '2px solid var(--cream-border)',
        paddingBottom: 8,
        marginBottom: 24,
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

/*About Page*/
export default function About() {
  return (
    <div className="page">
      {/*Hero*/}
      <div style={{ textAlign: 'center', marginBottom: 48, paddingBottom: 32, borderBottom: '2px solid var(--cream-border)' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>♛</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.4rem', color: 'var(--wood-dark)', marginBottom: 12 }}>
          Lichess Tournament Manager
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--wood-mid)', maxWidth: 620, margin: '0 auto 20px' }}>
          By Maddax Klingensmith, and Jack Lawson.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Badge bg="false" style={{ background: 'var(--wood-mid)', fontSize: '0.82rem', padding: '5px 14px' }}>CSC 365 Final Project</Badge>
          <Badge bg="false" style={{ background: '#5a6a8a', fontSize: '0.82rem', padding: '5px 14px' }}>MIT License</Badge>
        </div>
      </div>
      {/*Features*/}
      <Section title="Features">
        <Row className="g-3">
          {FEATURES.map((f, i) => (
            <Col key={i} xs={12} sm={6} lg={6}>
              <Card className="chess-card h-100">
                <Card.Body className="d-flex gap-3 align-items-start">
                  <span style={{ fontSize: '1.8rem', lineHeight: 1, flexShrink: 0 }}>{f.icon}</span>
                  <div>
                    <h5 style={{ fontFamily: "'Playfair Display', serif", marginBottom: 4, color: 'var(--wood-dark)' }}>
                      {f.title}
                    </h5>
                    <p className="mb-0" style={{ fontFamily: 'inherit', color: 'var(--wood-mid)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                      {f.desc}
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Section>
      {/*User Guide*/}
      <Section title="User Guide">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {USER_GUIDE.map((s, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 20,
                padding: '18px 0',
                borderBottom: i < USER_GUIDE.length - 1 ? '1px solid var(--cream-border)' : 'none',
              }}
            >
              <div style={{
                flexShrink: 0,
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--wood-mid)',
                color: 'var(--cream)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                fontSize: '0.85rem',
              }}>
                {s.step}
              </div>
              <div>
                <h5 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--wood-dark)', marginBottom: 4 }}>
                  {s.title}
                </h5>
                <p style={{ color: 'var(--wood-mid)', fontSize: '0.92rem', margin: 0, lineHeight: 1.55 }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>
      {/*Tournament formats*/}
      <Section title="Tournament Formats">
        <Row className="g-3">
          <Col xs={12} md={4}>
            <Card className="chess-card h-100">
              <Card.Header style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                ⚔️ Single Elimination
              </Card.Header>
              <Card.Body>
                <p style={{ fontFamily: 'inherit', fontSize: '0.9rem', color: 'var(--wood-mid)', lineHeight: 1.55 }}>
                  - Players are eliminated after one loss.
                  - Byes are given to the highest seed when needed.
                  - The bracket advances when all matches in a round are complete.
                </p>
                <p style={{ fontFamily: 'inherit', fontSize: '0.85rem', color: 'var(--wood-light)', margin: 0 }}>
                  <strong>Best for:</strong> Quick events, large fields.
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} md={4}>
            <Card className="chess-card h-100">
              <Card.Header style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                🔁 Double Elimination
              </Card.Header>
              <Card.Body>
                <p style={{ fontFamily: 'inherit', fontSize: '0.9rem', color: 'var(--wood-mid)', lineHeight: 1.55 }}>
                  Players are eliminated after two losses.
                  When a player loses in the Winners Bracket they are moved to the corresponding round of the Losers Bracket. 
                  The winner of each bracket meets in a <strong>Grand Final</strong>.
                </p>
                <p style={{ fontFamily: 'inherit', fontSize: '0.85rem', color: 'var(--wood-light)', margin: 0 }}>
                  <strong>Best for:</strong> Serious, longer, and more exciting events.
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} md={4}>
            <Card className="chess-card h-100">
              <Card.Header style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                ♟ Swiss
              </Card.Header>
              <Card.Body>
                <p style={{ fontFamily: 'inherit', fontSize: '0.9rem', color: 'var(--wood-mid)', lineHeight: 1.55 }}>
                  No eliminations everyone plays in every round. Players are paired against others with similiar score,
                  avoiding rematches. The number of rounds is configurable.
                </p>
                <p style={{ fontFamily: 'inherit', fontSize: '0.85rem', color: 'var(--wood-light)', margin: 0 }}>
                  <strong>Best for:</strong> More fair outcomes, and a round robin feel.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Section>
      {/*Tech stack*/}
      <Section title="Technology Stack">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {STACK.map((t, i) => (
            <span
              key={i}
              style={{
                background: t.color,
                color: t.text,
                borderRadius: 20,
                padding: '5px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              {t.label}
            </span>
          ))}
        </div>
        <Row className="g-3">
          <Col xs={12} md={6}>
            <Card className="chess-card">
              <Card.Header>Frontend</Card.Header>
              <Card.Body style={{ fontFamily: 'inherit', fontSize: '0.9rem', color: 'var(--wood-mid)', lineHeight: 1.7 }}>
                Built with <strong>React 19</strong> and <strong>Vite 8</strong>. Routing handled by <strong>React Router v7</strong>.
                UI components from <strong>React Bootstrap 2</strong>. Bracket visualisation
                by <strong>react-brackets</strong>.
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card className="chess-card">
              <Card.Header>Backend</Card.Header>
              <Card.Body style={{ fontFamily: 'inherit', fontSize: '0.9rem', color: 'var(--wood-mid)', lineHeight: 1.7 }}>
                <strong>Express 4</strong> running on <strong>Node.js</strong>.
                Authentication uses tokens mapped to usernames server side; passwords are
                hashed with <strong>bcrypt</strong> (10 salt rounds). Data is persisted to a flat
                <strong> db.json</strong> file. Player data is fetched
                live from the <strong>Lichess public API</strong>.
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Section>
      {/*License*/}
      <Section title="License">
        <Card className="chess-card">
          <Card.Body>
            <h5 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--wood-dark)', marginBottom: 12 }}>
              MIT License
            </h5>
            <pre style={{
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              color: 'var(--wood-mid)',
              background: 'var(--cream-light)',
              border: '1px solid var(--cream-border)',
              borderRadius: 8,
              padding: '16px 20px',
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}>
{`Copyright (c) 2025 Lichess Tournament Manager Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.`}
            </pre>
            <p style={{ fontSize: '0.85rem', color: 'var(--wood-light)', margin: '12px 0 0' }}>
              This project is not affiliated with{' '}
              <a href="https://lichess.org" target="_blank" rel="noreferrer" style={{ color: 'var(--wood-mid)' }}>
                Lichess.org
              </a>
              . Player data is fetched from the{' '}
              <a href="https://lichess.org/api" target="_blank" rel="noreferrer" style={{ color: 'var(--wood-mid)' }}>
                Lichess public API
              </a>{' '}
              under their{' '}
              <a href="https://lichess.org/terms-of-service" target="_blank" rel="noreferrer" style={{ color: 'var(--wood-mid)' }}>
                terms of service
              </a>
              .
            </p>
          </Card.Body>
        </Card>
      </Section>
      {/*Footer*/}
      <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '2px solid var(--cream-border)' }}>
        <p style={{ color: 'var(--wood-light)', fontSize: '0.88rem', marginBottom: 16 }}>
          Built as a CSC 365 final project · Powered by the Lichess public API
        </p>
        <Link to="/tournaments" className="btn btn-chess" style={{ marginRight: 10 }}>
          View Tournaments
        </Link>
        <Link to="/players" className="btn btn-chess-outline btn">
          Manage Roster
        </Link>
      </div>
    </div>
  );
}

Section.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  style: PropTypes.object,
};