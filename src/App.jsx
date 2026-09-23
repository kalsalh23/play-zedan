import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Categories from './pages/Categories.jsx'
import Category from './pages/Category.jsx'
import Product from './pages/Product.jsx'
import Pay from './pages/Pay.jsx'
import Track from './pages/Track.jsx'
import AdminLogin from './pages/admin/AdminLogin.jsx'
import Admin from './pages/admin/Admin.jsx'

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
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<Admin />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/c/:topId" element={<Category />} />
          <Route path="/p/:productId" element={<Product />} />
          <Route path="/pay/:code" element={<Pay />} />
          <Route path="/track" element={<Track />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </>
  )
}
