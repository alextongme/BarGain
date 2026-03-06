/* ============================
   BarGain — API Client
   ============================ */

const API = {
  async request(url, options = {}) {
    const config = { headers: {}, ...options };
    if (config.body && typeof config.body === 'string') {
      config.headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, config);
    if (res.status === 204) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error((data && (data.error || data.message)) || res.statusText);
    }
    return data;
  },

  // Auth
  me()                    { return this.request('/api/me'); },
  login(username, password) { return this.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }); },
  signup(data)            { return this.request('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }); },
  logout()                { return this.request('/api/auth/logout', { method: 'POST' }); },

  // Listings
  getListings()           { return this.request('/api/listings'); },
  getListing(id)          { return this.request('/api/listings/' + id); },
  searchListings(q)       { return this.request('/api/listings/search?q=' + encodeURIComponent(q)); },
  createListing(data)     { return this.request('/api/listings', { method: 'POST', body: JSON.stringify(data) }); },
  updateListing(id, data) { return this.request('/api/listings/' + id, { method: 'PUT', body: JSON.stringify(data) }); },
  deleteListing(id)       { return this.request('/api/listings/' + id, { method: 'DELETE' }); },

  // Profile & Favorites
  getProfile()            { return this.request('/api/profile'); },
  addFavorite(id)         { return this.request('/api/favorites/' + id, { method: 'POST' }); },
  removeFavorite(id)      { return this.request('/api/favorites/' + id, { method: 'DELETE' }); },
};
