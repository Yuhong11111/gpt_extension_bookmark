import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom' 
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

function App() {
  return (
    
      <Router>
          <GlobalStyles />
          <ScrollToTop />
          <Navbar />
          <Switch>
            <Route path='/' exact component={Home} />
            <Route path='/services' component={Services} />
            <Route path='/products' component={Products} />
            <Route path='/sign-up' component={SignUp} />
            <Route path='/log-in' component={LogIn} />
            <Route path='/verify-email' component={VerifyEmail} />
            <Route path='/dashboard' component={Dashboard} />
          </Switch>
          <Footer />
      </Router>
        
    
  );
}

export default App;
