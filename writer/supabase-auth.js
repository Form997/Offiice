/* HAI DAT OFFICE V2.7 — Supabase Auth bootstrap. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const status = byId('accountStatus');
  const say = (message, state='') => { if(status){status.textContent=message;status.dataset.state=state;} };
  const config = window.HD_SUPABASE_CONFIG || {};
  const ready = !!(config.url && config.anonKey && window.supabase && window.supabase.createClient);
  let client = null;
  if (ready) {
    try {
      client = window.supabase.createClient(config.url, config.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      window.HD_SUPABASE = client;
    } catch (e) { say('Không khởi tạo được Supabase: '+e.message, 'error'); }
  }
  const controls = ['accountEmail','accountPassword','accountSignup','accountLogin','accountLogout','accountReset'];
  controls.forEach(id => { const el=byId(id); if(el) el.disabled=!client || (id==='accountLogout'); });
  if (!client) {
    say('Chưa cấu hình Supabase. Writer vẫn dùng kho cục bộ; đăng nhập/chia sẻ chưa hoạt động.', 'warning');
    return;
  }
  async function refresh(session) {
    const user = session && session.user;
    say(user ? 'Đã đăng nhập: '+user.email+' · Đồng bộ đám mây chưa bật' : 'Chưa đăng nhập · Tài liệu vẫn lưu trên thiết bị', user?'saved':'');
    if(byId('accountLogout'))byId('accountLogout').disabled=!user;
    if(byId('accountSignup'))byId('accountSignup').disabled=!!user;
    if(byId('accountLogin'))byId('accountLogin').disabled=!!user;
  }
  async function run(action) {
    const email=(byId('accountEmail').value||'').trim();
    const password=byId('accountPassword').value||'';
    if(!email){say('Nhập email trước đã.', 'error');return;}
    try {
      if(action==='signup'){
        if(password.length<8)throw new Error('Mật khẩu phải có ít nhất 8 ký tự.');
        const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:location.href.split('#')[0]}});
        if(error)throw error;
        say(data.session?'Đăng ký và đăng nhập thành công.':'Đã gửi email xác minh; kiểm tra hộp thư.', 'saved');
      } else if(action==='login'){
        const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;
      } else if(action==='reset'){
        const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.href.split('#')[0]});if(error)throw error;
        say('Đã gửi liên kết khôi phục nếu email hợp lệ.', 'saved');
      } else if(action==='logout'){
        const {error}=await client.auth.signOut();if(error)throw error;
      }
    } catch(e){say('Tác vụ tài khoản thất bại: '+(e.message||'Lỗi không xác định'), 'error');}
  }
  byId('accountSignup').onclick=()=>run('signup');
  byId('accountLogin').onclick=()=>run('login');
  byId('accountLogout').onclick=()=>run('logout');
  byId('accountReset').onclick=()=>run('reset');
  client.auth.onAuthStateChange((_event,session)=>refresh(session));
  client.auth.getSession().then(({data,error})=>{if(error)throw error;return refresh(data.session);}).catch(e=>say('Không đọc được phiên: '+e.message,'error'));
})();
