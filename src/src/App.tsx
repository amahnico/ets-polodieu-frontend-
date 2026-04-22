import { ChangeEvent, useEffect, useMemo, useState } from 'react'

type Product = {
  id: string
  name: string
  category: string
  price: number
  oldPrice: number
  rating: number
  tag: string
  image?: string
}

type CartItem = Product & { qty: number }
type ViewMode = 'home' | 'cart' | 'checkout' | 'success' | 'admin'
type DatabaseMode = 'browser' | 'online'
type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled'

type Order = {
  _id: string
  customerName: string
  customerPhone: string
  city: string
  address: string
  paymentMethod: string
  mobileMoneyNumber?: string
  subtotal: number
  delivery: number
  total: number
  status: OrderStatus
  items: Array<{
    productId?: string
    name: string
    price: number
    qty: number
    image?: string
  }>
  createdAt?: string
}

type AdminAuth = {
  token: string
  email: string
}

const SHOP_NAME = 'ETS POLODIEU ELECTRONICS'
const SHOP_PHONE = '237651325289'
const SHOP_PHONE_DISPLAY = '+237651325289'
const SHOP_ADDRESS = 'Bonaberi-Ndobo opposite Hôtel le Bien, Douala'
const STORAGE_KEY = 'ets_polodieu_products'
const AUTH_STORAGE_KEY = 'ets_polodieu_admin_auth'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-backend-url.com/api'

const categories = [
  'All',
  'Electronics',
  'Large Appliances',
  'Small Appliances',
  'Home & Office',
]

const initialProducts: Product[] = [
  { id: '1', category: 'Electronics', name: 'Samsung Smart TV', price: 329900, oldPrice: 389900, rating: 4.7, tag: 'Hot' },
  { id: '2', category: 'Electronics', name: 'LG Smart TV', price: 279900, oldPrice: 329900, rating: 4.8, tag: 'Top' },
  { id: '3', category: 'Large Appliances', name: 'Washing Machine', price: 469900, oldPrice: 529900, rating: 4.6, tag: '-11%' },
  { id: '4', category: 'Small Appliances', name: 'Microwave', price: 189900, oldPrice: 229900, rating: 4.5, tag: 'Deal' },
  { id: '5', category: 'Electronics', name: 'Samsung Soundbar', price: 359900, oldPrice: 419900, rating: 4.4, tag: 'Promo' },
  { id: '6', category: 'Electronics', name: 'LG Soundbar', price: 244900, oldPrice: 299900, rating: 4.3, tag: 'New' },
  { id: '7', category: 'Electronics', name: 'SONY Soundbar', price: 349900, oldPrice: 429900, rating: 4.6, tag: 'Best' },
  { id: '8', category: 'Small Appliances', name: 'Gas Cooker', price: 599900, oldPrice: 699900, rating: 4.9, tag: 'Pro' },
  { id: '9', category: 'Small Appliances', name: 'Electric Iron', price: 24900, oldPrice: 29900, rating: 4.2, tag: 'Sale' },
  { id: '10', category: 'Small Appliances', name: 'Water Boiler', price: 28900, oldPrice: 34900, rating: 4.1, tag: 'Hot' },
  { id: '11', category: 'Small Appliances', name: 'Blender', price: 34900, oldPrice: 42900, rating: 4.2, tag: 'Best' },
  { id: '12', category: 'Home & Office', name: 'Fan', price: 44900, oldPrice: 59900, rating: 4.3, tag: 'New' },
  { id: '13', category: 'Large Appliances', name: 'Fridge', price: 549900, oldPrice: 639900, rating: 4.7, tag: 'Top' },
  { id: '14', category: 'Home & Office', name: 'TV Stand', price: 89900, oldPrice: 109900, rating: 4.1, tag: 'Sale' },
  { id: '15', category: 'Home & Office', name: 'Regulator / Stabilizer', price: 79900, oldPrice: 95900, rating: 4.3, tag: 'Safe' },
  { id: '16', category: 'Home & Office', name: 'Office Chair', price: 74900, oldPrice: 89900, rating: 4.4, tag: 'Office' },
  { id: '17', category: 'Home & Office', name: 'Office Table', price: 129900, oldPrice: 149900, rating: 4.2, tag: 'Office' },
  { id: '18', category: 'Home & Office', name: 'Dining Set', price: 299900, oldPrice: 359900, rating: 4.5, tag: 'Home' },
]

const formatCFA = (value: number) => `${value.toLocaleString()} CFA`

async function fetchProductsFromAPI(): Promise<Product[]> {
  const res = await fetch(`${API_BASE_URL}/products`)
  if (!res.ok) throw new Error('Failed to fetch products')
  const data = await res.json()
  return data.map((item: any, index: number) => ({
    id: String(item._id || item.id || index + 1),
    name: item.name,
    category: item.category,
    price: Number(item.price || 0),
    oldPrice: Number(item.oldPrice || 0),
    rating: Number(item.rating || 0),
    tag: item.tag || 'New',
    image: item.image || '',
  }))
}

async function loginAdmin(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Login failed')
  return res.json()
}

async function createProductInAPI(product: Product, token: string) {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(product),
  })
  if (!res.ok) throw new Error('Create product failed')
  return res.json()
}

async function updateProductInAPI(id: string, product: Product, token: string) {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(product),
  })
  if (!res.ok) throw new Error('Update product failed')
  return res.json()
}

async function deleteProductInAPI(id: string, token: string) {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Delete product failed')
  return res.json()
}

async function uploadImageToAPI(imageBase64: string, token: string) {
  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ imageBase64 }),
  })
  if (!res.ok) throw new Error('Image upload failed')
  return res.json()
}

async function createOrderInAPI(payload: unknown) {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Create order failed')
  return res.json()
}

async function fetchOrdersFromAPI(token: string): Promise<Order[]> {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch orders')
  return res.json()
}

async function updateOrderStatusAPI(id: string, status: OrderStatus, token: string): Promise<Order> {
  const res = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update order')
  return res.json()
}

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function App() {
  const [view, setView] = useState<ViewMode>('home')
  const [databaseMode, setDatabaseMode] = useState<DatabaseMode>('browser')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : initialProducts
  })
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [orderMessage, setOrderMessage] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [adminAuth, setAdminAuth] = useState<AdminAuth>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY)
    return saved ? JSON.parse(saved) : { token: '', email: 'admin@etspolodieu.com' }
  })
  const [adminPassword, setAdminPassword] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adminForm, setAdminForm] = useState({
    category: 'Electronics',
    name: '',
    price: '',
    oldPrice: '',
    rating: '4.5',
    tag: 'New',
    image: '',
  })
  const [checkoutData, setCheckoutData] = useState({
    fullName: '',
    phone: '',
    city: 'Douala',
    address: SHOP_ADDRESS,
    paymentMethod: 'MTN MoMo',
    mobileMoneyNumber: '',
  })

  useEffect(() => {
    if (databaseMode === 'browser') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    }
  }, [products, databaseMode])

  useEffect(() => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminAuth))
  }, [adminAuth])

  useEffect(() => {
    if (databaseMode !== 'online') return
    fetchProductsFromAPI().then(setProducts).catch(() => setAuthMessage('Could not load online products'))
  }, [databaseMode])

  useEffect(() => {
    if (databaseMode !== 'online' || !adminAuth.token) return
    fetchOrdersFromAPI(adminAuth.token).then(setOrders).catch(() => undefined)
  }, [databaseMode, adminAuth.token])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [products, search, selectedCategory])

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const delivery = subtotal > 0 ? 2500 : 0
  const total = subtotal + delivery

  const handleAdminLogin = async () => {
    try {
      const data = await loginAdmin(adminAuth.email, adminPassword)
      setAdminAuth({ token: data.token || '', email: data.user?.email || adminAuth.email })
      setDatabaseMode('online')
      setAuthMessage('Admin login successful')
    } catch {
      setAuthMessage('Admin login failed')
    }
  }

  const handleLogout = () => {
    setAdminAuth({ token: '', email: adminAuth.email })
    setAdminPassword('')
    setAuthMessage('Logged out')
  }

  const resetAdminForm = () => {
    setEditingId(null)
    setAdminForm({
      category: 'Electronics',
      name: '',
      price: '',
      oldPrice: '',
      rating: '4.5',
      tag: 'New',
      image: '',
    })
  }

  const resetAllBrowserProducts = () => {
    setProducts(initialProducts)
    localStorage.removeItem(STORAGE_KEY)
  }

  const saveProduct = async () => {
    const payload: Product = {
      id: editingId || String(Date.now()),
      category: adminForm.category,
      name: adminForm.name,
      price: Number(adminForm.price || 0),
      oldPrice: Number(adminForm.oldPrice || 0),
      rating: Number(adminForm.rating || 0),
      tag: adminForm.tag,
      image: adminForm.image,
    }

    if (!payload.name.trim()) return

    if (editingId) {
      setProducts((prev) => prev.map((item) => (item.id === editingId ? payload : item)))
      if (databaseMode === 'online' && adminAuth.token) {
        try {
          const updated = await updateProductInAPI(editingId, payload, adminAuth.token)
          setProducts((prev) => prev.map((item) => (item.id === editingId ? { ...payload, id: String(updated._id || editingId) } : item)))
        } catch {
          setAuthMessage('Could not update product online')
        }
      }
    } else {
      const localId = String(Date.now())
      setProducts((prev) => [{ ...payload, id: localId }, ...prev])
      if (databaseMode === 'online' && adminAuth.token) {
        try {
          const created = await createProductInAPI(payload, adminAuth.token)
          setProducts((prev) => [{ ...payload, id: String(created._id || localId), image: created.image || payload.image }, ...prev.filter((p) => p.id !== localId)])
        } catch {
          setAuthMessage('Could not create product online')
        }
      }
    }

    resetAdminForm()
  }

  const editProduct = (product: Product) => {
    setEditingId(product.id)
    setAdminForm({
      category: product.category,
      name: product.name,
      price: String(product.price),
      oldPrice: String(product.oldPrice),
      rating: String(product.rating),
      tag: product.tag,
      image: product.image || '',
    })
    setView('admin')
  }

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== id))
    setCart((prev) => prev.filter((item) => item.id !== id))
    if (databaseMode === 'online' && adminAuth.token) {
      try {
        await deleteProductInAPI(id, adminAuth.token)
      } catch {
        setAuthMessage('Could not delete product online')
      }
    }
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (databaseMode === 'online' && adminAuth.token) {
      try {
        setIsUploadingImage(true)
        const base64 = await readFileAsBase64(file)
        const result = await uploadImageToAPI(base64, adminAuth.token)
        setAdminForm((prev) => ({ ...prev, image: result.imageUrl || '' }))
      } catch {
        setAuthMessage('Image upload failed')
      } finally {
        setIsUploadingImage(false)
      }
      return
    }

    const base64 = await readFileAsBase64(file)
    setAdminForm((prev) => ({ ...prev, image: base64 }))
  }

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const found = prev.find((item) => item.id === product.id)
      if (found) {
        return prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item))
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item)).filter((item) => item.qty > 0))
  }

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const completeOrder = async () => {
    try {
      if (databaseMode === 'online') {
        await createOrderInAPI({
          customerName: checkoutData.fullName,
          customerPhone: checkoutData.phone,
          city: checkoutData.city,
          address: checkoutData.address,
          paymentMethod: checkoutData.paymentMethod,
          mobileMoneyNumber: checkoutData.mobileMoneyNumber,
          items: cart.map((item) => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
            image: item.image || '',
          })),
          subtotal,
          delivery,
          total,
        })
        setOrderMessage('Order saved to backend successfully')
      } else {
        setOrderMessage('Order saved in browser mode only')
      }
    } catch {
      setOrderMessage('Order could not be saved to backend')
    }

    setView('success')
  }

  const openWhatsAppOrder = () => {
    const items = cart.map((item) => `- ${item.name} x${item.qty} = ${formatCFA(item.price * item.qty)}`).join('%0A')
    const paymentInfo = (checkoutData.paymentMethod === 'MTN MoMo' || checkoutData.paymentMethod === 'Orange Money') && checkoutData.mobileMoneyNumber
      ? `${checkoutData.paymentMethod} (${checkoutData.mobileMoneyNumber})`
      : checkoutData.paymentMethod

    const text = `Hello ${SHOP_NAME},%0A%0AI want to place this order:%0A${items}%0A%0ASubtotal: ${formatCFA(subtotal)}%0ADelivery: ${formatCFA(delivery)}%0ATotal: ${formatCFA(total)}%0A%0ACustomer Name: ${checkoutData.fullName || 'Not provided'}%0APhone: ${checkoutData.phone || 'Not provided'}%0ACity: ${checkoutData.city}%0AAddress: ${checkoutData.address}%0APayment Method: ${paymentInfo}`
    window.open(`https://wa.me/${SHOP_PHONE}?text=${text}`, '_blank')
    setCart([])
  }

  const openWhatsAppChat = () => {
    const text = encodeURIComponent(`Hello ${SHOP_NAME}, I want to ask about your products.`)
    window.open(`https://wa.me/${SHOP_PHONE}?text=${text}`, '_blank')
  }

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    if (!adminAuth.token) return
    try {
      const updated = await updateOrderStatusAPI(id, status, adminAuth.token)
      setOrders((prev) => prev.map((order) => (order._id === id ? updated : order)))
    } catch {
      setAuthMessage('Could not update order status')
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-dark">
          <div className="container row between wrap gap-sm">
            <span>Order: {SHOP_PHONE_DISPLAY}</span>
            <span>{SHOP_ADDRESS}</span>
          </div>
        </div>
        <div className="container topbar-main">
          <div>
            <div className="brand">{SHOP_NAME}</div>
            <div className="brand-sub">Trusted Electronics Store</div>
          </div>
          <input className="search" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="row gap-sm wrap">
            <button className="btn btn-light" onClick={() => setView('admin')}>Admin</button>
            <button className="btn btn-primary" onClick={() => setView('cart')}>Cart ({cartCount})</button>
          </div>
        </div>
        <div className="container row wrap gap-sm chips-row">
          <span className={`pill ${databaseMode === 'online' ? 'pill-green' : ''}`}>{databaseMode === 'online' ? 'ONLINE DATABASE' : 'BROWSER STORAGE'}</span>
          <button className="btn btn-light" onClick={() => setDatabaseMode((prev) => (prev === 'browser' ? 'online' : 'browser'))}>Switch Mode</button>
          {topLinks.map((item) => <span key={item} className="pill">{item}</span>)}
        </div>
      </header>

      <main className="container main-space">
        {view === 'home' && (
          <>
            <section className="hero-grid">
              <aside className="panel">
                <h3>Categories</h3>
                <div className="stack-sm">
                  {categories.map((category) => (
                    <button key={category} className={`category-btn ${selectedCategory === category ? 'active' : ''}`} onClick={() => setSelectedCategory(category)}>
                      {category}
                    </button>
                  ))}
                </div>
              </aside>

              <div className="stack-md">
                <div className="hero-cards">
                  {heroCards.map((card, index) => (
                    <div key={card.title} className={`hero-card ${index === 0 ? 'hero-main' : 'hero-soft'}`}>
                      <span className="pill">Featured</span>
                      <h2>{card.title}</h2>
                      <p>{card.subtitle}</p>
                      <button className="btn btn-primary">{card.cta}</button>
                    </div>
                  ))}
                </div>

                <div className="collections-grid">
                  {collections.map((item) => (
                    <div key={item} className="mini-card">
                      <div className="mini-icon" />
                      <div>{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="row between wrap gap-sm section-head">
                <div>
                  <h2>Weekly Offer</h2>
                  <p className="muted">Limited stock · Popular picks at discounted prices</p>
                </div>
                <div className="row gap-sm wrap">
                  <span className="pill">{selectedCategory}</span>
                  <span className="pill">{filteredProducts.length} products</span>
                </div>
              </div>

              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <div className="product-card" key={product.id}>
                    <div className="product-media">
                      <span className="tag">{product.tag}</span>
                      {product.image ? <img src={product.image} alt={product.name} /> : <div className="product-placeholder" />}
                    </div>
                    <div className="product-body">
                      <div className="row between gap-sm wrap">
                        <span className="pill">{product.category}</span>
                        <span className="rating">★ {product.rating}</span>
                      </div>
                      <h4>{product.name}</h4>
                      <div className="price">{formatCFA(product.price)}</div>
                      <div className="old-price">{formatCFA(product.oldPrice)}</div>
                      <button className="btn btn-primary full" onClick={() => addToCart(product)}>Add to cart</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="two-col">
              <div className="feature-banner">
                <span className="pill">Why choose us</span>
                <h2>A premium online store experience built for modern ecommerce.</h2>
                <p>Shop Samsung smart TVs, LG smart TVs, washing machines, microwaves, soundbars, gas cookers, fridges, office furniture and more.</p>
              </div>
              <div className="feature-grid">
                {features.map((feature) => (
                  <div key={feature.title} className="panel compact">
                    <h4>{feature.title}</h4>
                    <p className="muted">{feature.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="two-col">
              <div className="panel">
                <span className="pill pill-green">Our Store Location</span>
                <h2>Visit {SHOP_NAME}</h2>
                <p className="muted">{SHOP_ADDRESS}</p>
                <p className="muted">Phone: {SHOP_PHONE_DISPLAY}</p>
                <div className="map-wrap">
                  <iframe
                    title="store location"
                    src="https://www.google.com/maps?q=Bonaberi-Ndobo%20opposite%20H%C3%B4tel%20le%20Bien%2C%20Douala&z=15&output=embed"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="panel">
                <span className="pill pill-green">Images</span>
                <h2>Add real product images</h2>
                <p className="muted">Use the Admin page to paste an image URL or upload directly when online mode is enabled.</p>
              </div>
            </section>
          </>
        )}

        {view === 'admin' && (
          <section className="admin-grid">
            <div className="panel sticky-panel">
              <h2>Admin Panel</h2>
              <p className="muted">Add new items or edit old ones manually from here.</p>

              <div className="info-box">
                <strong>Database mode</strong>
                <div>Current mode: {databaseMode === 'online' ? 'Online database API' : 'Browser local storage'}</div>
                <div className="muted small">Set <code>VITE_API_BASE_URL</code> before deploying.</div>
              </div>

              <div className="login-box">
                <h3>Admin Login</h3>
                <input className="input" placeholder="Admin email" value={adminAuth.email} onChange={(e) => setAdminAuth((prev) => ({ ...prev, email: e.target.value }))} />
                <input className="input" type="password" placeholder="Admin password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
                <div className="row gap-sm wrap">
                  <button className="btn btn-dark" onClick={handleAdminLogin}>Login</button>
                  <button className="btn btn-light" onClick={handleLogout}>Logout</button>
                </div>
                {authMessage ? <p className="muted small">{authMessage}</p> : null}
              </div>

              <div className="stack-sm">
                <input className="input" placeholder="Product name" value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} />
                <input className="input" placeholder="Category" value={adminForm.category} onChange={(e) => setAdminForm({ ...adminForm, category: e.target.value })} />
                <input className="input" placeholder="Price" value={adminForm.price} onChange={(e) => setAdminForm({ ...adminForm, price: e.target.value })} />
                <input className="input" placeholder="Old price" value={adminForm.oldPrice} onChange={(e) => setAdminForm({ ...adminForm, oldPrice: e.target.value })} />
                <input className="input" placeholder="Rating" value={adminForm.rating} onChange={(e) => setAdminForm({ ...adminForm, rating: e.target.value })} />
                <input className="input" placeholder="Tag" value={adminForm.tag} onChange={(e) => setAdminForm({ ...adminForm, tag: e.target.value })} />
                <input className="input" placeholder="Image URL" value={adminForm.image} onChange={(e) => setAdminForm({ ...adminForm, image: e.target.value })} />
                <div className="upload-box">
                  <label className="small"><strong>Upload image</strong></label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                  {isUploadingImage ? <p className="muted small">Uploading image...</p> : null}
                </div>
              </div>

              <div className="row gap-sm wrap margin-top">
                <button className="btn btn-primary" onClick={saveProduct}>{editingId ? 'Update Product' : 'Add Product'}</button>
                <button className="btn btn-light" onClick={resetAdminForm}>Clear</button>
                <button className="btn btn-danger-soft" onClick={resetAllBrowserProducts}>Reset All</button>
                <button className="btn btn-light" onClick={() => setView('home')}>Back to Store</button>
              </div>
            </div>

            <div className="stack-md">
              <div className="panel">
                <h2>Manage Products</h2>
                <div className="products-grid">
                  {products.map((product) => (
                    <div className="product-card" key={product.id}>
                      <div className="product-media">
                        <span className="tag">{product.tag}</span>
                        {product.image ? <img src={product.image} alt={product.name} /> : <div className="product-placeholder" />}
                      </div>
                      <div className="product-body">
                        <h4>{product.name}</h4>
                        <div className="muted small">{product.category}</div>
                        <div className="price">{formatCFA(product.price)}</div>
                        <div className="row gap-sm wrap margin-top">
                          <button className="btn btn-light" onClick={() => editProduct(product)}>Edit</button>
                          <button className="btn btn-danger" onClick={() => deleteProduct(product.id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <h2>Customer Orders</h2>
                {orders.length === 0 ? (
                  <p className="muted">No orders yet</p>
                ) : (
                  <div className="stack-sm">
                    {orders.map((order) => (
                      <div key={order._id} className="order-card">
                        <div className="row between wrap gap-sm">
                          <div>
                            <div className="order-name">{order.customerName}</div>
                            <div className="muted small">{order.customerPhone}</div>
                            <div className="muted small">{order.city}</div>
                          </div>
                          <div className="right-text">
                            <div className="order-total">{formatCFA(order.total)}</div>
                            <div className="muted small">{order.paymentMethod}</div>
                          </div>
                        </div>
                        <div className="margin-top small">
                          {order.items.map((item, i) => (
                            <div key={`${order._id}-${i}`}>{item.name} × {item.qty}</div>
                          ))}
                        </div>
                        <div className="row gap-sm wrap margin-top">
                          {(['pending', 'confirmed', 'delivered', 'cancelled'] as OrderStatus[]).map((status) => (
                            <button
                              key={status}
                              className={`status-btn ${order.status === status ? 'active' : ''}`}
                              onClick={() => updateOrderStatus(order._id, status)}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {view === 'cart' && (
          <section className="cart-grid">
            <div className="panel">
              <h2>Your Cart</h2>
              {cart.length === 0 ? (
                <div className="empty-state">
                  <h3>Your cart is empty</h3>
                  <p className="muted">Add products from the homepage to continue.</p>
                  <button className="btn btn-primary" onClick={() => setView('home')}>Continue shopping</button>
                </div>
              ) : (
                <div className="stack-sm">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="row gap-md wrap">
                        {item.image ? <img className="cart-thumb" src={item.image} alt={item.name} /> : <div className="cart-thumb placeholder" />}
                        <div>
                          <div className="pill inline-pill">{item.category}</div>
                          <h4>{item.name}</h4>
                          <p className="muted small">{formatCFA(item.price)} each</p>
                        </div>
                      </div>
                      <div className="row gap-sm wrap align-center">
                        <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>-</button>
                        <span>{item.qty}</span>
                        <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                        <strong>{formatCFA(item.price * item.qty)}</strong>
                        <button className="btn btn-danger-soft" onClick={() => removeItem(item.id)}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel sticky-panel">
              <h3>Order Summary</h3>
              <div className="summary-row"><span>Subtotal</span><span>{formatCFA(subtotal)}</span></div>
              <div className="summary-row"><span>Delivery</span><span>{formatCFA(delivery)}</span></div>
              <div className="summary-row strong"><span>Total</span><span>{formatCFA(total)}</span></div>
              <button className="btn btn-primary full margin-top" disabled={cart.length === 0} onClick={() => setView('checkout')}>Proceed to Checkout</button>
            </div>
          </section>
        )}

        {view === 'checkout' && (
          <section className="cart-grid">
            <div className="panel">
              <h2>Checkout</h2>
              <div className="form-grid">
                <input className="input" placeholder="Full name" value={checkoutData.fullName} onChange={(e) => setCheckoutData({ ...checkoutData, fullName: e.target.value })} />
                <input className="input" placeholder="Phone number" value={checkoutData.phone} onChange={(e) => setCheckoutData({ ...checkoutData, phone: e.target.value })} />
                <input className="input" placeholder="City" value={checkoutData.city} onChange={(e) => setCheckoutData({ ...checkoutData, city: e.target.value })} />
                <input className="input form-wide" placeholder="Delivery address" value={checkoutData.address} onChange={(e) => setCheckoutData({ ...checkoutData, address: e.target.value })} />
              </div>

              <div className="payment-box">
                <h3>Payment Method</h3>
                <div className="payment-grid">
                  {['MTN MoMo', 'Orange Money', 'Card', 'Cash on Delivery'].map((method) => (
                    <button
                      key={method}
                      className={`payment-btn ${checkoutData.paymentMethod === method ? 'active' : ''}`}
                      onClick={() => setCheckoutData({ ...checkoutData, paymentMethod: method })}
                    >
                      {method}
                    </button>
                  ))}
                </div>
                {(checkoutData.paymentMethod === 'MTN MoMo' || checkoutData.paymentMethod === 'Orange Money') && (
                  <input className="input" placeholder="Mobile Money number" value={checkoutData.mobileMoneyNumber} onChange={(e) => setCheckoutData({ ...checkoutData, mobileMoneyNumber: e.target.value })} />
                )}
              </div>

              <div className="row gap-sm wrap margin-top">
                <button className="btn btn-light" onClick={() => setView('cart')}>Back to Cart</button>
                <button className="btn btn-primary" onClick={completeOrder}>Place Order</button>
              </div>
            </div>

            <div className="panel sticky-panel">
              <h3>Checkout Summary</h3>
              {cart.map((item) => (
                <div key={item.id} className="summary-row"><span>{item.name} × {item.qty}</span><span>{formatCFA(item.price * item.qty)}</span></div>
              ))}
              <div className="info-box margin-top">
                <strong>Selected payment</strong>
                <div>{checkoutData.paymentMethod}{checkoutData.mobileMoneyNumber ? ` · ${checkoutData.mobileMoneyNumber}` : ''}</div>
              </div>
              <div className="summary-row margin-top"><span>Subtotal</span><span>{formatCFA(subtotal)}</span></div>
              <div className="summary-row"><span>Delivery</span><span>{formatCFA(delivery)}</span></div>
              <div className="summary-row strong"><span>Total</span><span>{formatCFA(total)}</span></div>
            </div>
          </section>
        )}

        {view === 'success' && (
          <section className="panel success-panel">
            <h2>Order placed successfully</h2>
            <p className="muted">Your customer can now confirm the order directly on WhatsApp with products, totals, address and payment details already prepared.</p>
            {orderMessage ? <p className="muted margin-top">{orderMessage}</p> : null}
            <div className="success-box">
              <strong>Send order to WhatsApp</strong>
              <div>Number: {SHOP_PHONE_DISPLAY}</div>
              <div>Includes products, quantities, total, address and payment method.</div>
            </div>
            <div className="row center gap-sm wrap margin-top">
              <button className="btn btn-green" onClick={openWhatsAppOrder}>Send Order on WhatsApp</button>
              <button className="btn btn-primary" onClick={() => { setCart([]); setView('home') }}>Back to Store</button>
              <button className="btn btn-light" onClick={() => setView('cart')}>Open Cart</button>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <h4>Customer Service</h4>
            <div className="footer-link">How to buy</div>
            <div className="footer-link">Contact us</div>
            <div className="footer-link">Return policy</div>
          </div>
          <div>
            <h4>Need Help</h4>
            <div className="footer-link">Delivery information</div>
            <div className="footer-link">Order tracking</div>
            <div className="footer-link">Privacy policy</div>
          </div>
          <div>
            <h4>About</h4>
            <div className="footer-link">About us</div>
            <div className="footer-link">Our stores</div>
            <div className="footer-link">Terms of sale</div>
          </div>
          <div>
            <h4>Newsletter</h4>
            <div className="newsletter-row">
              <input className="input input-dark" placeholder="Your email" />
              <button className="btn btn-primary">Join</button>
            </div>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>{SHOP_ADDRESS} · {SHOP_PHONE_DISPLAY}</span>
          <span>Homepage, cart, checkout, backend auth, upload and admin panel included.</span>
        </div>
      </footer>

      <button className="wa-float" onClick={openWhatsAppChat}>Chat on WhatsApp</button>
    </div>
  )
}
