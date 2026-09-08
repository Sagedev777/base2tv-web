// ============================================================
//  API Service — Express/Node backend on port 5000
// ============================================================
const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getToken    = ()  => localStorage.getItem("b2tv_token");
export const setToken    = (t) => localStorage.setItem("b2tv_token", t);
export const removeToken = ()  => localStorage.removeItem("b2tv_token");
export const getUser     = ()  => { try { return JSON.parse(localStorage.getItem("b2tv_user")||"null"); } catch { return null; } };
export const setUser     = (u) => localStorage.setItem("b2tv_user", JSON.stringify(u));
export const removeUser  = ()  => localStorage.removeItem("b2tv_user");

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers||{}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}/${endpoint}`, { ...options, headers });
  } catch {
    throw new Error("Cannot reach the server. Make sure the API server is running.");
  }

  let data = {};
  try { data = await res.json(); } catch { data = {}; }

  if (res.status === 401) throw new Error(data.error || "Invalid email or password.");
  if (res.status === 403) throw new Error(data.error || "Access denied.");
  if (res.status === 409) throw new Error(data.error || "Already exists.");
  if (res.status === 422) throw new Error(data.error || "Please check your input.");
  if (res.status === 429) throw new Error(data.error || "Too many attempts. Please wait.");
  if (!res.ok)            throw new Error(data.error || `Request failed (${res.status})`);
  if (data.error)         throw new Error(data.error);
  return data;
}

const get  = (ep)       => request(ep, { method: "GET" });
const post = (ep, body) => request(ep, { method: "POST",   body: JSON.stringify(body) });
const put  = (ep, body) => request(ep, { method: "PUT",    body: JSON.stringify(body) });
const del  = (ep)       => request(ep, { method: "DELETE" });

// AUTH
export const authAPI = {
  register: (username, email, password) => post("auth/register", { username, email, password }),
  login:    (email, password)           => post("auth/login",    { email, password }),
  me:       ()                          => get("auth/me"),
};

// SCHEDULE
export const scheduleAPI = {
  getAll:     ()    => get("schedule"),
  getCurrent: ()    => get("schedule/current"),
  getById:    (id)  => get(`schedule/${id}`),
};

// CHAT
export const chatAPI = {
  getMessages: (showId, limit=50) => get(`chat?show_id=${showId}&limit=${limit}`),
  sendMessage: (showId, message, guestName="", replyToId=null) =>
    post("chat", { show_id: showId, message, guest_name: guestName, reply_to_id: replyToId }),
};

// NEWS
export const newsAPI = {
  getAll:   (limit=10, offset=0, category="") =>
    get(`news?limit=${limit}&offset=${offset}${category?`&category=${encodeURIComponent(category)}`:""}`),
  getById:  (id) => get(`news/${id}`),
};

// FEATURED
export const featuredAPI = {
  getAll:  () => get("featured"),
  getById: (id) => get(`featured/${id}`),
};

// VIDEOS
export const videosAPI = {
  getAll:        (limit=12, offset=0) => get(`videos?limit=${limit}&offset=${offset}`),
  getFeatured:   ()                   => get("videos?featured=1"),
  getById:       (id)                 => get(`videos/${id}`),
  getByCategory: (cat)                => get(`videos?category=${encodeURIComponent(cat)}`),
};

// CONTACT
export const contactAPI = {
  submit: (name, email, subject, message) => post("contact", { name, email, subject, message }),
};

// SETTINGS
export const settingsAPI = {
  getAll:  ()            => get("settings"),
  update:  (key, value)  => put("settings", { key, value }),
};

// ADMIN
export const adminAPI = {
  schedule: {
    getAll:  ()         => get("schedule"),
    create:  (data)     => post("schedule", data),
    update:  (id, data) => put(`schedule/${id}`, data),
    remove:  (id)       => del(`schedule/${id}`),
  },
  news: {
    getAll:  (limit=20, offset=0) => get(`news?limit=${limit}&offset=${offset}`),
    getById: (id)       => get(`news/${id}`),
    create:  (data)     => post("news", data),
    update:  (id, data) => put(`news/${id}`, data),
    remove:  (id)       => del(`news/${id}`),
  },
  videos: {
    getAll:  (limit=20, offset=0) => get(`videos?limit=${limit}&offset=${offset}`),
    create:  (data)     => post("videos", data),
    update:  (id, data) => put(`videos/${id}`, data),
    remove:  (id)       => del(`videos/${id}`),
  },
  featured: {
    getAll:  ()         => get("featured"),
    create:  (data)     => post("featured", data),
    update:  (id, data) => put(`featured/${id}`, data),
    remove:  (id)       => del(`featured/${id}`),
  },
  users: {
    getAll:      (limit=20, offset=0) => get(`users?limit=${limit}&offset=${offset}`),
    update:      (id, data) => put(`users/${id}`, data),
    remove:      (id)       => del(`users/${id}`),
    createStaff: (data)     => post("users/create-staff", data),
  },
  contacts: {
    getAll:   (limit=20, offset=0, filter="") =>
      get(`contact?limit=${limit}&offset=${offset}${filter?`&filter=${filter}`:""}`),
    markRead: (id) => put(`contact/${id}/read`, {}),
    remove:   (id) => del(`contact/${id}`),
  },
};
// ════════════════════════════════════════════════════════════
//  FILE UPLOAD  (multipart/form-data — NOT JSON)
// ════════════════════════════════════════════════════════════
const uploadWithProgress = (file, endpoint, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const token = getToken();

    xhr.open("POST", `${BASE}/${endpoint}`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch {}
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        reject(new Error(data.error || "Upload failed."));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));

    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
};

export const uploadAPI = {
  image: (file, onProgress) => uploadWithProgress(file, "upload/image", onProgress),
  video: (file, onProgress) => uploadWithProgress(file, "upload/video", onProgress),
  ad:    (file, onProgress) => uploadWithProgress(file, "upload/ad", onProgress),
};

// ════════════════════════════════════════════════════════════
//  ADS
// ════════════════════════════════════════════════════════════
export const adsAPI = {
  getActive: ()         => get("ads"),
  getAll:    ()         => get("ads/all"),
  create:    (data)     => post("ads", data),
  update:    (id, data) => put(`ads/${id}`, data),
  remove:    (id)       => del(`ads/${id}`),
};

// ════════════════════════════════════════════════════════════
//  ADVERTISE ENQUIRIES
// ════════════════════════════════════════════════════════════
export const advertiseAPI = {
  submit:   (data)     => post("advertise", data),
  getAll:   (limit=20, offset=0) => get(`advertise?limit=${limit}&offset=${offset}`),
  markRead: (id)       => put(`advertise/${id}/read`, {}),
  remove:   (id)       => del(`advertise/${id}`),
};

// ════════════════════════════════════════════════════════════
//  CAREERS
// ════════════════════════════════════════════════════════════
export const careersAPI = {
  getActive: ()         => get("careers"),
  getAll:    ()         => get("careers/all"),
  create:    (data)     => post("careers", data),
  update:    (id, data) => put(`careers/${id}`, data),
  remove:    (id)       => del(`careers/${id}`),
};