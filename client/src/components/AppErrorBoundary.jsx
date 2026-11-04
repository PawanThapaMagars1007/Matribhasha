import { Component } from 'react';

export class AppErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { if (import.meta.env.DEV) console.error('Page rendering failed:', error?.name); }
  render() {
    if (this.state.failed) return <main className="app-error-screen" role="alert"><h1>This page could not open</h1><p>Your work has not been submitted. Reload the page and try again.</p><button className="button button-dark" onClick={() => window.location.reload()}>Reload page</button></main>;
    return this.props.children;
  }
}
