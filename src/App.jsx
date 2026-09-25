import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Categories from './pages/Categories.jsx'
import Category from './pages/Category.jsx'
import Department from './pages/Department.jsx'
import Product from './pages/Product.jsx'
import Pay from './pages/Pay.jsx'
import Track from './pages/Track.jsx'
import AdminLogin from './pages/admin/AdminLogin.jsx'
import Admin from './pages/admin/Admin.jsx'

// private panel path — never linked from the storefront
export const PANEL_PATH = '/panel-z7k4a9x2'

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { fontFamily: 'Cairo, Tahoma, sans-serif', borderRadius: '16px', background: '#33203A', color: '#fff', fontWeight: 600 },
        }}
      />
      <Routes>
        <Route path={PANEL_PATH} element={<AdminLogin />} />
        <Route path={PANEL_PATH + '/dashboard'} element={<Admin />} />
        <Route path="/admin" element={<Navigate to="/" replace />} />
        <Route path="/admin/dashboard" element={<Navigate to="/" replace />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/c/:topId" element={<Category />} />
          <Route path="/d/:depId" element={<Department />} />
          <Route path="/p/:productId" element={<Product />} />
          <Route path="/pay/:code" element={<Pay />} />
          <Route path="/track" element={<Track />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </>
  )
}
