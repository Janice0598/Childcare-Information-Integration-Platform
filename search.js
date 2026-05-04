
const SUPABASE_URL = 'https://rfzavcliggzlpkqqcrzr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_48pF8e_sZQP5MQXKkeeTOQ_pfESdvZV'; 
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
document.getElementById('applyFilterBtn').addEventListener('click', function() {
    // 1. 獲取各個篩選條件的值
    const district = document.getElementById('filter-district').value;
    const maxFee = document.getElementById('filter-fee').value;
    
    // 獲取 Checkbox 的狀態 (布林值)
    const needsExtendedCare = document.getElementById('filter-extended').checked;
    const isAccepting = document.getElementById('filter-accepting').checked;
    
    const minGrade = document.getElementById('filter-grade').value;

    // 2. 封裝成要傳給後端的物件
    const filterData = {
        district: district !== '不限' ? district : null,
        maxFee: maxFee,
        extendedCare: needsExtendedCare,
        accepting: isAccepting,
        minGrade: minGrade !== '不限' ? minGrade : null
    };

    console.log('準備發送給後端的篩選條件：', filterData);

    // 3. 透過 Fetch API 呼叫後端搜尋介面 (示意)
    /*
    fetch(`/api/centers/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filterData)
    })
    .then(response => response.json())
    .then(data => {
        // 這裡負責接收後端回傳的陣列，並用 JS 動態重新渲染右側的機構卡片
        renderCenterCards(data);
    });
    */
});