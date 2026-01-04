// ========== Supabase 配置 ==========
const SUPABASE_URL = 'https://nqenhynmsrvbmphyjqwv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_gEQD1u5KML6aoQ3Y1qlVKw_ePu9lgre';
// ⚠️ 请从这里获取：Supabase -> Settings -> API -> Secret keys -> service_role
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZW5oeW5tc3J2Ym1waHlqcXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzM0NjkxMSwiZXhwIjoyMDgyOTIyOTExfQ.LG2v4d-quI1KU_CXY92BuXCbVWRW7blrWmXHrHE5MPs';

// 全局Supabase客户端（避免重复创建）
let supabaseAnonClient = null;
let supabaseServiceClient = null;

// 获取anon客户端
function getAnonClient() {
    if (!supabaseAnonClient && window.supabase) {
        supabaseAnonClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false
            }
        });
        console.log('✅ 创建Anon客户端');
    }
    return supabaseAnonClient;
}

// 获取service_role客户端
function getServiceClient() {
    if (!supabaseServiceClient && window.supabase) {
        supabaseServiceClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        console.log('✅ 创建Service客户端');
    }
    return supabaseServiceClient;
}

// ========== 核心注册函数 ==========
async function handleSubmit(event) {
    event.preventDefault();
    console.log('🎯 开始注册...');

    // 收集数据
    const formData = {
        username: document.getElementById('username-input').value.trim(),
        password: document.getElementById('password-input').value,
        phone: document.getElementById('number-input').value.trim() || null,
        email: document.getElementById('email-input').value.trim() || null,
        sex: document.querySelector('input[name="sex"]:checked')?.value || 'man',
        education: document.getElementById('education-input').value,
        city: document.getElementById('city-input').value,
        birth_year: parseInt(document.getElementById('birth-year').value) || 2000,
        birth_month: parseInt(document.getElementById('birth-month').value) || 1,
        birth_day: parseInt(document.getElementById('birth-day').value) || 1,
        sign: document.getElementById('sign-input').value.trim() || null,
        hobbies: []
    };

    // 收集爱好
    document.querySelectorAll('input[name="hobbies"]:checked').forEach(checkbox => {
        formData.hobbies.push(checkbox.value);
    });

    // 验证
    if (!formData.username || !formData.password) {
        alert('请填写用户名和密码！');
        return false;
    }

    // 按钮状态
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '注册中...';
    submitBtn.disabled = true;

    try {
        // 1. 检查Supabase SDK是否加载
        if (!window.supabase) {
            throw new Error('Supabase SDK未加载，请刷新页面重试');
        }

        // 2. 获取anon客户端
        const supabaseAnon = getAnonClient();
        if (!supabaseAnon) {
            throw new Error('无法创建Supabase客户端');
        }

        // 3. 准备邮箱
        const userEmail = formData.email || `${formData.username}@yuxin.com`;
        
        console.log('🔄 步骤1: 注册用户到Auth...');
        console.log('📧 使用邮箱:', userEmail);
        
        // 4. 注册用户
        const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
            email: userEmail,
            password: formData.password,
            options: {
                data: {
                    username: formData.username,
                    phone: formData.phone
                }
            }
        });

        if (authError) {
            console.error('❌ Auth注册错误:', authError);
            throw new Error(authError.message || '注册失败');
        }

        if (!authData.user) {
            throw new Error('用户创建失败，未返回用户数据');
        }

        console.log('✅ Auth注册成功，用户ID:', authData.user.id);
        console.log('🎭 会话状态:', authData.session ? '已登录' : '未登录');

        // 5. 创建用户档案（使用service_role绕过RLS）
        console.log('🔄 步骤2: 创建用户档案...');
        
        // 使用服务端密钥创建档案
        const supabaseService = getServiceClient();
        let profileCreated = false;
        
        if (supabaseService) {
            try {
                const { data: profileData, error: profileError } = await supabaseService
                    .from('user_profiles')
                    .insert([
                        {
                            auth_id: authData.user.id,
                            username: formData.username,
                            phone: formData.phone,
                            email: formData.email || userEmail,
                            sex: formData.sex,
                            education: formData.education,
                            city: formData.city,
                            birth_year: formData.birth_year,
                            birth_month: formData.birth_month,
                            birth_day: formData.birth_day,
                            hobbies: formData.hobbies.length > 0 ? formData.hobbies : null,
                            sign: formData.sign,
                            created_at: new Date().toISOString()
                        }
                    ])
                    .select()
                    .single();
                
                if (profileError) {
                    console.warn('⚠️ Service角色插入失败:', profileError.message);
                } else {
                    console.log('✅ 用户档案创建成功:', profileData);
                    profileCreated = true;
                }
            } catch (serviceError) {
                console.warn('⚠️ Service客户端错误:', serviceError.message);
            }
        }

        // 6. 如果service_role失败，尝试其他方法
        if (!profileCreated) {
            console.log('🔄 尝试备用方案...');
            
            // 尝试使用anon密钥直接插入
            try {
                const { data: profileData, error: profileError } = await supabaseAnon
                    .from('user_profiles')
                    .insert([
                        {
                            auth_id: authData.user.id,
                            username: formData.username,
                            phone: formData.phone,
                            email: formData.email || userEmail,
                            sex: formData.sex,
                            education: formData.education,
                            city: formData.city,
                            birth_year: formData.birth_year,
                            birth_month: formData.birth_month,
                            birth_day: formData.birth_day,
                            hobbies: formData.hobbies.length > 0 ? formData.hobbies : null,
                            sign: formData.sign,
                            created_at: new Date().toISOString()
                        }
                    ])
                    .select()
                    .single();
                
                if (profileError) {
                    console.warn('⚠️ Anon插入也失败，但继续注册流程');
                } else {
                    console.log('✅ Anon插入成功');
                    profileCreated = true;
                }
            } catch (anonError) {
                console.warn('⚠️ Anon插入异常:', anonError.message);
            }
        }

        // 7. 保存用户数据到本地
        const userData = {
            id: authData.user.id,
            username: formData.username,
            email: userEmail,
            phone: formData.phone,
            sex: formData.sex,
            city: formData.city,
            education: formData.education,
            hobbies: formData.hobbies,
            sign: formData.sign,
            birth_year: formData.birth_year,
            birth_month: formData.birth_month,
            birth_day: formData.birth_day,
            profile_created: profileCreated
        };
        
        localStorage.setItem('yuxin_user', JSON.stringify(userData));
        
        // 保存token（如果有）
        if (authData.session?.access_token) {
            localStorage.setItem('yuxin_token', authData.session.access_token);
            console.log('✅ Token已保存');
        }

        // 8. 清空表单
        document.getElementById('registerForm').reset();
        initDateSelectors();

        // 9. 显示成功消息
        alert('🎉 注册成功！\n\n现在可以登录使用系统。');
        
        // 10. 跳转到首页（让用户手动登录）
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1500);

    } catch (error) {
        console.error('❌ 注册过程失败:', error);
        
        // 友好的错误提示
        let errorMessage = error.message || '注册失败，请稍后重试';
        
        if (errorMessage.includes('User already registered')) {
            errorMessage = '该邮箱已被注册，请使用其他邮箱或直接登录';
        } else if (errorMessage.includes('Invalid login credentials')) {
            errorMessage = '用户名或密码格式不正确';
        } else if (errorMessage.includes('Password should be at least')) {
            errorMessage = '密码强度不足，请使用更复杂的密码';
        }
        
        alert(errorMessage);
        
        // 恢复按钮状态
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
    
    return false;
}

// ========== 日期选择器函数 ==========
function initDateSelectors() {
    try {
        const yearSelect = document.getElementById('birth-year');
        const monthSelect = document.getElementById('birth-month');
        const daySelect = document.getElementById('birth-day');
        
        if (!yearSelect || !monthSelect || !daySelect) {
            console.warn('⚠️ 日期选择器元素未找到');
            return;
        }
        
        const currentYear = new Date().getFullYear();
        
        // 生成年份
        if (yearSelect.options.length <= 1) {
            for (let year = currentYear; year >= 1900; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year + '年';
                yearSelect.appendChild(option);
            }
        }
        
        // 生成月份
        if (monthSelect.options.length <= 1) {
            for (let month = 1; month <= 12; month++) {
                const option = document.createElement('option');
                option.value = month;
                option.textContent = month + '月';
                monthSelect.appendChild(option);
            }
        }
        
        // 设置默认值
        if (!yearSelect.value) yearSelect.value = currentYear - 20;
        if (!monthSelect.value) monthSelect.value = new Date().getMonth() + 1;
        
        // 生成日期
        generateDays(yearSelect.value, monthSelect.value);
        
        console.log('✅ 日期选择器初始化完成');
        
    } catch (error) {
        console.error('❌ 初始化日期选择器失败:', error);
    }
}

function generateDays(year, month) {
    const daySelect = document.getElementById('birth-day');
    if (!daySelect) return;
    
    // 保存当前选中的日期
    const currentDay = daySelect.value;
    daySelect.innerHTML = '<option value="">-- 日 --</option>';
    
    if (!year || !month) {
        console.warn('⚠️ 年份或月份为空，无法生成日期');
        return;
    }
    
    // 计算月份天数
    let daysInMonth = 31;
    if (month === 2) {
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        daysInMonth = isLeapYear ? 29 : 28;
    } else if ([4, 6, 9, 11].includes(month)) {
        daysInMonth = 30;
    }
    
    // 生成日期选项
    for (let day = 1; day <= daysInMonth; day++) {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day + '日';
        daySelect.appendChild(option);
    }
    
    // 恢复之前选中的日期或设置默认值
    if (currentDay && currentDay <= daysInMonth) {
        daySelect.value = currentDay;
    } else {
        daySelect.value = Math.min(15, daysInMonth);
    }
}

// ========== 页面初始化 ==========
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 注册页面初始化');
    
    // 初始化日期选择器
    initDateSelectors();
    
    // 绑定日期选择器事件
    const yearSelect = document.getElementById('birth-year');
    const monthSelect = document.getElementById('birth-month');
    
    if (yearSelect) {
        yearSelect.addEventListener('change', function () {
            generateDays(this.value, document.getElementById('birth-month').value);
        });
    }
    
    if (monthSelect) {
        monthSelect.addEventListener('change', function () {
            generateDays(document.getElementById('birth-year').value, this.value);
        });
    }
    
    // 检查Supabase SDK是否加载
    if (!window.supabase) {
        console.error('❌ Supabase SDK未加载');
        alert('页面加载异常，请刷新页面重试');
    } else {
        console.log('✅ Supabase SDK已加载');
    }
});

// ========== 全局导出 ==========
window.handleSubmit = handleSubmit;
window.initDateSelectors = initDateSelectors;
window.generateDays = generateDays;

console.log('✅ register.js 加载完成');