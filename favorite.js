// favorite.js
const SUPABASE_URL = "https://rfzavcliggzlpkqqcrzr.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemF2Y2xpZ2d6bHBrcXFjcnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzY1NjUsImV4cCI6MjA5MjY1MjU2NX0.PAPu8svIFjvDXUfY91yXGIRmktBCKExsOnqxlYW0z_I";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const API_BASE = "http://localhost:3000/api";

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

async function loadUserProfile() {
  const userId = localStorage.getItem("loggedInUserId");
  const userRole = localStorage.getItem("userRole");

  if (!userId || userRole !== "parent") {
    alert("請先登入家長帳號");
    window.location.href = "login.html";
    return null;
  }

  let userName = localStorage.getItem("loggedInUserName");
  let userEmail = localStorage.getItem("loggedInUserEmail");

  if (!userName || !userEmail) {
    try {
      const { data, error } = await supabaseClient
        .from("parent")
        .select("name, email")
        .eq("parent_id", parseInt(userId))
        .maybeSingle();

      if (error) {
        console.error("查詢 parent 表失敗：", error);
      }
      if (data) {
        userName = data.name;
        userEmail = data.email;
        if (userName) localStorage.setItem("loggedInUserName", userName);
        if (userEmail) localStorage.setItem("loggedInUserEmail", userEmail);
      }
    } catch (err) {
      console.error("載入使用者資料失敗：", err);
    }
  }

  userName = userName || "家長";
  userEmail =
    userEmail && userEmail.trim() !== "" ? userEmail : "尚未設定 Email";

  const nameDisplay = document.getElementById("user-name-display");
  const emailDisplay = document.getElementById("user-email-display");
  if (nameDisplay) nameDisplay.innerText = userName;
  if (emailDisplay) emailDisplay.innerText = userEmail;

  const navUserNameSpan = document.getElementById("nav-user-name");
  if (navUserNameSpan) {
    navUserNameSpan.innerText = `👋 你好，${userName}`;
  }

  return { userName, userEmail };
}

async function loadFavorites() {
  const userId = localStorage.getItem("loggedInUserId");
  const userRole = localStorage.getItem("userRole");

  if (!userId || userRole !== "parent") {
    alert("請先登入家長帳號才能查看收藏！");
    window.location.href = "login.html";
    return;
  }

  await loadUserProfile();

  try {
    const { data: favorites, error } = await supabaseClient
      .from("favorite_item")
      .select("center_id, fav_item_id")
      .eq("parent_id", userId);

    if (error) throw error;

    const listContainer = document.getElementById("favorite-list");

    if (!favorites || favorites.length === 0) {
      listContainer.innerHTML = `
                <div class="empty-state">
                    您目前還沒有收藏任何機構喔！快去搜尋看看吧！<br><br>
                    <a href="search.html" class="wireframe-btn primary" style="text-decoration:none; display:inline-block; margin-top:10px;">前往搜尋機構</a>
                </div>`;
      return;
    }

    listContainer.innerHTML = "";

    for (let item of favorites) {
      const response = await fetch(
        `${API_BASE}/childcare-centers/${item.center_id}`
      );
      if (response.ok) {
        const center = await response.json();
        // 把 fav_item_id 一起傳進去，供刪除使用
        renderFavoriteCard(center, item.fav_item_id);
      }
    }
  } catch (err) {
    console.error("載入收藏失敗：", err);
    document.getElementById("favorite-list").innerHTML =
      '<div class="empty-state">載入失敗，請確認後端伺服器是否開啟。</div>';
  }
}

function renderFavoriteCard(center, favItemId) {
  const listContainer = document.getElementById("favorite-list");
  const address =
    [center.city, center.district, center.streetline]
      .filter(Boolean)
      .join(" ") || "未提供";
  const openTime = center.open_time ? center.open_time.slice(0, 5) : "-";
  const closeTime = center.close_time ? center.close_time.slice(0, 5) : "-";
  const hours =
    openTime !== "-" && closeTime !== "-"
      ? `${openTime} - ${closeTime}`
      : "未提供";

  listContainer.innerHTML += `
        <div class="result-card" id="fav-card-${center.center_id}">
          <div class="card-image" style="overflow:hidden;">
    <img id="thumb-${center.center_id}" src="" alt="機構圖片"
        style="width:100%;height:100%;object-fit:cover;display:none;">
    <span id="thumb-placeholder-${center.center_id}">機構圖片</span>
</div>
            <div class="card-content">
                <div class="card-header">
                    <h3 class="center-name">${
                      center.name || "機構名稱未提供"
                    }</h3>
                    <span class="badge">${center.operation_type || ""} ${
    center.category || ""
  }</span>
                </div>
                <p class="text-line highlight">📍 ${address}</p>
                <p class="text-line">🕐 營業時間：${hours}</p>
                <p class="text-line">👩‍🏫 師生比：1:${
                  center.teacher_student_ratio || "未提供"
                } ｜ 總容量：${center.total_capacity || 0} 人</p>
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: auto; padding-top: 10px;">
    <a href="center-detail.html?id=${center.center_id}" class="wireframe-btn" 
       style="text-decoration:none; font-size:14px; padding:6px 12px; display:inline-flex; align-items:center; gap:6px;">
        🔍 查看詳情
    </a>
    <button class="wireframe-btn" 
            style="background-color:#ef4444; color:white; border:1px solid #ef4444; cursor:pointer; font-size:14px; padding:6px 12px; display:inline-flex; align-items:center; gap:6px;"
            onclick="removeFavorite(${center.center_id}, ${favItemId})">
        🗑️ 移除收藏
    </button>
</div>
            </div>
        </div>`;
  fetch(`${API_BASE}/photo/center/${center.center_id}`)
    .then((res) => (res.ok ? res.json() : null))
    .then((result) => {
      if (!result || !result.data || result.data.length === 0) return;
      const firstPhoto =
        result.data.find((p) => p.photo_id === 1) || result.data[0];
      if (!firstPhoto?.url) return;
      const img = document.getElementById(`thumb-${center.center_id}`);
      const placeholder = document.getElementById(
        `thumb-placeholder-${center.center_id}`
      );
      if (img) {
        img.src = firstPhoto.url;
        img.style.display = "block";
      }
      if (placeholder) placeholder.style.display = "none";
    })
    .catch(() => {});
}

// ✅ 改成走後端 API (DELETE /api/favorites/:fav_item_id)
async function removeFavorite(centerId, favItemId) {
  if (!confirm("確定要將這間機構從收藏中移除嗎？")) return;
  try {
    const response = await fetch(`${API_BASE}/favorites/${favItemId}`, {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 204) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "刪除失敗");
    }

    document.getElementById(`fav-card-${centerId}`).style.display = "none";
    alert("✅ 已成功移除收藏！");
  } catch (err) {
    console.error("移除失敗:", err);
    alert("移除失敗，請稍後再試。");
  }
}

loadUserProfile().then(() => loadFavorites());
