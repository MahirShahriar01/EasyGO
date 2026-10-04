/**
 * EasyGo SPA entry point.
 * Customer site and admin panel share one bundle entry; admin pages are
 * code-split (React.lazy) so customers never download them.
 */
import '../scss/app.scss';
import '@mdi/font/css/materialdesignicons.min.css';
import 'react-toastify/dist/ReactToastify.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/common/ErrorBoundary';
import { store } from './store';

createRoot(document.getElementById('app')).render(
    <StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <ErrorBoundary>
                    <App />
                </ErrorBoundary>
            </BrowserRouter>
        </Provider>
    </StrictMode>,
);
