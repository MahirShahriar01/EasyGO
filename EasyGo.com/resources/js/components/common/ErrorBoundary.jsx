import { Component } from 'react';

/** Catches render errors so one broken widget never blanks the whole app. */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('UI error', error, info);
    }

    render() {
        if (this.state.error) {
            return this.props.fallback ?? (
                <div className="container py-5 text-center">
                    <i className="mdi mdi-alert-octagon-outline display-4 text-danger" />
                    <h4 className="mt-3">Something went wrong</h4>
                    <p className="text-soft">Please refresh the page. If the problem continues, contact support.</p>
                    <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload</button>
                </div>
            );
        }
        return this.props.children;
    }
}
