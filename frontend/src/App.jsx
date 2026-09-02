import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

/* =====================================================
   API HELPER
===================================================== */

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Request failed: ${response.status}`
    );
  }

  return data;
}

/* =====================================================
   ROLE PERMISSIONS
===================================================== */

const PERMISSIONS = {
  ADMIN: {
    Customers: "full",
    Products: "full",
    Stock: "full",
    "Sales Challans": "full",
    Users: "full",
  },

  SALES: {
    Customers: "full",
    Products: "view",
    Stock: "view",
    "Sales Challans": "full",
    Users: "none",
  },

  WAREHOUSE: {
    Customers: "view",
    Products: "full",
    Stock: "full",
    "Sales Challans": "view",
    Users: "none",
  },

  ACCOUNTS: {
    Customers: "view",
    Products: "view",
    Stock: "view",
    "Sales Challans": "view",
    Users: "none",
  },
};

function getPermission(role, page) {
  return (
    PERMISSIONS[role]?.[page] ||
    "none"
  );
}

function canView(role, page) {
  return (
    getPermission(role, page) !== "none"
  );
}

function canEdit(role, page) {
  return (
    getPermission(role, page) === "full"
  );
}

/* =====================================================
   MAIN APP
===================================================== */

function App() {
  const [user, setUser] =
    useState(null);

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [activePage, setActivePage] =
    useState("Dashboard");

  /* Check existing login */

  useEffect(() => {
    apiRequest("/auth/me")
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, []);

  /* Logout */

  const handleLogout = async () => {
    try {
      await apiRequest(
        "/auth/logout",
        {
          method: "POST",
        }
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }

    setUser(null);
    setActivePage("Dashboard");
  };

  /* Loading */

  if (checkingAuth) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-card">
          <div className="logo-icon">
            ERP
          </div>

          <h2>Mini ERP</h2>

          <p>
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  /* Login */

  if (!user) {
    return (
      <Login
        onLogin={(loggedInUser) => {
          setUser(loggedInUser);
          setActivePage(
            "Dashboard"
          );
        }}
      />
    );
  }

  const role = user.role;

  /* =====================================================
     SIDEBAR
  ===================================================== */

  const menuItems = [
    "Dashboard",
    "Customers",
    "Products",
    "Sales Challans",
    "Stock",

    ...(role === "ADMIN"
      ? ["Users"]
      : []),
  ];

  const goToPage = (page) => {
    if (
      page === "Dashboard" ||
      canView(role, page)
    ) {
      setActivePage(page);
    }
  };

  return (
    <div className="app">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">

        <div className="logo">

          <div className="logo-icon">
            ERP
          </div>

          <div>
            <h2>Mini ERP</h2>
            <span>
              CRM Portal
            </span>
          </div>

        </div>

        <nav>

          {menuItems.map(
            (item) => (
              <button
                key={item}
                className={
                  activePage === item
                    ? "menu active"
                    : "menu"
                }
                onClick={() =>
                  goToPage(item)
                }
              >
                {item}
              </button>
            )
          )}

        </nav>

        <div className="sidebar-bottom">

          <div className="user-box">

            <div className="avatar">
              {(user.name ||
                "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user.name}
              </strong>

              <span>
                {role}
              </span>
            </div>

          </div>

          <button
            className="logout-button"
            onClick={
              handleLogout
            }
          >
            Logout
          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="main">

        <header className="topbar">

          <div>

            <h1>
              {activePage}
            </h1>

            <p>
              Manage your business
              operations
            </p>

          </div>

          <div className="topbar-right">

            <button className="notification">
              🔔
            </button>

            <div className="profile">

              <div className="avatar">
                {(user.name ||
                  "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <span>
                {user.name}
              </span>

            </div>

          </div>

        </header>

        {/* DASHBOARD */}

        {activePage ===
          "Dashboard" && (
          <Dashboard
            role={role}
            goToPage={
              goToPage
            }
          />
        )}

        {/* CUSTOMERS */}

        {activePage ===
          "Customers" &&
          canView(
            role,
            "Customers"
          ) && (
            <Customers
              canEdit={canEdit(
                role,
                "Customers"
              )}
            />
          )}

        {/* PRODUCTS */}

        {activePage ===
          "Products" &&
          canView(
            role,
            "Products"
          ) && (
            <Products
              canEdit={canEdit(
                role,
                "Products"
              )}
            />
          )}

        {/* CHALLANS */}

        {activePage ===
          "Sales Challans" &&
          canView(
            role,
            "Sales Challans"
          ) && (
            <Challans
              canEdit={canEdit(
                role,
                "Sales Challans"
              )}
            />
          )}

        {/* STOCK */}

        {activePage ===
          "Stock" &&
          canView(
            role,
            "Stock"
          ) && (
            <Stock
              canEdit={canEdit(
                role,
                "Stock"
              )}
            />
          )}

        {/* USERS */}

        {activePage ===
          "Users" &&
          role === "ADMIN" && (
            <Users />
          )}

      </main>

    </div>
  );
}

/* =====================================================
   LOGIN / REGISTER
===================================================== */

function Login({ onLogin }) {

  const [
    registerMode,
    setRegisterMode,
  ] = useState(false);

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      setError("");
      setSuccess("");
      setLoading(true);

      try {

        /* REGISTER */

        if (registerMode) {

          await apiRequest(
            "/auth/register",
            {
              method: "POST",

              body: JSON.stringify({
                name:
                  name.trim(),

                email:
                  email.trim(),

                password,
              }),
            }
          );

          setSuccess(
            "Account created successfully. Please login."
          );

          setRegisterMode(
            false
          );

          setName("");
          setPassword("");

          return;
        }

        /* LOGIN */

        const data =
          await apiRequest(
            "/auth/login",
            {
              method: "POST",

              body: JSON.stringify({
                email:
                  email.trim(),

                password,
              }),
            }
          );

        onLogin(
          data.user
        );

      } catch (err) {

        setError(
          err.message
        );

      } finally {

        setLoading(false);

      }
    };

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">

          <div className="logo-icon">
            ERP
          </div>

          <h1>
            Mini ERP
          </h1>

          <p>
            CRM Operations Portal
          </p>

        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        {success && (
          <div className="login-success">
            {success}
          </div>
        )}

        <h2>
          {registerMode
            ? "Create Account"
            : "Welcome Back"}
        </h2>

        <p className="login-description">
          {registerMode
            ? "Create your employee account."
            : "Sign in to manage your business operations."}
        </p>

        <form
          onSubmit={
            handleSubmit
          }
        >

          {registerMode && (
            <>
              <label>
                Name
              </label>

              <input
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="Enter your name"
                required
                minLength={2}
              />
            </>
          )}

          <label>
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            placeholder="Enter your email"
            required
          />

          <label>
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            placeholder="Enter your password"
            required
          />

          <button
            className="login-button"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : registerMode
              ? "Create Account"
              : "Sign In"}
          </button>

        </form>

        <div className="login-switch">

          {registerMode
            ? "Already have an account?"
            : "Don't have an account?"}

          {" "}

          <button
            type="button"
            onClick={() => {
              setRegisterMode(
                !registerMode
              );

              setError("");
              setSuccess("");
            }}
          >
            {registerMode
              ? "Sign In"
              : "Create Account"}
          </button>

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   DASHBOARD
===================================================== */

function Dashboard({
  role,
  goToPage,
}) {

  const actions = [
    [
      "Customers",
      "＋ Add Customer",
    ],

    [
      "Products",
      "＋ Add Product",
    ],

    [
      "Sales Challans",
      "＋ Create Challan",
    ],

    [
      "Stock",
      "↕ Stock Movement",
    ],
  ];

  return (
    <div className="content">

      <div className="stats">

        <Stat
          title="Total Customers"
          value="1,248"
          icon="👥"
        />

        <Stat
          title="Total Products"
          value="356"
          icon="📦"
        />

        <Stat
          title="Pending Challans"
          value="24"
          icon="📄"
        />

        <Stat
          title="Low Stock Items"
          value="12"
          icon="⚠️"
        />

      </div>

      <div className="dashboard-grid">

        <div className="card large">

          <div className="card-header">

            <div>
              <h2>
                Sales Overview
              </h2>

              <p>
                Monthly sales
                performance
              </p>
            </div>

            <select>
              <option>
                Last 6 Months
              </option>

              <option>
                Last 12 Months
              </option>
            </select>

          </div>

          <div className="chart">

            <div className="bars">

              {[
                45,
                65,
                52,
                78,
                62,
                90,
                72,
                85,
                68,
                95,
                80,
                100,
              ].map(
                (height, index) => (

                  <div
                    className="bar-container"
                    key={index}
                  >

                    <div
                      className="bar"
                      style={{
                        height:
                          `${height}%`,
                      }}
                    />

                    <span>
                      {
                        [
                          "Jan",
                          "Feb",
                          "Mar",
                          "Apr",
                          "May",
                          "Jun",
                          "Jul",
                          "Aug",
                          "Sep",
                          "Oct",
                          "Nov",
                          "Dec",
                        ][index]
                      }
                    </span>

                  </div>
                )
              )}

            </div>

          </div>

        </div>

        <div className="card">

          <div className="card-header">

            <div>
              <h2>
                Recent Challans
              </h2>

              <p>
                Latest sales
                activity
              </p>
            </div>

          </div>

          <div className="recent-list">

            <RecentChallan
              number="CH-1005"
              customer="Rahul Traders"
              amount="₹12,500"
            />

            <RecentChallan
              number="CH-1004"
              customer="ABC Distributors"
              amount="₹8,750"
            />

            <RecentChallan
              number="CH-1003"
              customer="Sharma Medicals"
              amount="₹15,200"
            />

            <RecentChallan
              number="CH-1002"
              customer="City Wholesale"
              amount="₹6,800"
            />

          </div>

        </div>

      </div>

      <div className="card">

        <div className="card-header">

          <div>
            <h2>
              Quick Actions
            </h2>

            <p>
              Available according
              to your role
            </p>
          </div>

        </div>

        <div className="quick-actions">

          {actions
            .filter(
              ([page]) =>
                canEdit(
                  role,
                  page
                )
            )
            .map(
              ([page, label]) => (
                <button
                  key={page}
                  onClick={() =>
                    goToPage(
                      page
                    )
                  }
                >
                  {label}
                </button>
              )
            )}

          {actions.every(
            ([page]) =>
              !canEdit(
                role,
                page
              )
          ) && (
            <p>
              View-only role:
              no write actions
              available.
            </p>
          )}

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   STAT
===================================================== */

function Stat({
  title,
  value,
  icon,
}) {

  return (
    <div className="stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <p>
          {title}
        </p>

        <h2>
          {value}
        </h2>
      </div>

    </div>
  );
}

/* =====================================================
   RECENT CHALLAN
===================================================== */

function RecentChallan({
  number,
  customer,
  amount,
}) {

  return (
    <div className="recent-item">

      <div>

        <strong>
          {number}
        </strong>

        <span>
          {customer}
        </span>

      </div>

      <strong>
        {amount}
      </strong>

    </div>
  );
}

/* =====================================================
   CUSTOMERS
===================================================== */

function Customers({
  canEdit,
}) {

  const emptyForm = {
    customerName: "",
    mobile: "",
    email: "",
    businessName: "",
    gstNumber: "",
    customerType:
      "RETAIL",
    address: "",
    status: "LEAD",
    followUpDate: "",
    notes: "",
  };

  const [
    customers,
    setCustomers,
  ] = useState([]);

  const [form, setForm] =
    useState(emptyForm);

  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadCustomers =
    async () => {

      try {

        setLoading(true);
        setError("");

        const data =
          await apiRequest(
            "/customers"
          );

        setCustomers(
          data.customers ||
            data.data ||
            []
        );

      } catch (err) {

        setError(
          err.message
        );

      } finally {

        setLoading(false);

      }
    };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      try {

        setSaving(true);
        setError("");

        await apiRequest(
          "/customers",
          {
            method: "POST",

            body:
              JSON.stringify(
                form
              ),
          }
        );

        alert(
          "Customer added successfully!"
        );

        setForm(
          emptyForm
        );

        setShowForm(false);

        loadCustomers();

      } catch (err) {

        setError(
          err.message
        );

      } finally {

        setSaving(false);

      }
    };

  const filtered =
    customers.filter(
      (customer) =>
        `${customer.customerName || ""} ${
          customer.businessName || ""
        } ${customer.mobile || ""}`
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  return (
    <div className="content">

      <div className="page-actions">

        <div>
          <h2>
            Customers
          </h2>

          <p>
            Manage customers
            and CRM follow-ups.
          </p>
        </div>

        {canEdit && (
          <button
            className="primary"
            onClick={() =>
              setShowForm(
                !showForm
              )
            }
          >
            ＋ Add Customer
          </button>
        )}

      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {canEdit &&
        showForm && (

          <div className="card customer-form">

            <h2>
              Add New Customer
            </h2>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="form-grid">

                <input
                  placeholder="Customer Name"
                  value={
                    form.customerName
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      customerName:
                        e.target.value,
                    })
                  }
                  required
                />

                <input
                  placeholder="Mobile Number"
                  value={
                    form.mobile
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      mobile:
                        e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={
                    form.email
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email:
                        e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Business Name"
                  value={
                    form.businessName
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      businessName:
                        e.target.value,
                    })
                  }
                  required
                />

                <input
                  placeholder="GST Number (Optional)"
                  value={
                    form.gstNumber
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      gstNumber:
                        e.target.value,
                    })
                  }
                />

                <select
                  value={
                    form.customerType
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      customerType:
                        e.target.value,
                    })
                  }
                >
                  <option value="RETAIL">
                    Retail
                  </option>

                  <option value="WHOLESALE">
                    Wholesale
                  </option>

                  <option value="DISTRIBUTOR">
                    Distributor
                  </option>
                </select>

                <select
                  value={
                    form.status
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status:
                        e.target.value,
                    })
                  }
                >
                  <option value="LEAD">
                    Lead
                  </option>

                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>
                </select>

                <input
                  type="date"
                  value={
                    form.followUpDate
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      followUpDate:
                        e.target.value,
                    })
                  }
                />

              </div>

              <textarea
                placeholder="Address"
                value={
                  form.address
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    address:
                      e.target.value,
                  })
                }
                required
              />

              <textarea
                placeholder="Notes"
                value={
                  form.notes
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    notes:
                      e.target.value,
                  })
                }
              />

              <div className="form-buttons">

                <button
                  type="button"
                  className="cancel"
                  onClick={() =>
                    setShowForm(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  className="primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Customer"}
                </button>

              </div>

            </form>

          </div>
        )}

      <div className="card">

        <div className="search">

          🔍

          <input
            placeholder="Search customers..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        {loading ? (
          <p>
            Loading customers...
          </p>
        ) : filtered.length ===
          0 ? (
          <p>
            No customers found.
          </p>
        ) : (

          <table>

            <thead>

              <tr>
                <th>Customer</th>
                <th>Business</th>
                <th>Type</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>Follow-up</th>
              </tr>

            </thead>

            <tbody>

              {filtered.map(
                (customer) => (

                  <tr
                    key={
                      customer.id
                    }
                  >

                    <td>
                      <strong>
                        {
                          customer.customerName
                        }
                      </strong>
                    </td>

                    <td>
                      {
                        customer.businessName
                      }
                    </td>

                    <td>
                      {
                        customer.customerType
                      }
                    </td>

                    <td>
                      {
                        customer.mobile
                      }
                    </td>

                    <td>

                      <span
                        className={`badge ${
                          customer.status ===
                          "ACTIVE"
                            ? "success"
                            : customer.status ===
                              "LEAD"
                            ? "warning"
                            : "danger"
                        }`}
                      >
                        {
                          customer.status
                        }
                      </span>

                    </td>

                    <td>
                      {
                        customer.followUpDate ||
                        "-"
                      }
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

      </div>

    </div>
  );
}

/* =====================================================
   PRODUCTS
===================================================== */

function Products({
  canEdit,
}) {

  const emptyForm = {
    name: "",
    sku: "",
    category: "",
    unitPrice: "",
    currentStock: "0",
    minimumStock: "0",
    warehouseLocation: "",
  };

  const [
    products,
    setProducts,
  ] = useState([]);

  const [form, setForm] =
    useState(emptyForm);

  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadProducts =
    async () => {

      try {

        setLoading(true);
        setError("");

        const data =
          await apiRequest(
            "/products"
          );

        setProducts(
          data.products ||
            data.data ||
            []
        );

      } catch (err) {

        setError(
          err.message
        );

      } finally {

        setLoading(false);

      }
    };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      try {

        setSaving(true);
        setError("");

        await apiRequest(
          "/products",
          {
            method: "POST",

            body:
              JSON.stringify({
                ...form,

                unitPrice:
                  Number(
                    form.unitPrice
                  ),

                currentStock:
                  Number(
                    form.currentStock
                  ),

                minimumStock:
                  Number(
                    form.minimumStock
                  ),
              }),
          }
        );

        alert(
          "Product added successfully!"
        );

        setForm(
          emptyForm
        );

        setShowForm(false);

        loadProducts();

      } catch (err) {

        setError(
          err.message
        );

      } finally {

        setSaving(false);

      }
    };

  const filtered =
    products.filter(
      (product) =>
        `${product.name || ""} ${
          product.sku || ""
        } ${product.category || ""}`
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  return (
    <div className="content">

      <div className="page-actions">

        <div>
          <h2>
            Products & Inventory
          </h2>

          <p>
            Manage products,
            prices and warehouse
            stock.
          </p>
        </div>

        {canEdit && (
          <button
            className="primary"
            onClick={() =>
              setShowForm(
                !showForm
              )
            }
          >
            ＋ Add Product
          </button>
        )}

      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {canEdit &&
        showForm && (

          <div className="card customer-form">

            <h2>
              Add New Product
            </h2>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="form-grid">

                <input
                  placeholder="Product Name"
                  value={
                    form.name
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name:
                        e.target.value,
                    })
                  }
                  required
                />

                <input
                  placeholder="SKU"
                  value={
                    form.sku
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sku:
                        e.target.value,
                    })
                  }
                  required
                />

                <input
                  placeholder="Category"
                  value={
                    form.category
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category:
                        e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Unit Price"
                  value={
                    form.unitPrice
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      unitPrice:
                        e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="number"
                  placeholder="Opening Stock"
                  value={
                    form.currentStock
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      currentStock:
                        e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Minimum Stock"
                  value={
                    form.minimumStock
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minimumStock:
                        e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Warehouse Location"
                  value={
                    form.warehouseLocation
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      warehouseLocation:
                        e.target.value,
                    })
                  }
                  required
                />

              </div>

              <div className="form-buttons">

                <button
                  type="button"
                  className="cancel"
                  onClick={() =>
                    setShowForm(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  className="primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Product"}
                </button>

              </div>

            </form>

          </div>
        )}

      <div className="card">

        <div className="search">
          🔍

          <input
            placeholder="Search products..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        {loading ? (
          <p>
            Loading products...
          </p>
        ) : filtered.length ===
          0 ? (
          <p>
            No products found.
          </p>
        ) : (

          <table>

            <thead>

              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Location</th>
              </tr>

            </thead>

            <tbody>

              {filtered.map(
                (product) => (

                  <tr
                    key={
                      product.id
                    }
                  >

                    <td>
                      <strong>
                        {
                          product.name
                        }
                      </strong>
                    </td>

                    <td>
                      {
                        product.sku
                      }
                    </td>

                    <td>
                      {
                        product.category
                      }
                    </td>

                    <td>
                      ₹
                      {Number(
                        product.unitPrice
                      ).toFixed(2)}
                    </td>

                    <td>

                      <span
                        className={`stock ${
                          Number(
                            product.currentStock
                          ) <=
                          Number(
                            product.minimumStock
                          )
                            ? "danger"
                            : "good"
                        }`}
                      >
                        {
                          product.currentStock
                        }
                      </span>

                    </td>

                    <td>
                      {
                        product.warehouseLocation
                      }
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

      </div>

    </div>
  );
}

/* =====================================================
   SALES CHALLANS
===================================================== */

function Challans({
  canEdit,
}) {

  const [
    challans,
    setChallans,
  ] = useState([]);

  const [
    customers,
    setCustomers,
  ] = useState([]);

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    customerId,
    setCustomerId,
  ] = useState("");

  const [
    items,
    setItems,
  ] = useState([
    {
      productId: "",
      quantity: "",
    },
  ]);

  const [showForm, setShowForm] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadData =
    async () => {

      try {

        setLoading(true);
        setError("");

        const [
          customerData,
          productData,
          challanData,
        ] =
          await Promise.all([
            apiRequest(
              "/customers"
            ),

            apiRequest(
              "/products"
            ),

            apiRequest(
              "/sales-challans"
            ),
          ]);

        setCustomers(
          customerData.customers ||
            customerData.data ||
            []
        );

        setProducts(
          productData.products ||
            productData.data ||
            []
        );

        setChallans(
          challanData.challans ||
            challanData.data ||
            []
        );

      } catch (err) {

        setError(
          err.message
        );

      } finally {

        setLoading(false);

      }
    };

  useEffect(() => {
    loadData();
  }, []);

  const updateItem =
    (
      index,
      field,
      value
    ) => {

      setItems(
        items.map(
          (item, i) =>
            i === index
              ? {
                  ...item,
                  [field]:
                    value,
                }
              : item
        )
      );
    };

  const createChallan =
    async (e) => {

      e.preventDefault();

      const validItems =
        items.filter(
          (item) =>
            item.productId &&
            Number(
              item.quantity
            ) > 0
        );

      if (
        !customerId ||
        validItems.length === 0
      ) {

        setError(
          "Select a customer and at least one product."
        );

        return;
      }

      try {

        setSaving(true);
        setError("");

        await apiRequest(
          "/sales-challans",
          {
            method: "POST",

            body:
              JSON.stringify({
                customerId:
                  Number(
                    customerId
                  ),

                items:
                  validItems.map(
                    (item) => ({
                      productId:
                        Number(
                          item.productId
                        ),

                      quantity:
                        Number(
                          item.quantity
                        ),
                    })
                  ),
              }),
          }
        );

        alert(
          "Sales challan created successfully!"
        );

        setCustomerId("");

        setItems([
          {
            productId: "",
            quantity: "",
          },
        ]);

        setShowForm(false);

        loadData();

      } catch (err) {

        setError(
          err.message
        );

      } finally {

        setSaving(false);

      }
    };

  const confirmChallan =
    async (id) => {

      try {

        await apiRequest(
          `/sales-challans/${id}/status`,
          {
            method: "PATCH",

            body:
              JSON.stringify({
                status:
                  "CONFIRMED",
              }),
          }
        );

        alert(
          "Sales challan confirmed successfully!"
        );

        loadData();

      } catch (err) {

        alert(
          err.message
        );
      }
    };

  return (
    <div className="content">

      <div className="page-actions">

        <div>
          <h2>
            Sales Challans
          </h2>

          <p>
            Create and manage
            customer sales
            challans.
          </p>
        </div>

        {canEdit && (
          <button
            className="primary"
            onClick={() =>
              setShowForm(
                !showForm
              )
            }
          >
            ＋ Create Challan
          </button>
        )}

      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {/* CREATE CHALLAN */}

      {canEdit &&
        showForm && (

          <div className="card customer-form">

            <h2>
              Create Sales Challan
            </h2>

            <p>
              Select a customer
              and add one or more
              products.
            </p>

            <form
              onSubmit={
                createChallan
              }
            >

              <select
                value={
                  customerId
                }
                onChange={(e) =>
                  setCustomerId(
                    e.target.value
                  )
                }
                required
              >

                <option value="">
                  Select Customer
                </option>

                {customers.map(
                  (customer) => (
                    <option
                      key={
                        customer.id
                      }
                      value={
                        customer.id
                      }
                    >
                      {
                        customer.customerName
                      }{" "}
                      —{" "}
                      {
                        customer.businessName
                      }
                    </option>
                  )
                )}

              </select>

              <h2>
                Products
              </h2>

              {items.map(
                (
                  item,
                  index
                ) => (

                  <div
                    className="stock-form"
                    key={index}
                  >

                    <select
                      value={
                        item.productId
                      }
                      onChange={(e) =>
                        updateItem(
                          index,
                          "productId",
                          e.target.value
                        )
                      }
                      required
                    >

                      <option value="">
                        Select Product
                      </option>

                      {products.map(
                        (product) => (
                          <option
                            key={
                              product.id
                            }
                            value={
                              product.id
                            }
                          >
                            {
                              product.name
                            }{" "}
                            — Stock{" "}
                            {
                              product.currentStock
                            }
                          </option>
                        )
                      )}

                    </select>

                    <input
                      type="number"
                      min="1"
                      placeholder="Quantity"
                      value={
                        item.quantity
                      }
                      onChange={(e) =>
                        updateItem(
                          index,
                          "quantity",
                          e.target.value
                        )
                      }
                      required
                    />

                    {items.length >
                      1 && (
                      <button
                        type="button"
                        className="cancel"
                        onClick={() =>
                          setItems(
                            items.filter(
                              (_, i) =>
                                i !==
                                index
                            )
                          )
                        }
                      >
                        Remove
                      </button>
                    )}

                  </div>

                )
              )}

              <button
                type="button"
                className="small-action"
                onClick={() =>
                  setItems([
                    ...items,
                    {
                      productId: "",
                      quantity: "",
                    },
                  ])
                }
              >
                ＋ Add Product
              </button>

              <div className="form-buttons">

                <button
                  type="button"
                  className="cancel"
                  onClick={() =>
                    setShowForm(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  className="primary"
                  disabled={saving}
                >
                  {saving
                    ? "Creating..."
                    : "Create Draft Challan"}
                </button>

              </div>

            </form>

          </div>
        )}

      {/* HISTORY */}

      <div className="card">

        <h2>
          Challan History
        </h2>

        <p>
          Recent sales challans
          and their status.
        </p>

        {loading ? (
          <p>
            Loading challans...
          </p>
        ) : challans.length ===
          0 ? (
          <p>
            No sales challans
            found.
          </p>
        ) : (

          <table>

            <thead>

              <tr>
                <th>
                  Challan No.
                </th>

                <th>
                  Customer
                </th>

                <th>
                  Total Qty
                </th>

                <th>
                  Status
                </th>

                <th>
                  Created
                </th>

                <th>
                  Action
                </th>
              </tr>

            </thead>

            <tbody>

              {challans.map(
                (challan) => (

                  <tr
                    key={
                      challan.id
                    }
                  >

                    <td>
                      <strong>
                        {
                          challan.challanNumber
                        }
                      </strong>
                    </td>

                    <td>
                      Customer #
                      {
                        challan.customerId
                      }
                    </td>

                    <td>
                      {
                        challan.totalQuantity
                      }
                    </td>

                    <td>

                      <span
                        className={`badge ${
                          challan.status ===
                          "CONFIRMED"
                            ? "success"
                            : challan.status ===
                              "DRAFT"
                            ? "warning"
                            : "danger"
                        }`}
                      >
                        {
                          challan.status
                        }
                      </span>

                    </td>

                    <td>
                      {challan.createdAt
                        ? new Date(
                            challan.createdAt
                          ).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>

                      {canEdit &&
                      challan.status ===
                        "DRAFT" ? (

                        <button
                          className="small-action"
                          onClick={() =>
                            confirmChallan(
                              challan.id
                            )
                          }
                        >
                          Confirm
                        </button>

                      ) : (
                        "-"
                      )}

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

      </div>

    </div>
  );
}

/* =====================================================
   STOCK
===================================================== */

function Stock({
  canEdit,
}) {

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState("");

  const [
    movementType,
    setMovementType,
  ] = useState("IN");

  const [
    quantity,
    setQuantity,
  ] = useState("");

  const [reason, setReason] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const loadProducts =
    async () => {

      try {

        const data =
          await apiRequest(
            "/products"
          );

        setProducts(
          data.products ||
            data.data ||
            []
        );

      } catch (err) {

        setError(
          err.message
        );
      }
    };

  useEffect(() => {
    loadProducts();
  }, []);

  const submitMovement =
    async (e) => {

      e.preventDefault();

      if (!selectedProduct) {
        setError(
          "Please select a product."
        );
        return;
      }

      try {

        setSaving(true);
        setError("");
        setMessage("");

        await apiRequest(
          `/products/${selectedProduct}/stock`,
          {
            method: "POST",

            body:
              JSON.stringify({
                quantity:
                  Number(
                    quantity
                  ),

                movementType,

                reason,
              }),
          }
        );

        setMessage(
          "Stock movement created successfully."
        );

        setQuantity("");
        setReason("");

        loadProducts();

      } catch (err) {

        setError(
          err.message
        );

      } finally {

        setSaving(false);

      }
    };

  const totalStock =
    products.reduce(
      (total, product) =>
        total +
        Number(
          product.currentStock ||
            0
        ),
      0
    );

  const lowStock =
    products.filter(
      (product) =>
        Number(
          product.currentStock
        ) <=
        Number(
          product.minimumStock
        )
    ).length;

  return (
    <div className="content">

      <div className="page-actions">

        <div>

          <h2>
            Stock Management
          </h2>

          <p>
            Track stock IN and
            OUT movements.
          </p>

        </div>

      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {/* STOCK MOVEMENT */}

      {canEdit && (

        <div className="card">

          <h2>
            Stock Movement
          </h2>

          <p className="muted-text">
            Add incoming stock
            or record outgoing
            stock.
          </p>

          {message && (
            <div className="info-box">
              {message}
            </div>
          )}

          <form
            className="stock-form"
            onSubmit={
              submitMovement
            }
          >

            <select
              value={
                selectedProduct
              }
              onChange={(e) =>
                setSelectedProduct(
                  e.target.value
                )
              }
              required
            >

              <option value="">
                Select Product
              </option>

              {products.map(
                (product) => (
                  <option
                    key={
                      product.id
                    }
                    value={
                      product.id
                    }
                  >
                    {
                      product.name
                    }{" "}
                    — Stock{" "}
                    {
                      product.currentStock
                    }
                  </option>
                )
              )}

            </select>

            <select
              value={
                movementType
              }
              onChange={(e) =>
                setMovementType(
                  e.target.value
                )
              }
            >

              <option value="IN">
                Stock IN
              </option>

              <option value="OUT">
                Stock OUT
              </option>

            </select>

            <input
              type="number"
              min="1"
              placeholder="Quantity"
              value={
                quantity
              }
              onChange={(e) =>
                setQuantity(
                  e.target.value
                )
              }
              required
            />

            <input
              placeholder="Reason"
              value={reason}
              onChange={(e) =>
                setReason(
                  e.target.value
                )
              }
              required
            />

            <button
              className="primary"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Movement"}
            </button>

          </form>

        </div>

      )}

      {/* STOCK STATS */}

      <div className="stats">

        <Stat
          title="Total Stock Units"
          value={totalStock}
          icon="📦"
        />

        <Stat
          title="Products"
          value={
            products.length
          }
          icon="📋"
        />

        <Stat
          title="Low Stock"
          value={lowStock}
          icon="⚠️"
        />

        <Stat
          title="Stock Status"
          value="Live"
          icon="✓"
        />

      </div>

      {/* INVENTORY */}

      <div className="card">

        <h2>
          Current Inventory
        </h2>

        <table>

          <thead>

            <tr>

              <th>
                Product
              </th>

              <th>
                SKU
              </th>

              <th>
                Stock
              </th>

              <th>
                Minimum
              </th>

              <th>
                Warehouse
              </th>

            </tr>

          </thead>

          <tbody>

            {products.map(
              (product) => (

                <tr
                  key={
                    product.id
                  }
                >

                  <td>
                    {
                      product.name
                    }
                  </td>

                  <td>
                    {
                      product.sku
                    }
                  </td>

                  <td>

                    <span
                      className={`stock ${
                        Number(
                          product.currentStock
                        ) <=
                        Number(
                          product.minimumStock
                        )
                          ? "danger"
                          : "good"
                      }`}
                    >
                      {
                        product.currentStock
                      }
                    </span>

                  </td>

                  <td>
                    {
                      product.minimumStock
                    }
                  </td>

                  <td>
                    {
                      product.warehouseLocation
                    }
                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

/* =====================================================
   USERS - ADMIN ONLY
===================================================== */

function Users() {

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {

    apiRequest(
      "/auth/users"
    )
      .then((data) => {

        setUsers(
          data.users || []
        );

      })
      .catch((err) => {

        setError(
          err.message
        );

      })
      .finally(() => {

        setLoading(false);

      });

  }, []);

  return (
    <div className="content">

      <div className="page-actions">

        <div>

          <h2>
            Users
          </h2>

          <p>
            Admin-only user and
            role management.
          </p>

        </div>

      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <div className="card">

        {loading ? (
          <p>
            Loading users...
          </p>
        ) : users.length ===
          0 ? (
          <p>
            No users found.
          </p>
        ) : (

          <table>

            <thead>

              <tr>

                <th>
                  Name
                </th>

                <th>
                  Email
                </th>

                <th>
                  Role
                </th>

                <th>
                  Created
                </th>

              </tr>

            </thead>

            <tbody>

              {users.map(
                (user) => (

                  <tr
                    key={
                      user.id
                    }
                  >

                    <td>
                      <strong>
                        {
                          user.name
                        }
                      </strong>
                    </td>

                    <td>
                      {
                        user.email
                      }
                    </td>

                    <td>

                      <span className="badge success">
                        {
                          user.role
                        }
                      </span>

                    </td>

                    <td>
                      {user.createdAt
                        ? new Date(
                            user.createdAt
                          ).toLocaleDateString()
                        : "-"}
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

      </div>

    </div>
  );
}

export default App;