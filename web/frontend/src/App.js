import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import GlobalStyles from './globalStyles'
import { Navbar, Footer } from './components';
import Home from './pages/HomePage/Home';
import Services from './pages/Services/Services';
import Products from './pages/Products/Products';
import SignUp from './pages/Auth/SignUp';
import ScrollToTop from './components/ScrollToTop';
import LogIn from './pages/Auth/LogIn';
import VerifyEmail from './pages/Auth/VerifyEmail';
import Dashboard from './pages/Dashboard/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <GlobalStyles />
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/services' element={<Services />} />
        <Route path='/products' element={<Products />} />
        <Route path='/sign-up' element={<SignUp />} />
        <Route path='/log-in' element={<LogIn />} />
        <Route path='/verify-email' element={<VerifyEmail />} />
        <Route
          path='/dashboard'
          element={(
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
