/* ============================
   BarGain — SPA Application
   ============================ */

// --- Helpers ---
var $ = function(s) { return document.querySelector(s); };
var $$ = function(s) { return document.querySelectorAll(s); };

function escapeHtml(str) {
  if (!str) return '';
  var d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function showToast(msg, type) {
  var old = document.querySelector('.toast');
  if (old) old.remove();
  var el = document.createElement('div');
  el.className = 'toast' + (type === 'error' ? ' toast-error' : '');
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(function() { el.classList.add('show'); });
  setTimeout(function() { el.classList.remove('show'); setTimeout(function() { el.remove(); }, 400); }, 3000);
}

// --- State ---
var state = { user: null };

// --- Map ---
var currentMap = null;
function destroyMap() { if (currentMap) { currentMap.remove(); currentMap = null; } }

function createMap(id, listings, center, zoom) {
  var map = L.map(id).setView([center.lat, center.lng], zoom || 4);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '\u00a9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19,
  }).addTo(map);
  (listings || []).forEach(function(l) {
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
  return new Promise(function(resolve) {
    if (!navigator.geolocation) { resolve({ lat: 40.7128, lng: -74.006 }); return; }
    navigator.geolocation.getCurrentPosition(
      function(p) { resolve({ lat: p.coords.latitude, lng: p.coords.longitude }); },
      function() { resolve({ lat: 40.7128, lng: -74.006 }); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

// --- Categories ---
var CATEGORIES = {
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
function Router() {
  this.routes = [];
  var self = this;
  window.addEventListener('hashchange', function() { self.resolve(); });
}
Router.prototype.on = function(pattern, handler) { this.routes.push({ pattern: pattern, handler: handler }); return this; };
Router.prototype.navigate = function(path) { location.hash = path; };
Router.prototype.resolve = function() {
  destroyMap();
  var hash = location.hash.slice(1) || '/';
  var parts = hash.split('?');
  var path = parts[0];
  var query = {};
  if (parts[1]) {
    var sp = new URLSearchParams(parts[1]);
    sp.forEach(function(v, k) { query[k] = v; });
  }
  for (var i = 0; i < this.routes.length; i++) {
    var params = this._match(this.routes[i].pattern, path);
    if (params) { this.routes[i].handler(params, query); return; }
  }
  if (this.routes[0]) this.routes[0].handler({}, {});
};
Router.prototype._match = function(pattern, path) {
  var pp = pattern.split('/'), hp = path.split('/');
  if (pp.length !== hp.length) return null;
  var params = {};
  for (var i = 0; i < pp.length; i++) {
    if (pp[i].charAt(0) === ':') params[pp[i].slice(1)] = hp[i];
    else if (pp[i] !== hp[i]) return null;
  }
  return params;
};

// --- Corner Links ---
var cornerLinksHtml =
  '<div class="corner-links">' +
    '<a href="https://alextong.me/" target="_blank" rel="noopener" title="Home">' +
      '<img src="/images/count_circle.png" alt="Home" width="28" height="28">' +
    '</a>' +
    '<a href="https://github.com/alextongme/" target="_blank" rel="noopener" title="GitHub">' +
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>' +
    '</a>' +
  '</div>';

// --- Render ---
function render(html, onMount) {
  $('#app').innerHTML = html + cornerLinksHtml;
  window.scrollTo(0, 0);
  if (onMount) requestAnimationFrame(function() { requestAnimationFrame(onMount); });
}

function requireAuth(fn) {
  return function() {
    var args = arguments;
    if (!state.user) { showToast('Please log in first', 'error'); router.navigate('/login'); return; }
    fn.apply(null, args);
  };
}

// --- Components ---
function navbar(active) {
  var u = state.user;
  return '<nav class="nav">' +
    '<a href="#/" class="nav-logo">BarGain</a>' +
    '<button class="nav-toggle" onclick="document.querySelector(\'.nav\').classList.toggle(\'open\')">' +
      '<span></span><span></span><span></span>' +
    '</button>' +
    '<ul class="nav-links">' +
      (u ? '<li><a href="#/sell"' + (active === 'sell' ? ' class="active"' : '') + '>Sell</a></li>' : '') +
      '<li><a href="#/browse"' + (active === 'browse' ? ' class="active"' : '') + '>Browse</a></li>' +
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
  var imgHtml = (l.images && l.images.length)
    ? '<img class="card-image" src="' + l.images[0] + '" alt="">'
    : '<div class="card-no-image"><svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>';

  return '<a href="#/listing/' + l._id + '" class="card listing-card">' +
    imgHtml +
    '<div class="card-body">' +
      '<span class="card-category">' + escapeHtml(CATEGORIES[l.category] || l.category) + '</span>' +
      '<h3 class="card-title">' + escapeHtml(l.title) + '</h3>' +
      '<p class="card-price">$' + escapeHtml(String(l.price)) + '</p>' +
      '<p class="card-desc">' + escapeHtml(l.description) + '</p>' +
      '<div class="card-footer">' +
        '<span>' + escapeHtml(l.username) + '</span>' +
        '<span>' + (l.favoriteUsers ? l.favoriteUsers.length : 0) + ' watching</span>' +
      '</div>' +
    '</div>' +
  '</a>';
}

function categoryOptions(selected) {
  return '<option value="">Select a category</option>' +
    Object.keys(CATEGORIES).map(function(key) {
      return '<option value="' + key + '"' + (selected === key ? ' selected' : '') + '>' + CATEGORIES[key] + '</option>';
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
          '<div class="hero-badge"><span class="hero-badge-dot"></span> Local marketplace</div>' +
          '<h1 class="hero-title">Buy & Sell<br><span class="hero-title-accent">Around You</span></h1>' +
          '<p class="hero-subtitle">The easiest way to find great deals in your neighborhood. Browse listings on a live map, connect with sellers, and score amazing bargains.</p>' +
          '<div class="hero-ctas">' +
            '<a href="#/signup" class="btn btn-coral btn-lg">Get Started</a>' +
            '<a href="#/login" class="btn btn-outline btn-lg">Log In</a>' +
          '</div>' +
          '<button class="btn demo-btn" id="heroDemo">or try a demo account</button>' +
        '</div>' +
        '<div class="hero-scroll" onclick="document.querySelector(\'.how-section\').scrollIntoView({behavior:\'smooth\'})">' +
          '<span>Scroll</span>' +
          '<svg class="hero-scroll-chevron" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>' +
        '</div>' +
      '</div>' +
      '<section class="how-section">' +
        '<div class="container">' +
          '<h2>How BarGain Works</h2>' +
          '<p class="how-section-sub">Three simple steps to start buying and selling locally</p>' +
          '<div class="how-steps">' +
            '<div class="how-step">' +
              '<div class="how-step-icon">' +
                '<svg width="24" height="24" fill="none" stroke="#E8613C" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>' +
              '</div>' +
              '<h3>Browse</h3>' +
              '<p>Explore items listed by sellers near you, all plotted on a live interactive map.</p>' +
            '</div>' +
            '<div class="how-step">' +
              '<div class="how-step-icon">' +
                '<svg width="24" height="24" fill="none" stroke="#E8613C" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' +
              '</div>' +
              '<h3>Connect</h3>' +
              '<p>View details and contact sellers directly. Save your favorites to come back later.</p>' +
            '</div>' +
            '<div class="how-step">' +
              '<div class="how-step-icon">' +
                '<svg width="24" height="24" fill="none" stroke="#E8613C" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' +
              '</div>' +
              '<h3>BarGain</h3>' +
              '<p>Negotiate and close deals with people in your area. No fees, no middleman.</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +
    '</div>',
    function() {
      var btn = $('#heroDemo');
      if (btn) {
        btn.addEventListener('click', async function() {
          this.textContent = 'Logging in...'; this.disabled = true;
          try {
            state.user = await API.demo();
            showToast('Welcome, demo user!');
            router.navigate('/browse');
          } catch (err) { showToast(err.message, 'error'); this.textContent = 'or try a demo account'; this.disabled = false; }
        });
      }
    }
  );
}

function loginPage() {
  render(
    '<div class="page auth-page">' +
      '<div class="auth-card">' +
        '<h1>Welcome back</h1>' +
        '<p class="subtitle">Log in to your BarGain account</p>' +
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
          '<button class="btn btn-coral" type="submit" style="width:100%">Log In</button>' +
        '</form>' +
        '<button class="btn btn-outline btn-sm" id="loginDemo" style="width:100%;margin-top:0.75rem">Try Demo Account</button>' +
        '<p class="auth-footer">Don\'t have an account? <a href="#/signup">Sign up</a></p>' +
      '</div>' +
    '</div>',
    function() {
      $('#loginDemo').addEventListener('click', async function() {
        this.textContent = 'Logging in...'; this.disabled = true;
        try {
          state.user = await API.demo();
          showToast('Welcome, demo user!');
          router.navigate('/browse');
        } catch (err) { showToast(err.message, 'error'); this.textContent = 'Try Demo Account'; this.disabled = false; }
      });
      $('#loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        var btn = this.querySelector('button[type="submit"]');
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
      '<div class="auth-card">' +
        '<h1>Create your account</h1>' +
        '<p class="subtitle">Join BarGain and start buying & selling for free</p>' +
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
          '<button class="btn btn-coral" type="submit" style="width:100%">Create Account</button>' +
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
        '<div class="section-header">' +
          '<h2>All Listings</h2>' +
        '</div>' +
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
          : '<div class="empty"><div class="empty-icon"><svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div><p>No listings yet. Be the first to sell something!</p></div>';
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
        '<div class="section-header">' +
          '<h2>Results for "' + escapeHtml(q) + '"</h2>' +
        '</div>' +
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
          : '<div class="empty"><div class="empty-icon"><svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></div><p>No results for "' + escapeHtml(q) + '"</p></div>';
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
        var imagesHtml = '';
        if (l.images && l.images.length) {
          imagesHtml = '<div class="detail-images">' + l.images.map(function(src) { return '<img src="' + src + '" alt="">'; }).join('') + '</div>';
        }

        $('#detail').innerHTML =
          '<a href="#/browse" class="detail-back"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg> Back to listings</a>' +
          '<div class="detail-grid">' +
            '<div class="detail-main">' +
              imagesHtml +
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
            '<div class="detail-sidebar"><div class="card" style="padding:1.75rem">' +
              '<h3>Location</h3>' +
              '<div id="detailMap" class="detail-map"></div>' +
              '<div class="detail-actions">' +
                (state.user
                  ? '<button class="btn btn-coral btn-sm" id="favBtn"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Save</button>'
                  : '<a href="#/login" class="btn btn-outline btn-sm">Log in to Save</a>') +
                '<a href="#/browse" class="btn btn-outline btn-sm">Back</a>' +
              '</div>' +
              '<div class="detail-watchers"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> ' + (l.favoriteUsers ? l.favoriteUsers.length : 0) + ' people watching</div>' +
            '</div></div>' +
          '</div>';

        if (l.latitude && l.longitude) {
          var map = L.map('detailMap').setView([+l.latitude, +l.longitude], 14);
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '\u00a9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(map);
          L.marker([+l.latitude, +l.longitude]).addTo(map);
          currentMap = map;
        }

        var favBtn = $('#favBtn');
        if (favBtn) {
          favBtn.addEventListener('click', async function() {
            try {
              await API.addFavorite(l._id);
              this.innerHTML = '<svg width="14" height="14" fill="currentColor" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Saved!'; this.disabled = true;
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
            '<textarea class="form-textarea" name="description" placeholder="Describe your item in detail..." required></textarea></div>' +
          '<div class="form-group"><label class="form-label">Category</label>' +
            '<select class="form-select" name="category" required>' + categoryOptions() + '</select></div>' +
          '<div class="form-group"><label class="form-label">Images (up to 5)</label>' +
            '<input class="form-input form-file-input" type="file" name="images" accept="image/*" multiple>' +
            '<div id="imagePreview" class="image-preview"></div></div>' +
          '<button class="btn btn-coral" type="submit" style="width:100%">Publish Listing</button>' +
        '</form>' +
      '</div></div></section>' +
    '</div>',
    async function() {
      var loc = await getLocation();
      $('#lat').value = loc.lat; $('#lng').value = loc.lng;
      $('#locInfo').innerHTML = '<strong>Location detected:</strong> ' + loc.lat.toFixed(4) + ', ' + loc.lng.toFixed(4);
      var fileInput = $('input[name="images"]');
      fileInput.addEventListener('change', function() {
        var preview = $('#imagePreview');
        preview.innerHTML = '';
        Array.from(this.files).slice(0, 5).forEach(function(file) {
          var reader = new FileReader();
          reader.onload = function(e) {
            var img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'width:80px;height:80px;object-fit:cover;border:1px solid #E5E0DA;border-radius:8px';
            preview.appendChild(img);
          };
          reader.readAsDataURL(file);
        });
      });
      $('#sellForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        var btn = this.querySelector('button[type="submit"]');
        btn.textContent = 'Publishing...'; btn.disabled = true;
        try {
          var fd = new FormData();
          fd.append('title', this.title.value);
          fd.append('price', this.price.value);
          fd.append('quantity', this.quantity.value);
          fd.append('description', this.description.value);
          fd.append('category', this.category.value);
          fd.append('latitude', this.latitude.value);
          fd.append('longitude', this.longitude.value);
          Array.from(fileInput.files).slice(0, 5).forEach(function(f) { fd.append('images', f); });
          await API.createListing(fd);
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
          '<h1>Edit Listing</h1><p class="subtitle">Update your listing details</p>' +
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
              '<button class="btn btn-coral" type="submit" style="flex:1">Update Listing</button>' +
              '<a href="#/profile" class="btn btn-outline">Cancel</a>' +
            '</div>' +
          '</form>';
        $('#editForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          var btn = this.querySelector('button[type="submit"]');
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
            '<button class="btn btn-outline btn-sm" id="logoutBtn">Log out</button>' +
          '</div>' +
          '<div class="profile-tabs">' +
            '<button class="profile-tab active" data-tab="listings">My Listings (' + listings.length + ')</button>' +
            '<button class="profile-tab" data-tab="favorites">Favorites (' + favs.length + ')</button>' +
          '</div>' +
          '<div id="tabContent">' +
            '<div id="tab-listings">' +
              (listings.length === 0
                ? '<div class="empty"><p>You haven\'t listed anything yet.</p><a href="#/sell" class="btn btn-coral" style="margin-top:1rem">Create Listing</a></div>'
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
                ? '<div class="empty"><p>No favorites yet.</p><a href="#/browse" class="btn btn-coral" style="margin-top:1rem">Browse Listings</a></div>'
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
        '<h1>About BarGain</h1>' +
        '<p class="lead">BarGain is a local marketplace that connects buyers and sellers in your area. ' +
          'Browse items on a live map, connect with sellers, and get the best deals &mdash; ' +
          'all without leaving your neighborhood.</p>' +
        '<div class="how-steps" style="margin-top:2rem">' +
          '<div class="how-step">' +
            '<div class="how-step-icon">' +
              '<svg width="24" height="24" fill="none" stroke="#E8613C" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' +
            '</div>' +
            '<h3>Browse</h3>' +
            '<p>Search and browse listings from sellers near you. Save your favorites and track items you love.</p>' +
          '</div>' +
          '<div class="how-step">' +
            '<div class="how-step-icon">' +
              '<svg width="24" height="24" fill="none" stroke="#E8613C" stroke-width="2" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>' +
            '</div>' +
            '<h3>Sell</h3>' +
            '<p>List your items in seconds. Your listing appears on the map and is instantly visible to nearby buyers.</p>' +
          '</div>' +
          '<div class="how-step">' +
            '<div class="how-step-icon">' +
              '<svg width="24" height="24" fill="none" stroke="#E8613C" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' +
            '</div>' +
            '<h3>BarGain</h3>' +
            '<p>Connect directly with buyers and sellers. No middleman, no fees &mdash; just great deals in your community.</p>' +
          '</div>' +
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
