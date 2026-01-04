// frontend/js/auth.js - 修复版（无import语句）

console.log('🚀 auth.js 开始加载...');

// 全局Supabase配置
const SUPABASE_CONFIG = {
    URL: 'https://nqenhynmsrvbmphyjqwv.supabase.co',
    ANON_KEY: 'sb_publishable_gEQD1u5KML6aoQ3Y1qlVKw_ePu9lgre'
};

// ========== AuthManager 类 ==========
class AuthManager {
    constructor() {
        console.log('🔧 AuthManager初始化...');
        this.tokenKey = 'yuxin_token';
        this.userKey = 'yuxin_user';
        this.isLoggedIn = false;
        this.user = null;
        this.supabaseClient = null;

        this.init();
    }

    init() {
        console.log('🔄 检查登录状态...');
        this.checkLoginStatus();
        this.initSupabaseClient();
        this.setupAuthInterceptor();
    }

    // 初始化Supabase客户端
    initSupabaseClient() {
        if (!window.supabase) {
            console.error('❌ Supabase SDK未加载');
            return;
        }

        try {
            this.supabaseClient = window.supabase.createClient(
                SUPABASE_CONFIG.URL,
                SUPABASE_CONFIG.ANON_KEY,
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: false
                    }
                }
            );
            console.log('✅ Supabase客户端初始化成功');
        } catch (error) {
            console.error('❌ 创建Supabase客户端失败:', error);
        }
    }

    // 获取Supabase客户端
    getSupabaseClient() {
        if (!this.supabaseClient) {
            this.initSupabaseClient();
        }
        return this.supabaseClient;
    }

    // 检查登录状态
    checkLoginStatus() {
        const token = localStorage.getItem(this.tokenKey);
        const userData = localStorage.getItem(this.userKey);

        if (token && userData) {
            try {
                let user = JSON.parse(userData);
                user = this.normalizeUserData(user);
                this.user = user;
                this.isLoggedIn = true;
                console.log('✅ 用户已登录:', this.user.username);
                setTimeout(() => this.updateUI(), 100);
            } catch (e) {
                console.error('解析用户数据失败:', e);
                this.logout();
            }
        }
    }

    // 【核心修复】登录函数 - 使用 window.supabase
  async login(username, password) {
    try {
        console.log('🔐 开始登录，输入的用户名:', username);
        
        // 显示加载状态
        const loginBtn = document.getElementById('loginSubmit');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = '登录中...';
        }
        
        if (!window.supabase) {
            throw new Error('Supabase SDK未加载');
        }
        
        const supabase = window.supabase.createClient(
            SUPABASE_CONFIG.URL,
            SUPABASE_CONFIG.ANON_KEY
        );
        
        let loginEmail = '';
        
        // 情况1：用户输入的是完整邮箱
        if (username.includes('@')) {
            loginEmail = username;
            console.log('📧 用户输入的是邮箱:', loginEmail);
        }
        // 情况2：用户输入的是用户名，需要查询对应的邮箱
        else {
            console.log('🔍 用户输入的是用户名，查找对应邮箱...');
            
            try {
                // 在 user_profiles 表中查找这个用户名对应的邮箱
                const { data: profileData, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('email, username')
                    .or(`username.eq.${username},phone.eq.${username}`) // 用户名或手机号
                    .maybeSingle();
                
                console.log('查询结果:', profileData, '错误:', profileError);
                
                if (profileData && profileData.email) {
                    loginEmail = profileData.email;
                    console.log(`✅ 找到用户 ${username} 的邮箱: ${loginEmail}`);
                } else {
                    // 如果找不到，尝试默认邮箱格式
                    loginEmail = `${username}@yuxin.com`;
                    console.log(`⚠️ 未找到用户，尝试默认邮箱: ${loginEmail}`);
                }
            } catch (lookupError) {
                console.warn('查找用户失败:', lookupError);
                loginEmail = `${username}@yuxin.com`;
            }
        }
        
        console.log(`🎯 最终使用的登录邮箱: ${loginEmail}`);
        
        // 关键：使用正确的邮箱登录
        const { data, error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: password
        });
        
        if (error) {
            console.error('❌ Supabase登录错误详情:', {
                message: error.message,
                status: error.status,
                emailUsed: loginEmail
            });
            
            // 如果使用默认邮箱失败，尝试原始输入作为邮箱
            if (loginEmail === `${username}@yuxin.com` && !username.includes('@')) {
                console.log('🔄 尝试用原始输入作为邮箱...');
                const { data: altData, error: altError } = await supabase.auth.signInWithPassword({
                    email: username,  // 直接使用输入
                    password: password
                });
                
                if (!altError) {
                    console.log('✅ 使用原始输入登录成功');
                    data = altData;
                    error = null;
                }
            }
            
            if (error) {
                throw new Error('用户名或密码错误');
            }
        }
        
        console.log('✅ Supabase登录成功，用户ID:', data.user.id);
        
        // 获取用户档案
        const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('auth_id', data.user.id)
            .maybeSingle();
        
        console.log('📋 用户档案数据:', profileData);
        
        // 合并数据
        const userData = {
            ...data.user,
            ...(profileData || {}),
            username: profileData?.username || username,
            token: data.session.access_token
        };
        
        console.log('👤 完整用户数据:', userData);
        
        // 保存到本地
        localStorage.setItem(this.tokenKey, data.session.access_token);
        localStorage.setItem(this.userKey, JSON.stringify(userData));
        
        // 更新状态
        this.user = this.normalizeUserData(userData);
        this.isLoggedIn = true;
        
        // 显示成功
        this.showSuccessMessage('登录成功！');
        
        // 更新UI
        this.updateUI();
        
        // 关闭弹窗
        if (window.loginModal) {
            window.loginModal.hide();
        }
        
        // 延迟刷新页面
        setTimeout(() => {
            console.log('🔄 刷新页面以更新状态');
            window.location.reload();
        }, 1000);
        
        return { success: true, message: '登录成功' };
        
    } catch (error) {
        console.error('❌ 登录失败:', error);
        
        // 恢复按钮
        const loginBtn = document.getElementById('loginSubmit');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = '登录';
        }
        
        // 显示具体的错误信息
        let errorMessage = '登录失败';
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = '用户名或密码错误';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = '邮箱未验证，请检查邮箱';
        }
        
        // 显示错误
        if (window.loginModal) {
            const errorEl = document.getElementById('loginError');
            if (errorEl) {
                errorEl.textContent = errorMessage;
                errorEl.classList.add('show');
            }
        }
        
        return {
            success: false,
            message: errorMessage
        };
    }
}

    // 标准化用户数据
    normalizeUserData(user) {
        if (!user) return null;
        
        console.log('🔄 标准化用户数据:', user);
        
        const normalizedUser = {
            username: user.username || '',
            password: user.password || '',
            phone: user.phone || '',
            email: user.email || '',
            sex: user.sex || 'man',
            education: user.education || '3',
            city: user.city || 'Beijing',
            birth_year: user.birth_year || '2000',
            birth_month: user.birth_month || '1',
            birth_day: user.birth_day || '1',
            sign: user.sign || '',
            hobbies: this.normalizeHobbies(user.hobbies)
        };
        
        return normalizedUser;
    }

    // 标准化兴趣爱好
    normalizeHobbies(hobbies) {
        if (!hobbies) return [];
        
        if (Array.isArray(hobbies)) {
            return hobbies.filter(hobby => hobby && hobby.trim().length > 0);
        }
        
        if (typeof hobbies === 'string') {
            try {
                const parsed = JSON.parse(hobbies);
                if (Array.isArray(parsed)) {
                    return parsed.filter(hobby => hobby && hobby.trim().length > 0);
                }
            } catch (e) {
                return hobbies.split(',')
                    .map(h => h.trim())
                    .filter(h => h.length > 0);
            }
        }
        
        return [];
    }

    // 退出登录
    logout() {
        console.log('👋 用户退出登录');
        
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        this.user = null;
        this.isLoggedIn = false;
        
        this.updateUI();
        
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }

    // 获取用户
    getUser() {
        return this.user ? this.normalizeUserData(this.user) : null;
    }

    // 获取token
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // 更新UI
    updateUI() {
        console.log('🔄 更新UI，登录状态:', this.isLoggedIn, '用户:', this.user?.username);

        setTimeout(() => {
            let navRight = this.findNavRightElement();

            if (!navRight) {
                console.warn('⚠️ 找不到导航栏右侧区域');
                return;
            }

            this.updateNavContent(navRight);
        }, 100);
    }

    findNavRightElement() {
        const selectors = [
            '.nav-right',
            '.navbar-collapse .d-flex:last-child',
            '.navbar .d-flex:last-child',
            '.navbar-nav + .d-flex',
            'nav > div:last-child',
            '#navbarNav > div:last-child',
            '#navUserInfo'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                console.log('✅ 找到导航栏区域:', selector);
                return element;
            }
        }

        const loginBtn = document.querySelector('#btn-login, .btn-login');
        if (loginBtn && loginBtn.parentElement) {
            console.log('✅ 通过登录按钮找到父元素');
            return loginBtn.parentElement;
        }

        return null;
    }

    updateNavContent(navElement) {
        if (this.isLoggedIn && this.user) {
            console.log('🟢 显示已登录UI');

            navElement.innerHTML = `
                <div class="d-flex align-items-center gap-3">
                    <span class="text-white fw-bold" style="font-size: 16px;">欢迎，${this.user.username}</span>
                    <a href="../html/user.html" 
                       class="btn btn-sm text-white d-flex align-items-center gap-1"
                       style="background-color: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);">
                        <span>👤</span>
                        <span>个人主页</span>
                    </a>
                    <button id="btn-logout" 
                            class="btn btn-sm text-white"
                            style="background-color: rgba(255,107,129,0.8); border: 1px solid white;">
                        退出
                    </button>
                </div>
            `;

            setTimeout(() => {
                const logoutBtn = document.getElementById('btn-logout');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (confirm('确定要退出登录吗？')) {
                            this.logout();
                        }
                    });
                }
            }, 100);

        } else {
            console.log('🔵 显示未登录UI');

            navElement.innerHTML = `
                <div class="d-flex">
                    <button id="btn-login" class="btn btn-light me-2" style="color: #FD8291;">登录</button>
                    <a href="../html/register.html" class="btn" style="background-color: #ff6b81; color: white; border: 2px solid white;">注册</a>
                </div>
            `;

            setTimeout(() => {
                const loginBtn = document.getElementById('btn-login');
                if (loginBtn) {
                    loginBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (window.loginModal) {
                            window.loginModal.show();
                        }
                    });
                }
            }, 100);
        }
    }

    showSuccessMessage(message) {
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 24px;
            border-radius: 5px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;
        successMsg.textContent = message;
        document.body.appendChild(successMsg);

        setTimeout(() => {
            if (successMsg.parentNode) {
                successMsg.remove();
            }
        }, 3000);
    }

    setupAuthInterceptor() {
        const originalFetch = window.fetch;

        window.fetch = function (url, options = {}) {
            const auth = window.auth;
            const token = auth ? auth.getToken() : null;

            if (token && url.includes('/api/')) {
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                };
            }

            return originalFetch(url, options);
        };
    }

    requireLogin(redirectUrl = '/index.html') {
        if (!this.isLoggedIn) {
            alert('请先登录');
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }
}

// ========== LoginModal 类 ==========
class LoginModal {
    constructor() {
        console.log('🔧 LoginModal初始化...');
        this.modal = null;
        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        // 移除现有弹窗
        const existingModal = document.getElementById('loginModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div class="login-modal-overlay" id="loginModal" style="display: none; z-index: 9999;">
                <div class="login-modal">
                    <button class="modal-close">&times;</button>
                    <h2 class="login-title">用户登录</h2>
                    <form id="loginForm">
                        <div class="login-form-group">
                            <label class="login-label">邮箱</label>
                            <input type="text" 
                                   class="login-input" 
                                   id="loginUsername" 
                                   placeholder="请输入邮箱"
                                   required>
                        </div>
                        <div class="login-form-group">
                            <label class="login-label">密码</label>
                            <input type="password" 
                                   class="login-input" 
                                   id="loginPassword" 
                                   placeholder="请输入密码"
                                   required>
                        </div>
                        <div class="login-error" id="loginError"></div>
                        <button type="submit" class="login-btn" id="loginSubmit">
                            登录
                        </button>
                    </form>
                    <div class="login-links">
                        <span>还没有账号？</span>
                        <a href="register.html">立即注册</a>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('loginModal');
        console.log('✅ 登录弹窗创建完成');
    }

    setupEventListeners() {
        // 关闭按钮
        this.modal.querySelector('.modal-close').addEventListener('click', () => {
            this.hide();
        });

        // 点击遮罩层关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // 表单提交
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    }

    async handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const submitBtn = document.getElementById('loginSubmit');
        const errorEl = document.getElementById('loginError');

        // 清空错误信息
        errorEl.classList.remove('show');
        errorEl.textContent = '';

        // 验证输入
        if (!username || !password) {
            this.showError('请输入用户名和密码');
            return;
        }

        // 禁用提交按钮
        submitBtn.disabled = true;
        submitBtn.textContent = '登录中...';

        // 调用auth登录
        const result = await window.auth.login(username, password);

        if (!result.success) {
            // 登录失败
            this.showError(result.message);
            submitBtn.disabled = false;
            submitBtn.textContent = '登录';
        }
        // 登录成功由auth.login处理
    }

    showError(message) {
        const errorEl = document.getElementById('loginError');
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }

    show() {
        console.log('显示登录弹窗');
        this.modal.style.display = 'flex';
        // 清空表单
        document.getElementById('loginForm').reset();
        document.getElementById('loginError').classList.remove('show');
        // 聚焦到用户名输入框
        setTimeout(() => {
            document.getElementById('loginUsername').focus();
        }, 100);
    }

    hide() {
        this.modal.style.display = 'none';
    }

    isVisible() {
        return this.modal.style.display === 'flex';
    }
}

// ========== 全局初始化 ==========

// 创建全局auth实例
const auth = new AuthManager();
window.auth = auth;

// 创建全局登录弹窗实例
const loginModal = new LoginModal();
window.loginModal = loginModal;

// 设置登录按钮
function setupLoginButton() {
    console.log('设置登录按钮监听器...');

    // 直接事件委托
    document.addEventListener('click', (e) => {
        if (e.target.id === 'btn-login' ||
            e.target.classList.contains('btn-login') ||
            (e.target.closest && e.target.closest('#btn-login'))) {
            console.log('登录按钮被点击');
            e.preventDefault();
            if (window.loginModal) {
                window.loginModal.show();
            }
        }
    });

    // 直接为现有按钮添加事件
    setTimeout(() => {
        const loginBtn = document.getElementById('btn-login');
        if (loginBtn) {
            console.log('直接为登录按钮添加事件');
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.loginModal) {
                    window.loginModal.show();
                }
            });
        }
    }, 500);
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 页面加载完成');
    
    setupLoginButton();
    
    setTimeout(() => {
        if (auth && auth.isLoggedIn) {
            console.log('✅ 用户已登录，更新UI');
            auth.updateUI();
        }
    }, 500);
});

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

console.log('✅ auth.js 加载完成');