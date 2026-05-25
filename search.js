// search.js
const API_BASE = "http://localhost:3000/api";

const SUPABASE_URL = "https://rfzavcliggzlpkqqcrzr.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemF2Y2xpZ2d6bHBrcXFjcnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzY1NjUsImV4cCI6MjA5MjY1MjU2NX0.PAPu8svIFjvDXUfY91yXGIRmktBCKExsOnqxlYW0z_I";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function updateNavbar() {
    const container = document.getElementById('nav-actions-container');
    if (!container) return;
    const userId = sessionStorage.getItem('loggedInUserId');
    const userName = sessionStorage.getItem('loggedInUserName');
    if (userId && userName) {
        container.innerHTML = `
            <span style="margin-right: 10px;">👋 你好，${userName}</span>
            <a href="user.html" class="wireframe-btn primary" style="text-decoration: none;">我的會員區</a>
            <button class="wireframe-btn" onclick="logout()">登出</button>
        `;
    } else {
        container.innerHTML = `<a href="login.html" class="wireframe-btn" style="text-decoration: none;">會員登入</a>`;
    }
}

window.logout = function() {
    sessionStorage.clear();
    window.location.href = 'login.html';
};

document
  .getElementById("applyFilterBtn")
  .addEventListener("click", async function () {
    const category = document.getElementById("filter-category").value;
    const operation = document.getElementById("filter-operation").value;
    const district = document.getElementById("filter-district").value;
    const ratio = document.getElementById("filter-ratio").value;
    const openTime = document.getElementById("filter-open-time").value;
    const closeTime = document.getElementById("filter-close-time").value;
    const capacity = document.getElementById("filter-capacity").value;

    try {
      const params = new URLSearchParams();
      if (category !== "不限") params.append("category", category);
      if (operation !== "不限") params.append("type", operation);
      if (district !== "不限") params.append("district", district);
      if (ratio !== "不限") params.append("ratio", ratio);
      if (capacity !== "不限") params.append("range", capacity);
      if (openTime !== "不限") params.append("open_time", openTime);
      if (closeTime !== "不限") params.append("close_time", closeTime);

      const url = params.toString()
        ? `${API_BASE}/childcare-centers/search?${params}`
        : `${API_BASE}/childcare-centers`;

      const response = await fetch(url);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "搜尋失敗");
      }

      const centers = await response.json();
      renderCenterCards(centers);
    } catch (err) {
      console.error("搜尋錯誤:", err);
      alert("搜尋發生錯誤：" + err.message);
    }
  });

document
  .getElementById("resetFilterBtn")
  .addEventListener("click", function () {
    document.getElementById("filter-category").value = "不限";
    document.getElementById("filter-operation").value = "不限";
    document.getElementById("filter-district").value = "不限";
    document.getElementById("filter-ratio").value = "不限";
    document.getElementById("filter-open-time").value = "不限";
    document.getElementById("filter-close-time").value = "不限";
    document.getElementById("filter-capacity").value = "不限";
    document.getElementById("applyFilterBtn").click();
  });

function renderCenterCards(centers) {
  const resultsList = document.getElementById("results-list");
  const resultCount = document.getElementById("result-count");

  resultCount.innerText = centers.length;
  resultsList.innerHTML = "";

  if (centers.length === 0) {
    resultsList.innerHTML = `
      <div class="empty-state">
        找不到符合條件的機構，請嘗試放寬篩選條件！
      </div>`;
    return;
  }

  centers.forEach(async (center) => {
    const openTime = center.open_time ? center.open_time.slice(0, 5) : "-";
    const closeTime = center.close_time ? center.close_time.slice(0, 5) : "-";
    const hours = openTime !== "-" && closeTime !== "-" ? `${openTime} - ${closeTime}` : "未提供";
    const address =
      [center.city, center.district, center.streetline].filter(Boolean).join(" ") || "未提供";

    resultsList.innerHTML += `
      <div class="result-card">
        <div class="card-image" style="overflow:hidden;">
          <img id="thumb-${center.center_id}" src="" alt="機構圖片"
            style="width:100%;height:100%;object-fit:cover;display:none;">
          <span id="thumb-placeholder-${center.center_id}">機構圖片</span>
        </div>
        <div class="card-content">
          <div class="card-header">
            <h3 class="center-name">${center.name || "機構名稱未提供"}</h3>
            <span class="badge">${center.operation_type || ""} ${center.category || ""}</span>
          </div>
          <p class="text-line highlight">📍 ${address}</p>
          <p class="text-line">🕐 營業時間：${hours}</p>
          <p class="text-line">👩‍🏫 師生比：1:${center.teacher_student_ratio || "未提供"} ｜ 總容量：${center.total_capacity || 0} 人</p>
          <div class="card-actions" style="display:flex;gap:10px;justify-content:flex-end;align-items:center;margin-top:15px;">
            <a href="center-detail.html?id=${center.center_id}" class="wireframe-btn"
              style="text-decoration:none;height:42px;padding:0 16px;display:inline-flex;align-items:center;">查看詳情</a>
            <button class="wireframe-btn primary"
              style="height:42px;padding:0 16px;cursor:pointer;display:inline-flex;align-items:center;"
              onclick="addToFavorite(${center.center_id})">❤️ 加入收藏</button>
          </div>
        </div>
      </div>`;

    fetch(`${API_BASE}/photo/center/${center.center_id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (!result || !result.data || result.data.length === 0) return;
        const firstPhoto = result.data.find((p) => p.photo_id === 1) || result.data[0];
        if (!firstPhoto?.url) return;
        const img = document.getElementById(`thumb-${center.center_id}`);
        const placeholder = document.getElementById(`thumb-placeholder-${center.center_id}`);
        if (img) { img.src = firstPhoto.url; img.style.display = "block"; }
        if (placeholder) placeholder.style.display = "none";
      })
      .catch(() => {});
  });
}

async function addToFavorite(centerId) {
  const userId = sessionStorage.getItem("loggedInUserId");
  const userRole = sessionStorage.getItem("userRole");

  if (!userId || userRole !== "parent") {
    alert("請先登入家長帳號才能收藏！");
    window.location.href = "login.html";
    return;
  }
  try {
    const { error } = await supabaseClient
      .from("favorite_item")
      .insert([{ parent_id: parseInt(userId), center_id: centerId }]);
    if (error) {
      if (error.code === "23505") {
        alert("這間機構已在您的收藏清單中！");
      } else {
        throw error;
      }
    } else {
      alert("✅ 已加入收藏！");
    }
  } catch (err) {
    console.error(err);
    alert("收藏失敗，請稍後再試。");
  }
}

function searchByKeyword() {
  const keyword = document.getElementById("keyword-search").value.trim();
  const allCards = document.querySelectorAll(".result-card");
  let visibleCount = 0;

  allCards.forEach((card) => {
    const centerName = card.querySelector(".center-name").innerText;
    const match = centerName.includes(keyword) || keyword === "";
    card.style.display = match ? "" : "none";
    if (match) visibleCount++;
  });

  const el = document.getElementById("result-count");
  if (el) el.innerText = visibleCount;
}

document.getElementById("keyword-search").addEventListener("keypress", function (event) {
  if (event.key === "Enter") searchByKeyword();
});

window.onload = function () {
  updateNavbar();
  document.getElementById("applyFilterBtn").click();
};
