import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("🔥 App crashed:", error);
    console.error("🔥 Component stack:", info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: "system-ui" }}>
          <h2>Coś się wywaliło w aplikacji</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <p>Otwórz DevTools → Console i podeślij mi błąd z góry.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
