// my-reviews.js
const SUPABASE_URL = "https://rfzavcliggzlpkqqcrzr.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemF2Y2xpZ2d6bHBrcXFjcnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzY1NjUsImV4cCI6MjA5MjY1MjU2NX0.PAPu8svIFjvDXUfY91yXGIRmktBCKExsOnqxlYW0z_I";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const API_BASE = "http://localhost:3000/api";

let currentEditReviewId = null;

const getUserId = () => sessionStorage.getItem("loggedInUserId");

function logout() {
  sessionStorage.clear();
  window.location.href = "login.html";
}

function displayCachedUserInfo() {
  const userName = sessionStorage.getItem("loggedInUserName");
  const userEmail = sessionStorage.getItem("loggedInUserEmail");
  const nameDisplay = document.getElementById("user-name-display");
  const emailDisplay = document.getElementById("user-email-display");
  const navName = document.getElementById("nav-user-name");

  if (nameDisplay) nameDisplay.innerText = userName ? `${userName} 家長` : "";
  if (emailDisplay)
    emailDisplay.innerText = userEmail && userEmail.trim() ? userEmail : "";
  if (navName)
    navName.innerText = userName ? `👋 你好，${userName}` : "👋 你好，家長";
}

async function loadUserProfile() {
  const userId = getUserId();
  const userRole = sessionStorage.getItem("userRole");

  if (!userId || userRole !== "parent") {
    alert("請先登入家長帳號");
    window.location.href = "login.html";
    return null;
  }

  try {
    const { data, error } = await supabaseClient
      .from("parent")
      .select("name, email")
      .eq("parent_id", parseInt(userId))
      .maybeSingle();

    if (data) {
      if (data.name) sessionStorage.setItem("loggedInUserName", data.name);
      if (data.email) sessionStorage.setItem("loggedInUserEmail", data.email);
      displayCachedUserInfo();
      return data;
    }
  } catch (err) {
    console.error("載入使用者資料失敗:", err);
  }
  return null;
}

async function loadMyReviews() {
  const userId = getUserId();
  if (!userId) {
    alert("請先登入才能查看評鑑紀錄！");
    window.location.href = "login.html";
    return;
  }

  await loadUserProfile();

  try {
    const { data: reviews, error } = await supabaseClient
      .from("reviews")
      .select("*, childcare_center(name)")
      .eq("parent_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const listContainer = document.getElementById("my-reviews-list");
    if (!reviews || reviews.length === 0) {
      listContainer.innerHTML = `
                <div class="empty-state" style="padding: 40px; text-align: center; border: 2px dashed #ccc; background: #fff;">
                    您還沒有發布過任何評價喔！<br><br>
                    <a href="search.html" class="wireframe-btn primary" style="text-decoration:none;">去尋找機構並留下心得</a>
                </div>`;
      return;
    }

    listContainer.innerHTML = reviews
      .map((r) => {
        const centerName = r.childcare_center?.name || "未知機構";
        const date = r.created_at ? r.created_at.slice(0, 10) : "-";
        return `
            <div class="result-card" style="flex-direction: column; padding: 20px; border: 2px solid #ccc; background: #fff;" id="review-card-${
              r.review_id
            }">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 12px; margin-bottom: 12px;">
                    <h3 style="margin: 0; color: #333;">🏫 ${escapeHtml(
                      centerName
                    )}</h3>
                    <span style="font-size:13px; color:#666;">發布日期：${date}</span>
                </div>
                <div class="score-row" style="display: flex; gap: 20px; margin-bottom: 15px; font-size: 14px; background: #f8fafc; padding: 10px; border-radius: 4px;">
                    <span>整體 <strong style="color:#f59e0b;">${
                      r.score_overall ?? "-"
                    }</strong></span>
                    <span>師資 <strong style="color:#f59e0b;">${
                      r.score_staff ?? "-"
                    }</strong></span>
                    <span>環境 <strong style="color:#f59e0b;">${
                      r.score_environment ?? "-"
                    }</strong></span>
                    <span>課程 <strong style="color:#f59e0b;">${
                      r.score_curriculum ?? "-"
                    }</strong></span>
                </div>
                <p style="color: #444; line-height: 1.6; margin-bottom: 15px;">
                    ${
                      escapeHtml(r.comment) ||
                      '<span style="color:#999; font-style:italic;">（無文字評價）</span>'
                    }
                </p>
                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button class="wireframe-btn" onclick="editReview(${
                      r.review_id
                    })">✏️ 編輯評價</button>
                    <button class="wireframe-btn" style="color: #d9363e; border-color: #d9363e;" onclick="deleteReview(${
                      r.review_id
                    })">🗑️ 刪除評價</button>
                </div>
            </div>`;
      })
      .join("");
  } catch (err) {
    console.error("載入評價失敗:", err);
    document.getElementById("my-reviews-list").innerHTML =
      '<div class="empty-state">載入失敗，請稍後再試。</div>';
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

async function deleteReview(reviewId) {
  if (!confirm("確定要刪除這筆評價嗎？刪除後將無法復原喔！")) return;
  const token = sessionStorage.getItem("authToken");
  try {
    const response = await fetch(`${API_BASE}/reviews/${reviewId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("刪除失敗");
    document.getElementById(`review-card-${reviewId}`).style.display = "none";
    alert("✅ 已成功刪除評價！");
  } catch (err) {
    console.error("刪除失敗:", err);
    alert("刪除失敗，請檢查網路連線。");
  }
}

async function editReview(reviewId) {
  currentEditReviewId = reviewId;
  try {
    const response = await fetch(`${API_BASE}/reviews/${reviewId}`);
    if (!response.ok) throw new Error("無法取得評價內容");
    const data = await response.json();
    document.getElementById("edit-score-staff").value = data.score_staff || "";
    document.getElementById("edit-score-env").value =
      data.score_environment || "";
    document.getElementById("edit-score-curriculum").value =
      data.score_curriculum || "";
    document.getElementById("edit-review-comment").value = data.comment || "";
    document.getElementById("editModal").style.display = "flex";
  } catch (err) {
    console.error("載入評價資料失敗:", err);
    alert("無法載入評價內容，請稍後再試。");
  }
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
  currentEditReviewId = null;
}

async function updateReview(event) {
  event.preventDefault();
  if (!currentEditReviewId) return;

  const newStaff = parseInt(document.getElementById("edit-score-staff").value);
  const newEnv = parseInt(document.getElementById("edit-score-env").value);
  const newCurriculum = parseInt(
    document.getElementById("edit-score-curriculum").value
  );
  const newComment = document
    .getElementById("edit-review-comment")
    .value.trim();

  if (!newStaff || !newEnv || !newCurriculum) {
    alert("請完整填寫所有評分項目！");
    return;
  }
  const token = sessionStorage.getItem("authToken");
  try {
    const response = await fetch(`${API_BASE}/reviews/${currentEditReviewId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        score_staff: newStaff,
        score_environment: newEnv,
        score_curriculum: newCurriculum,
        comment: newComment || null,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "更新失敗");
    }

    alert("✅ 評價已更新！");
    closeEditModal();
    await loadMyReviews();
  } catch (err) {
    console.error("更新失敗:", err);
    alert(`更新失敗: ${err.message}`);
  }
}

document
  .getElementById("editReviewForm")
  .addEventListener("submit", updateReview);

window.onclick = function (event) {
  const modal = document.getElementById("editModal");
  if (event.target === modal) closeEditModal();
};

displayCachedUserInfo();
loadMyReviews();
