const featureCards = [
  {
    title: "Introduce The Extension",
    description: "Use this site as a simple landing page to explain what the extension does and why it is useful."
  },
  {
    title: "Prepare Account Pages",
    description: "Keep the frontend ready for future login, profile, billing, and sync management flows."
  },
  {
    title: "Connect To Spring APIs",
    description: "When account features are ready, this app can call Spring Boot APIs for authentication and data sync."
  }
];

function App() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">React Frontend</p>
        <h1>ChatGPT Bookmark Web</h1>
        <p className="lead">
          A standalone web app for introducing the extension now and expanding into account management later.
        </p>

        <div className="actions">
          <a className="button button-primary" href="#features">
            View Structure
          </a>
          <a className="button button-secondary" href="http://localhost:8080/api/health">
            Backend API
          </a>
        </div>
      </section>

      <section id="features" className="grid">
        {featureCards.map((card) => (
          <article className="card" key={card.title}>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;
