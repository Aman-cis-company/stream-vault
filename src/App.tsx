import { Routes, Route } from "react-router-dom";
import Landing from "./routes/index";
import Browse from "./routes/browse";
import Library from "./routes/library";
import Pricing from "./routes/pricing";
import Login from "./routes/login";
import Signup from "./routes/signup";
import ForgotPassword from "./routes/forgot-password";
import Dashboard from "./routes/dashboard";
import Profile from "./routes/profile";
import Affiliate from "./routes/affiliate";
import AdminPortal from "./routes/admin";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminMovies from "./pages/admin/AdminMovies";
import AdminPlans from "./pages/admin/AdminPlans";
import Watch from "./routes/watch.$titleId";
import PaymentSuccess from "./routes/payment-success";
import PaymentCancel from "./routes/payment-cancel";
import NotFound from "./pages/NotFound";
import ParentalControls from "./pages/ParentalControls";
import { AgeVerificationModal } from "./components/streaming/AgeVerificationModal";
import SeriesDetail from "./routes/series.$seriesId";
import WatchEpisode from "./routes/watch.series.$seriesId.episode.$episodeId";
import AdminSeries from "./pages/admin/AdminSeries";
import MyList from "./routes/my-list";
import Checkout from "./routes/checkout";
import RecordKeeping from "./routes/record-keeping";
import ResetPasswordPage from "./routes/reset-password";

export default function App() {
  return (
    <>
      <AgeVerificationModal />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/library" element={<Library />} />
        <Route path="/library/:categoryId" element={<Library />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-list" element={<MyList />} />
        <Route path="/settings/parental-controls" element={<ParentalControls />} />
        <Route path="/affiliate" element={<Affiliate />} />
        {/* Admin portal */}
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/movies" element={<AdminMovies />} />
        <Route path="/admin/plans" element={<AdminPlans />} />
        <Route path="/admin/series" element={<AdminSeries />} />
        <Route path="/series/:seriesId" element={<SeriesDetail />} />
        <Route path="/watch/series/:seriesId/episode/:episodeId" element={<WatchEpisode />} />
        <Route path="/watch/:titleId" element={<Watch />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="/record-keeping" element={<RecordKeeping />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
