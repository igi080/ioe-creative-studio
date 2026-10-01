import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { initAnalytics, captureUtmParameters, trackEvent } from './lib/analytics';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Portfolio from './pages/Portfolio';
import Showreel from './pages/Showreel';
import Contact from './pages/Contact';
import Testimonials from './pages/Testimonials';
import CaseStudies from './pages/CaseStudies';
import Skills from './pages/Skills';
import Pricing from './pages/Pricing';
import Payment from './pages/Payment';
import PaymentCallback from './pages/PaymentCallback';
import ThankYou from './pages/ThankYou';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ClientAgreement from './pages/ClientAgreement';
import DynamicLegalPolicy from './pages/DynamicLegalPolicy';
import RequestQuote from './pages/RequestQuote';
import PortfolioDetail from './pages/PortfolioDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function RouteAndAnalyticsTracker() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    captureUtmParameters();
    trackEvent('page_view', { page: pathname });
  }, [pathname, search]);

  return null;
}

export default function App() {
  return (
    <Router>
      <RouteAndAnalyticsTracker />
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Public Routes rendered within Layout */}
        <Route element={<Layout><Outlet /></Layout>}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:slug" element={<PortfolioDetail />} />
          <Route path="/case-studies" element={<CaseStudies />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/showreel" element={<Showreel />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment/callback" element={<PaymentCallback />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/agreement" element={<ClientAgreement />} />
          <Route path="/service-agreement" element={<ClientAgreement />} />
          <Route path="/client-agreement" element={<ClientAgreement />} />
          <Route path="/legal/:slug" element={<DynamicLegalPolicy />} />
          <Route path="/policy/:slug" element={<DynamicLegalPolicy />} />
          <Route path="/request-quote" element={<RequestQuote />} />
          <Route path="/quote" element={<RequestQuote />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </Router>
  );
}
