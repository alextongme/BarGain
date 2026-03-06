/* ============================
   BarGain — SPA Application
   ============================ */

// --- Helpers ---
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function escapeHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function showToast(msg, type) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'error' ? ' toast-error' : '');
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3000);
}

// --- State ---
const state = { user: null };

// --- Map ---
let currentMap = null;
function destroyMap() { if (currentMap) { currentMap.remove(); currentMap = null; } }

function createMap(id, listings, center, zoom) {
  const map = L.map(id).setView([center.lat, center.lng], zoom || 4);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '\u00a9 OpenStreetMap \u00a9 CARTO', maxZoom: 19,
  }).addTo(map);
  (listings || []).forEach(l => {
    if (l.latitude && l.longitude) {
      L.marker([+l.latitude, +l.longitude]).addTo(map)
        .bindPopup('<strong>' + escapeHtml(l.title) + '</strong><br>$' + escapeHtml(String(l.price)) + '<br><a href="#/listing/' + l._id + '">View Details</a>');
    }
  });
  currentMap = map;
  return map;
}

// --- Geolocation ---
function getLocation() {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve({ lat: 40.7128, lng: -74.006 }); return; }
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve({ lat: 40.7128, lng: -74.006 }),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

// --- Categories ---
const CATEGORIES = {
  electronics: 'Electronics',
  cars: 'Cars & Motors',
  sports: 'Sports & Games',
  home: 'Home & Garden',
  media: 'Books & Music',
  fashion: 'Fashion',
  baby: 'Baby & Child',
  other: 'Other',
};

// --- Router ---
class Router {
  constructor() {
    this.routes = [];
    window.addEventListener('hashchange', () => this.resolve());
  }
  on(pattern, handler) { this.routes.push({ pattern, handler }); return this; }
  navigate(path) { location.hash = path; }
  resolve() {
    destroyMap();
    const hash = location.hash.slice(1) || '/';
    const [path, qs] = hash.split('?');
    const query = Object.fromEntries(new URLSearchParams(qs || ''));
    for (const r of this.routes) {
      const params = this._match(r.pattern, path);
      if (params) { r.handler(params, query); return; }
    }
    if (this.routes[0]) this.routes[0].handler({}, {});
  }
  _match(pattern, path) {
    const pp = pattern.split('/'), hp = path.split('/');
    if (pp.length !== hp.length) return null;
    const params = {};
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(':')) params[pp[i].slice(1)] = hp[i];
      else if (pp[i] !== hp[i]) return null;
    }
    return params;
  }
}

// --- Render ---
function render(html, onMount) {
  $('#app').innerHTML = html;
  window.scrollTo(0, 0);
  if (onMount) requestAnimationFrame(() => requestAnimationFrame(onMount));
}

function requireAuth(fn) {
  return (...args) => {
    if (!state.user) { showToast('Please log in first', 'error'); router.navigate('/login'); return; }
    fn(...args);
  };
}

// --- Components ---
function navbar(active) {
  const u = state.user;
  return '<nav class="nav">' +
    '<a href="#/" class="nav-logo">BarGain</a>' +
    '<button class="nav-toggle" onclick="document.querySelector(\'.nav\').classList.toggle(\'open\')">' +
      '<span></span><span></span><span></span>' +
    '</button>' +
    '<ul class="nav-links">' +
      (u ? '<li><a href="#/sell"' + (active === 'sell' ? ' class="active"' : '') + '>BarSell</a></li>' : '') +
      '<li><a href="#/browse"' + (active === 'browse' ? ' class="active"' : '') + '>BarBuy</a></li>' +
      '<li><a href="#/about"' + (active === 'about' ? ' class="active"' : '') + '>About</a></li>' +
      (u ? '<li><a href="#/profile"' + (active === 'profile' ? ' class="active"' : '') + '>Account</a></li>'
         : '<li><a href="#/login">Login</a></li>') +
    '</ul>' +
    '<form class="nav-search" onsubmit="event.preventDefault();location.hash=\'/search?q=\'+encodeURIComponent(this.q.value)">' +
      '<input class="nav-search-input" name="q" type="text" placeholder="Search listings...">' +
    '</form>' +
  '</nav>';
}

function listingCard(l) {
  return '<a href="#/listing/' + l._id + '" class="card listing-card">' +
    '<span class="card-category">' + escapeHtml(CATEGORIES[l.category] || l.category) + '</span>' +
    '<h3 class="card-title">' + escapeHtml(l.title) + '</h3>' +
    '<p class="card-price">$' + escapeHtml(String(l.price)) + '</p>' +
    '<p class="card-desc">' + escapeHtml(l.description) + '</p>' +
    '<div class="card-footer">' +
      '<span>' + escapeHtml(l.username) + '</span>' +
      '<span>' + (l.favoriteUsers ? l.favoriteUsers.length : 0) + ' watching</span>' +
    '</div>' +
  '</a>';
}

function categoryOptions(selected) {
  return '<option value="">Select a category</option>' +
    Object.entries(CATEGORIES).map(function(e) {
      return '<option value="' + e[0] + '"' + (selected === e[0] ? ' selected' : '') + '>' + e[1] + '</option>';
    }).join('');
}

// =====================
//       PAGES
// =====================

function landingPage() {
  if (state.user) { router.navigate('/browse'); return; }
  render(
    '<div class="page page-full">' +
      '<div class="hero">' +
        '<video class="hero-video" playsinline autoplay muted loop>' +
          '<source src="/videos/nyc.mp4" type="video/mp4">' +
        '</video>' +
        '<div class="hero-content">' +
          '<h1 class="hero-title">BarGain</h1>' +
          '<p class="hero-subtitle">The marketplace around you</p>' +
          '<div class="diamond-sep"><span>&#9670;</span></div>' +
          '<div class="hero-ctas">' +
            '<a href="#/signup" class="btn btn-gold">Sign Up</a>' +
            '<a href="#/login" class="btn btn-outline">Log In</a>' +
          '</div>' +
        '</div>' +
        '<div class="hero-scroll">' +
          '<span>Discover</span>' +
          '<div class="hero-scroll-line"></div>' +
        '</div>' +
      '</div>' +
      '<section class="how-section">' +
        '<div class="container">' +
          '<div class="diamond-sep"><span>&#9670;</span></div>' +
          '<h2>How It Works</h2>' +
          '<div class="how-steps">' +
            '<div class="how-step">' +
              '<span class="how-step-num">01</span>' +
              '<h3>Browse</h3>' +
              '<p>Explore items listed by sellers near you, all plotted on a live map.</p>' +
            '</div>' +
            '<div class="how-step">' +
              '<span class="how-step-num">02</span>' +
              '<h3>Connect</h3>' +
              '<p>View details and contact sellers directly. Save favorites to your profile.</p>' +
            '</div>' +
            '<div class="how-step">' +
              '<span class="how-step-num">03</span>' +
              '<h3>BarGain</h3>' +
              '<p>Negotiate and close deals with people in your area. Everyone wins.</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +
    '</div>'
  );
}

function loginPage() {
  render(
    '<div class="page auth-page">' +
      '<div class="auth-card card">' +
        '<h1>Welcome Back</h1>' +
        '<p class="subtitle">Ready to start BarGaining?</p>' +
        '<div class="auth-error" id="authError"></div>' +
        '<form id="loginForm">' +
          '<div class="form-group">' +
            '<label class="form-label">Username</label>' +
            '<input class="form-input" name="username" type="text" placeholder="Enter your username" required>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">Password</label>' +
            '<input class="form-input" name="password" type="password" placeholder="Enter your password" required>' +
          '</div>' +
          '<button class="btn btn-gold" type="submit" style="width:100%">Log In</button>' +
        '</form>' +
        '<p class="auth-footer">Don\'t have an account? <a href="#/signup">Sign up</a></p>' +
      '</div>' +
    '</div>',
    function() {
      $('#loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        var btn = this.querySelector('button');
        btn.textContent = 'Logging in...'; btn.disabled = true;
        try {
          state.user = await API.login(this.username.value, this.password.value);
          showToast('Welcome back, ' + state.user.username + '!');
          router.navigate('/browse');
        } catch (err) {
          var el = $('#authError'); el.textContent = err.message; el.classList.add('show');
          btn.textContent = 'Log In'; btn.disabled = false;
        }
      });
    }
  );
}

function signupPage() {
  render(
    '<div class="page auth-page">' +
      '<div class="auth-card card">' +
        '<h1>Join BarGain</h1>' +
        '<p class="subtitle">Start buying and selling for free.</p>' +
        '<div class="auth-error" id="authError"></div>' +
        '<form id="signupForm">' +
          '<div class="form-group"><label class="form-label">Full Name</label>' +
            '<input class="form-input" name="fullname" type="text" placeholder="Your full name" required></div>' +
          '<div class="form-group"><label class="form-label">Username</label>' +
            '<input class="form-input" name="username" type="text" placeholder="Choose a username" required></div>' +
          '<div class="form-group"><label class="form-label">Email</label>' +
            '<input class="form-input" name="email" type="email" placeholder="your@email.com" required></div>' +
          '<div class="form-group"><label class="form-label">Phone</label>' +
            '<input class="form-input" name="tel" type="tel" placeholder="Your phone number"></div>' +
          '<div class="form-group"><label class="form-label">Password</label>' +
            '<input class="form-input" name="password" type="password" placeholder="Create a password" required></div>' +
          '<button class="btn btn-gold" type="submit" style="width:100%">Create Account</button>' +
        '</form>' +
        '<p class="auth-footer">Already have an account? <a href="#/login">Log in</a></p>' +
      '</div>' +
    '</div>',
    function() {
      $('#signupForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        var btn = this.querySelector('button');
        btn.textContent = 'Creating account...'; btn.disabled = true;
        try {
          await API.signup({
            fullname: this.fullname.value, username: this.username.value,
            email: this.email.value, tel: this.tel.value, password: this.password.value,
          });
          showToast('Account created! Please log in.');
          router.navigate('/login');
        } catch (err) {
          var el = $('#authError'); el.textContent = err.message; el.classList.add('show');
          btn.textContent = 'Create Account'; btn.disabled = false;
        }
      });
    }
  );
}

function browsePage() {
  render(
    '<div class="page">' + navbar('browse') +
      '<div id="map" class="map-container"></div>' +
      '<section class="listings-section"><div class="container">' +
        '<h2>All Listings</h2>' +
        '<div class="diamond-sep"><span>&#9670;</span></div>' +
        '<div id="grid" class="listings-grid"><div class="loader"></div></div>' +
      '</div></section>' +
    '</div>',
    async function() {
      try {
        var listings = await API.getListings();
        var loc = await getLocation();
        createMap('map', listings, loc, listings.length ? 4 : 12);
        var grid = $('#grid');
        grid.innerHTML = listings.length
          ? listings.map(listingCard).join('')
          : '<div class="empty"><div class="empty-icon">&#9671;</div><p>No listings yet. Be the first to sell something!</p></div>';
      } catch (err) {
        $('#grid').innerHTML = '<div class="empty"><p>Could not load listings.</p></div>';
      }
    }
  );
}

function searchPage(params, query) {
  var q = query.q || '';
  render(
    '<div class="page">' + navbar('browse') +
      '<div id="map" class="map-container"></div>' +
      '<section class="listings-section"><div class="container">' +
        '<h2>Results for "' + escapeHtml(q) + '"</h2>' +
        '<div class="diamond-sep"><span>&#9670;</span></div>' +
        '<div id="grid" class="listings-grid"><div class="loader"></div></div>' +
      '</div></section>' +
    '</div>',
    async function() {
      try {
        var listings = await API.searchListings(q);
        var loc = await getLocation();
        createMap('map', listings, loc, 10);
        var grid = $('#grid');
        grid.innerHTML = listings.length
          ? listings.map(listingCard).join('')
          : '<div class="empty"><div class="empty-icon">&#9671;</div><p>No results for "' + escapeHtml(q) + '"</p></div>';
      } catch (err) {
        $('#grid').innerHTML = '<div class="empty"><p>Search failed. Please try again.</p></div>';
      }
    }
  );
}

function listingDetailPage(params) {
  render(
    '<div class="page">' + navbar() +
      '<section class="detail-page"><div class="container" id="detail"><div class="loader"></div></div></section>' +
    '</div>',
    async function() {
      try {
        var l = await API.getListing(params.id);
        $('#detail').innerHTML =
          '<div class="detail-grid">' +
            '<div class="detail-main">' +
              '<span class="detail-category">' + escapeHtml(CATEGORIES[l.category] || l.category) + '</span>' +
              '<h1 class="detail-title">' + escapeHtml(l.title) + '</h1>' +
              '<p class="detail-price">$' + escapeHtml(String(l.price)) + '</p>' +
              '<p class="detail-desc">' + escapeHtml(l.description) + '</p>' +
              '<div class="detail-meta">' +
                '<div class="detail-meta-item"><div class="detail-meta-label">Quantity</div><div class="detail-meta-value">' + escapeHtml(String(l.quantity || 1)) + '</div></div>' +
                '<div class="detail-meta-item"><div class="detail-meta-label">Seller</div><div class="detail-meta-value">' + escapeHtml(l.username) + '</div></div>' +
                '<div class="detail-meta-item"><div class="detail-meta-label">Email</div><div class="detail-meta-value">' + escapeHtml(l.email || 'N/A') + '</div></div>' +
                '<div class="detail-meta-item"><div class="detail-meta-label">Phone</div><div class="detail-meta-value">' + escapeHtml(l.tel || 'N/A') + '</div></div>' +
              '</div>' +
            '</div>' +
            '<div class="detail-sidebar"><div class="card">' +
              '<h3>Location</h3>' +
              '<div id="detailMap" class="detail-map"></div>' +
              '<div class="detail-actions">' +
                (state.user
                  ? '<button class="btn btn-gold btn-sm" id="favBtn">Save to Favorites</button>'
                  : '<a href="#/login" class="btn btn-outline btn-sm">Log in to Save</a>') +
                '<a href="#/browse" class="btn btn-outline btn-sm">Back</a>' +
              '</div>' +
              '<div class="detail-watchers">' + (l.favoriteUsers ? l.favoriteUsers.length : 0) + ' people watching this item</div>' +
            '</div></div>' +
          '</div>';

        if (l.latitude && l.longitude) {
          var map = L.map('detailMap').setView([+l.latitude, +l.longitude], 14);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '\u00a9 OSM \u00a9 CARTO',
          }).addTo(map);
          L.marker([+l.latitude, +l.longitude]).addTo(map);
          currentMap = map;
        }

        var favBtn = $('#favBtn');
        if (favBtn) {
          favBtn.addEventListener('click', async function() {
            try {
              await API.addFavorite(l._id);
              this.textContent = 'Saved!'; this.disabled = true;
              showToast('Added to favorites');
            } catch (err) { showToast(err.message, 'error'); }
          });
        }
      } catch (err) {
        $('#detail').innerHTML = '<div class="empty"><p>Could not load listing.</p></div>';
      }
    }
  );
}

var sellPage = requireAuth(function() {
  render(
    '<div class="page">' + navbar('sell') +
      '<section class="form-page"><div class="container"><div class="card form-card">' +
        '<h1>Create Listing</h1>' +
        '<p class="subtitle">What are you selling today?</p>' +
        '<div id="locInfo" class="form-location"><strong>Detecting your location...</strong></div>' +
        '<form id="sellForm">' +
          '<input type="hidden" name="latitude" id="lat"><input type="hidden" name="longitude" id="lng">' +
          '<div class="form-group"><label class="form-label">Title</label>' +
            '<input class="form-input" name="title" type="text" placeholder="What are you selling?" required></div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label class="form-label">Price ($)</label>' +
              '<input class="form-input" name="price" type="number" min="0" step="0.01" placeholder="0.00" required></div>' +
            '<div class="form-group"><label class="form-label">Quantity</label>' +
              '<input class="form-input" name="quantity" type="number" min="1" value="1" required></div>' +
          '</div>' +
          '<div class="form-group"><label class="form-label">Description</label>' +
            '<textarea class="form-textarea" name="description" placeholder="Describe your item..." required></textarea></div>' +
          '<div class="form-group"><label class="form-label">Category</label>' +
            '<select class="form-select" name="category" required>' + categoryOptions() + '</select></div>' +
          '<button class="btn btn-gold" type="submit" style="width:100%">Publish Listing</button>' +
        '</form>' +
      '</div></div></section>' +
    '</div>',
    async function() {
      var loc = await getLocation();
      $('#lat').value = loc.lat; $('#lng').value = loc.lng;
      $('#locInfo').innerHTML = '<strong>Location detected:</strong> ' + loc.lat.toFixed(4) + ', ' + loc.lng.toFixed(4);
      $('#sellForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        var btn = this.querySelector('button');
        btn.textContent = 'Publishing...'; btn.disabled = true;
        try {
          await API.createListing({
            title: this.title.value, price: this.price.value, quantity: this.quantity.value,
            description: this.description.value, category: this.category.value,
            latitude: this.latitude.value, longitude: this.longitude.value,
          });
          showToast('Listing published!');
          router.navigate('/browse');
        } catch (err) {
          showToast(err.message, 'error');
          btn.textContent = 'Publish Listing'; btn.disabled = false;
        }
      });
    }
  );
});

var editPage = requireAuth(function(params) {
  render(
    '<div class="page">' + navbar() +
      '<section class="form-page"><div class="container"><div class="card form-card" id="editContent">' +
        '<div class="loader"></div>' +
      '</div></div></section>' +
    '</div>',
    async function() {
      try {
        var l = await API.getListing(params.id);
        $('#editContent').innerHTML =
          '<h1>Edit Listing</h1><p class="subtitle">Update your listing details.</p>' +
          '<form id="editForm">' +
            '<div class="form-group"><label class="form-label">Title</label>' +
              '<input class="form-input" name="title" type="text" value="' + escapeHtml(l.title) + '" required></div>' +
            '<div class="form-row">' +
              '<div class="form-group"><label class="form-label">Price ($)</label>' +
                '<input class="form-input" name="price" type="number" min="0" step="0.01" value="' + l.price + '" required></div>' +
              '<div class="form-group"><label class="form-label">Quantity</label>' +
                '<input class="form-input" name="quantity" type="number" min="1" value="' + (l.quantity || 1) + '" required></div>' +
            '</div>' +
            '<div class="form-group"><label class="form-label">Description</label>' +
              '<textarea class="form-textarea" name="description" required>' + escapeHtml(l.description) + '</textarea></div>' +
            '<div class="form-group"><label class="form-label">Category</label>' +
              '<select class="form-select" name="category" required>' + categoryOptions(l.category) + '</select></div>' +
            '<div style="display:flex;gap:0.75rem">' +
              '<button class="btn btn-gold" type="submit" style="flex:1">Update Listing</button>' +
              '<a href="#/profile" class="btn btn-outline">Cancel</a>' +
            '</div>' +
          '</form>';
        $('#editForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          var btn = this.querySelector('button');
          btn.textContent = 'Updating...'; btn.disabled = true;
          try {
            await API.updateListing(params.id, {
              title: this.title.value, price: this.price.value, quantity: this.quantity.value,
              description: this.description.value, category: this.category.value,
            });
            showToast('Listing updated!');
            router.navigate('/profile');
          } catch (err) {
            showToast(err.message, 'error');
            btn.textContent = 'Update Listing'; btn.disabled = false;
          }
        });
      } catch (err) {
        $('#editContent').innerHTML = '<div class="empty"><p>Could not load listing.</p></div>';
      }
    }
  );
});

var profilePage = requireAuth(function() {
  render(
    '<div class="page">' + navbar('profile') +
      '<div class="container" id="profileContent"><div class="loader"></div></div>' +
    '</div>',
    async function() {
      try {
        var data = await API.getProfile();
        var u = data.user, listings = data.listings, favs = data.favorites;
        $('#profileContent').innerHTML =
          '<div class="profile-header">' +
            '<div class="profile-greeting"><h1>Hello, ' + escapeHtml(u.username) + '</h1><p>' + escapeHtml(u.email || '') + '</p></div>' +
            '<button class="btn btn-outline btn-sm" id="logoutBtn">Logout</button>' +
          '</div>' +
          '<div class="diamond-sep"><span>&#9670;</span></div>' +
          '<div class="profile-tabs">' +
            '<button class="profile-tab active" data-tab="listings">My Listings (' + listings.length + ')</button>' +
            '<button class="profile-tab" data-tab="favorites">Favorites (' + favs.length + ')</button>' +
          '</div>' +
          '<div id="tabContent">' +
            '<div id="tab-listings">' +
              (listings.length === 0
                ? '<div class="empty"><p>You haven\'t listed anything yet.</p><a href="#/sell" class="btn btn-gold" style="margin-top:1rem">Create Listing</a></div>'
                : listings.map(function(l) {
                    return '<div class="profile-listing-card"><div class="profile-listing-info">' +
                      '<h3>' + escapeHtml(l.title) + '</h3>' +
                      '<p class="price">$' + l.price + '</p>' +
                      '<p>' + escapeHtml(CATEGORIES[l.category] || l.category) + ' &middot; ' + (l.favoriteUsers ? l.favoriteUsers.length : 0) + ' watching</p>' +
                    '</div><div class="profile-listing-actions">' +
                      '<a href="#/edit/' + l._id + '" class="btn btn-outline btn-sm">Edit</a>' +
                      '<button class="btn btn-danger" data-delete="' + l._id + '">Delete</button>' +
                    '</div></div>';
                  }).join('')) +
            '</div>' +
            '<div id="tab-favorites" style="display:none">' +
              (favs.length === 0
                ? '<div class="empty"><p>No favorites yet.</p><a href="#/browse" class="btn btn-gold" style="margin-top:1rem">Browse Listings</a></div>'
                : favs.map(function(f) {
                    var isObj = typeof f === 'object' && f;
                    return '<div class="profile-listing-card"><div class="profile-listing-info">' +
                      '<h3>' + (isObj ? escapeHtml(f.title) : escapeHtml(String(f))) + '</h3>' +
                      (isObj && f.price ? '<p class="price">$' + f.price + '</p>' : '') +
                    '</div><div class="profile-listing-actions">' +
                      (isObj && f._id ? '<a href="#/listing/' + f._id + '" class="btn btn-outline btn-sm">View</a>' : '') +
                      '<button class="btn btn-danger" data-unfav="' + (isObj ? f._id : f) + '">Remove</button>' +
                    '</div></div>';
                  }).join('')) +
            '</div>' +
          '</div>';

        // Logout
        $('#logoutBtn').addEventListener('click', async function() {
          await API.logout(); state.user = null;
          showToast('Logged out'); router.navigate('/');
        });

        // Tabs
        $$('.profile-tab').forEach(function(tab) {
          tab.addEventListener('click', function() {
            $$('.profile-tab').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            var t = tab.dataset.tab;
            $('#tab-listings').style.display = t === 'listings' ? 'block' : 'none';
            $('#tab-favorites').style.display = t === 'favorites' ? 'block' : 'none';
          });
        });

        // Delete listing
        $$('[data-delete]').forEach(function(btn) {
          btn.addEventListener('click', async function() {
            if (!confirm('Delete this listing?')) return;
            try { await API.deleteListing(btn.dataset.delete); showToast('Listing deleted'); profilePage(); }
            catch (err) { showToast(err.message, 'error'); }
          });
        });

        // Remove favorite
        $$('[data-unfav]').forEach(function(btn) {
          btn.addEventListener('click', async function() {
            try { await API.removeFavorite(btn.dataset.unfav); showToast('Removed from favorites'); profilePage(); }
            catch (err) { showToast(err.message, 'error'); }
          });
        });
      } catch (err) {
        $('#profileContent').innerHTML = '<div class="empty"><p>Could not load profile.</p></div>';
      }
    }
  );
});

function aboutPage() {
  render(
    '<div class="page">' + navbar('about') +
      '<section class="about-page"><div class="container">' +
        '<div class="diamond-sep"><span>&#9670;</span></div>' +
        '<h1>About BarGain</h1>' +
        '<p class="lead">BarGain is a local marketplace that connects buyers and sellers in your area. ' +
          'Browse items on a live map, connect with sellers, and get the best deals &mdash; ' +
          'all without leaving your neighborhood.</p>' +
        '<div class="diamond-sep"><span>&#9670; &#9670; &#9670;</span></div>' +
        '<div class="how-steps" style="margin-top:2rem">' +
          '<div class="how-step"><h3>BarBuy</h3><p>Search and browse thousands of listings from sellers near you. Save your favorites and track price changes.</p></div>' +
          '<div class="how-step"><h3>BarSell</h3><p>List your items in seconds. Your listing appears on the map and is instantly visible to nearby buyers.</p></div>' +
          '<div class="how-step"><h3>BarGain</h3><p>Connect directly with buyers and sellers. No middleman, no fees &mdash; just great deals in your community.</p></div>' +
        '</div>' +
      '</div></section>' +
    '</div>'
  );
}

// =====================
//       INIT
// =====================
var router = new Router();
router
  .on('/', landingPage)
  .on('/login', loginPage)
  .on('/signup', signupPage)
  .on('/browse', browsePage)
  .on('/search', searchPage)
  .on('/listing/:id', listingDetailPage)
  .on('/sell', sellPage)
  .on('/edit/:id', editPage)
  .on('/profile', profilePage)
  .on('/about', aboutPage);

(async function init() {
  try { state.user = await API.me(); } catch (e) { /* not logged in */ }
  router.resolve();
})();
