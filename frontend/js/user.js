// frontend/js/user.js

/**
 * 用户主页功能模块
 * 负责加载和显示用户信息、课程数据
 * 修复了兴趣爱好显示为"未设置"的问题
 */

// 页面初始化
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 用户页面初始化开始...');

    // 检查登录状态
    if (!window.auth || !window.auth.isLoggedIn) {
        console.log('❌ 用户未登录，跳转到首页');
        alert('请先登录！');
        window.location.href = 'index.html';
        return;
    }

    console.log('✅ 用户已登录，开始初始化页面');

    // 初始化用户页面
    initializeUserPage();
});

/**
 * 初始化用户页面
 */
function initializeUserPage() {
    console.log('🔄 初始化用户页面...');

    try {
        // 更新用户头像和欢迎信息（立即执行）
        updateUserWelcome();

        // 加载用户信息
        loadUserProfile();

        // 加载用户课程
        loadUserCourses();

        // 设置导航栏活动状态
        setupUserNav();

        // 设置页面事件监听
        setupEventListeners();

        console.log('✅ 用户页面初始化完成');
    } catch (error) {
        console.error('❌ 初始化用户页面失败:', error);
        showError('页面初始化失败: ' + error.message);
    }
}

/**
 * 更新用户欢迎信息
 */
function updateUserWelcome() {
    try {
        const user = auth.getUser();
        console.log('👤 当前登录用户:', user);

        if (user) {
            // 更新页面标题
            document.title = `${user.username || '用户'} - 个人主页 - 余馨教育`;

            // 立即更新头像和基本信息
            const userNameElement = document.getElementById('userName');
            const userEmailElement = document.getElementById('userEmail');
            const userAvatar = document.querySelector('.user-avatar');

            if (userNameElement) {
                userNameElement.textContent = user.username || '用户';
            }

            if (userEmailElement) {
                userEmailElement.textContent = user.email || '未设置邮箱';
            }

            if (userAvatar) {
                // 根据用户名首字母生成头像
                const firstChar = (user.username || 'U').charAt(0).toUpperCase();
                userAvatar.innerHTML = `
                    <div class="avatar-text" style="font-size: 40px; font-weight: bold;">${firstChar}</div>
                `;
            }

            console.log('✅ 欢迎信息更新完成');
        } else {
            console.warn('⚠️ 未获取到用户信息');
        }
    } catch (error) {
        console.error('❌ 更新欢迎信息失败:', error);
    }
}

/**
 * 加载用户个人资料
 */
async function loadUserProfile() {
    try {
        console.log('📥 正在加载用户资料...');

        // 显示加载状态
        showLoading('正在加载用户信息...');

        // 获取用户信息（优先从本地存储获取）
        const user = auth.getUser();

        if (user) {
            console.log('✅ 从本地存储获取用户数据:', user);
            console.log('🎯 兴趣爱好数据详情:', {
                hobbies: user.hobbies,
                type: typeof user.hobbies,
                isArray: Array.isArray(user.hobbies),
                length: Array.isArray(user.hobbies) ? user.hobbies.length : 'N/A'
            });

            // 延迟显示，避免卡顿
            setTimeout(() => {
                displayUserInfo(user);
                hideLoading();
            }, 300);
        } else {
            // 尝试从API获取（如果可用）
            try {
                console.log('🔄 尝试从API获取用户资料...');
                const response = await fetch('http://localhost:3000/api/user/profile', {
                    headers: {
                        'Authorization': `Bearer ${auth.getToken()}`
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ API返回的用户数据:', result);
                    displayUserInfo(result.user || user);
                } else {
                    console.warn('⚠️ API请求失败，使用本地数据');
                    displayUserInfo(user);
                }
            } catch (apiError) {
                console.warn('⚠️ API不可用，使用本地存储数据:', apiError);
                displayUserInfo(user);
            } finally {
                hideLoading();
            }
        }

    } catch (error) {
        console.error('❌ 加载用户资料失败:', error);
        hideLoading();
        showError('加载用户信息失败: ' + error.message);
    }
}

/**
 * 显示用户信息（核心修复函数）
 */
function displayUserInfo(user) {
    try {
        console.log('📋 显示用户信息开始...');
        console.log('📊 用户数据详情:', user);

        // 确保用户对象存在
        if (!user) {
            console.error('❌ 用户数据为空');
            showError('用户数据为空');
            return;
        }

        // 更新基本信息（再次确保更新）
        document.getElementById('userName').textContent = user.username || '用户';
        document.getElementById('userEmail').textContent = user.email || '未设置邮箱';

        // 构建用户信息网格
        const infoGrid = document.getElementById('userInfoGrid');
        if (!infoGrid) {
            console.error('❌ 找不到用户信息网格容器');
            return;
        }

        // 准备用户数据
        const userData = {
            username: user.username || '--',
            gender: getGenderText(user.sex),
            phone: formatPhoneNumber(user.phone),
            email: user.email || '未设置',
            city: getCityName(user.city),
            education: getEducationName(user.education),
            birthDate: formatBirthDate(user),
            hobbies: formatHobbies(user.hobbies), // 使用修复后的函数
            sign: user.sign || ''
        };

        console.log('🎨 格式化后的爱好:', userData.hobbies);
        console.log('🔍 原始爱好数据:', user.hobbies);

        // 创建信息网格HTML
        const infoHTML = `
            <div class="row g-3">
                <!-- 用户名 -->
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card info-card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">
                                <i class="fas fa-user me-1"></i>用户名
                            </h6>
                            <p class="card-text fw-bold">${userData.username}</p>
                        </div>
                    </div>
                </div>
                
                <!-- 性别 -->
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card info-card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">
                                <i class="fas fa-venus-mars me-1"></i>性别
                            </h6>
                            <p class="card-text">${userData.gender}</p>
                        </div>
                    </div>
                </div>
                
                <!-- 手机号 -->
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card info-card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">
                                <i class="fas fa-phone me-1"></i>手机号
                            </h6>
                            <p class="card-text">${userData.phone}</p>
                        </div>
                    </div>
                </div>
                
                <!-- 邮箱 -->
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card info-card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">
                                <i class="fas fa-envelope me-1"></i>邮箱
                            </h6>
                            <p class="card-text">${userData.email}</p>
                        </div>
                    </div>
                </div>
                
                <!-- 城市 -->
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card info-card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">
                                <i class="fas fa-city me-1"></i>城市
                            </h6>
                            <p class="card-text">${userData.city}</p>
                        </div>
                    </div>
                </div>
                
                <!-- 学历 -->
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card info-card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">
                                <i class="fas fa-graduation-cap me-1"></i>学历
                            </h6>
                            <p class="card-text">${userData.education}</p>
                        </div>
                    </div>
                </div>
                
                <!-- 出生日期 -->
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card info-card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">
                                <i class="fas fa-birthday-cake me-1"></i>出生日期
                            </h6>
                            <p class="card-text">${userData.birthDate}</p>
                        </div>
                    </div>
                </div>
                
                <!-- 兴趣爱好（关键修复部分） -->
                <div class="col-md-6 col-lg-8 mb-3">
                    <div class="card info-card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">
                                <i class="fas fa-heart me-1"></i>兴趣爱好
                            </h6>
                            <p class="card-text">
                                <span class="badge bg-pink-light me-2 mb-1">${userData.hobbies}</span>
                            </p>
                            <small class="text-muted">原始数据: ${JSON.stringify(user.hobbies)}</small>
                        </div>
                    </div>
                </div>
                
                <!-- 个性签名（如果有） -->
                ${userData.sign ? `
                <div class="col-12 mb-3">
                    <div class="card info-card h-100 border-0 shadow-sm bg-light">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">
                                <i class="fas fa-quote-left me-1"></i>个性签名
                            </h6>
                            <p class="card-text signature-text text-center py-2">"${userData.sign}"</p>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        infoGrid.innerHTML = infoHTML;

        // 更新学习统计
        updateLearningStats();

        console.log('✅ 用户信息显示完成');

    } catch (error) {
        console.error('❌ 显示用户信息失败:', error);
        showError('显示用户信息失败: ' + error.message);

        // 显示错误状态
        const infoGrid = document.getElementById('userInfoGrid');
        if (infoGrid) {
            infoGrid.innerHTML = `
                <div class="alert alert-danger">
                    <h5>加载用户信息失败</h5>
                    <p>${error.message}</p>
                    <button class="btn btn-sm btn-outline-danger" onclick="loadUserProfile()">重试</button>
                </div>
            `;
        }
    }
}

/**
 * 【核心修复】格式化兴趣爱好函数
 * 解决显示"未设置"的问题
 */
function formatHobbies(hobbies) {
    console.log('🎯 开始格式化兴趣爱好:', hobbies);

    try {
        // 1. 处理空值
        if (!hobbies) {
            console.log('⚠️ 兴趣爱好为空');
            return '未设置';
        }

        // 2. 如果是字符串，尝试解析
        if (typeof hobbies === 'string') {
            console.log('📝 爱好数据是字符串类型');

            // 尝试解析JSON
            try {
                const parsed = JSON.parse(hobbies);
                console.log('✅ 成功解析JSON:', parsed);
                hobbies = parsed;
            } catch (e) {
                console.log('📝 不是JSON，按逗号分割');
                // 按逗号分割并清理
                hobbies = hobbies.split(',')
                    .map(h => h.trim())
                    .filter(h => h.length > 0);
            }
        }

        // 3. 如果是数组
        if (Array.isArray(hobbies)) {
            console.log('📋 爱好数据是数组类型，长度:', hobbies.length);

            if (hobbies.length === 0) {
                return '未设置';
            }

            // 定义爱好映射表
            const hobbyMap = {
                'cs': 'Counter-Strike2',
                'CS': 'Counter-Strike2',
                'CS2': 'Counter-Strike2',
                'counter-strike': 'Counter-Strike2',
                'lol': 'League of Legend',
                'LOL': 'League of Legend',
                'league': 'League of Legend',
                'Naruto': '火影忍者手游',
                'naruto': '火影忍者手游',
                '火影': '火影忍者手游',
                'Sanjiaozhou': '三角洲行动',
                'sanjiaozhou': '三角洲行动',
                '三角洲': '三角洲行动'
            };

            // 格式化每个爱好
            const formattedHobbies = hobbies.map(hobby => {
                // 清理并转换
                const cleanHobby = String(hobby).trim();
                const mappedHobby = hobbyMap[cleanHobby];

                console.log(`  - "${cleanHobby}" => "${mappedHobby || cleanHobby}"`);

                return mappedHobby || cleanHobby;
            });

            // 去重并连接
            const uniqueHobbies = [...new Set(formattedHobbies)];
            const result = uniqueHobbies.join('、');

            console.log('🎉 格式化结果:', result);
            return result || '未设置';
        }

        // 4. 其他情况
        console.log('❓ 未知数据类型:', typeof hobbies, hobbies);
        return String(hobbies || '未设置');

    } catch (error) {
        console.error('❌ 格式化爱好时出错:', error);
        return '未设置';
    }
}

/**
 * 更新学习统计数据
 */
function updateLearningStats() {
    try {
        const statsSection = document.getElementById('progressStats');
        if (!statsSection) return;

        // 模拟学习统计数据
        const stats = {
            totalCourses: 4,
            completedCourses: 1,
            totalHours: 45,
            learningDays: 12,
            averageScore: 85
        };

        const statsHTML = `
            <div class="row g-3">
                <div class="col-md-3 col-sm-6">
                    <div class="stat-card text-center p-3 border rounded-3 bg-white shadow-sm">
                        <div class="stat-number text-pink fw-bold fs-3">${stats.totalCourses}</div>
                        <div class="stat-label text-muted">总课程数</div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="stat-card text-center p-3 border rounded-3 bg-white shadow-sm">
                        <div class="stat-number text-pink fw-bold fs-3">${stats.completedCourses}</div>
                        <div class="stat-label text-muted">已完成</div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="stat-card text-center p-3 border rounded-3 bg-white shadow-sm">
                        <div class="stat-number text-pink fw-bold fs-3">${stats.totalHours}h</div>
                        <div class="stat-label text-muted">学习时长</div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="stat-card text-center p-3 border rounded-3 bg-white shadow-sm">
                        <div class="stat-number text-pink fw-bold fs-3">${stats.averageScore}分</div>
                        <div class="stat-label text-muted">平均成绩</div>
                    </div>
                </div>
            </div>
            
            <div class="mt-4">
                <h5 class="mb-3 border-bottom pb-2">学习进度概览</h5>
                <div class="progress-chart">
                    <div class="progress-item mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span class="fw-medium">Web应用开发</span>
                            <span class="text-pink">75%</span>
                        </div>
                        <div class="progress" style="height: 10px;">
                            <div class="progress-bar bg-pink" style="width: 75%"></div>
                        </div>
                    </div>
                    <div class="progress-item mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span class="fw-medium">Unity游戏开发</span>
                            <span class="text-pink">40%</span>
                        </div>
                        <div class="progress" style="height: 10px;">
                            <div class="progress-bar bg-pink" style="width: 40%"></div>
                        </div>
                    </div>
                    <div class="progress-item mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span class="fw-medium">数字图像处理</span>
                            <span class="text-pink">60%</span>
                        </div>
                        <div class="progress" style="height: 10px;">
                            <div class="progress-bar bg-pink" style="width: 60%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        statsSection.innerHTML = statsHTML;

    } catch (error) {
        console.error('❌ 更新学习统计失败:', error);
    }
}

/**
 * 加载用户课程
 */
function loadUserCourses() {
    try {
        const courseList = document.getElementById('courseList');
        if (!courseList) return;

        console.log('📚 加载用户课程...');

        // 模拟课程数据
        const courses = [
            {
                id: 1,
                title: 'Web应用开发',
                description: '学习现代Web开发技术，包括HTML5、CSS3、JavaScript等',
                progress: 75,
                image: 'Web.png',
                teacher: '张老师',
                startDate: '2024-01-15',
                totalLessons: 24,
                completedLessons: 18
            },
            {
                id: 2,
                title: 'Unity游戏开发',
                description: '掌握Unity引擎，开发2D/3D游戏应用',
                progress: 40,
                image: 'Unity.png',
                teacher: '李老师',
                startDate: '2024-02-01',
                totalLessons: 20,
                completedLessons: 8
            },
            {
                id: 3,
                title: '数字图像处理',
                description: '学习图像处理基础理论和实践应用',
                progress: 60,
                image: 'Digital Image.png',
                teacher: '王老师',
                startDate: '2024-01-20',
                totalLessons: 18,
                completedLessons: 11
            },
            {
                id: 4,
                title: '工程创新实践训练（三）',
                description: '工程实践与创新能力培养',
                progress: 20,
                image: 'CXGC.jpg',
                teacher: '陈老师',
                startDate: '2024-03-01',
                totalLessons: 16,
                completedLessons: 3
            }
        ];

        // 构建课程卡片HTML
        const courseHTML = courses.map(course => `
            <div class="col-md-6 col-lg-4 col-xl-3 mb-4">
                <div class="card course-card h-100 border-0 shadow-sm hover-shadow">
                    <div class="course-img-container position-relative">
                        <img src="../images/${course.image}" 
                             class="card-img-top" 
                             alt="${course.title}"
                             style="height: 160px; object-fit: cover;">
                        <div class="course-badge position-absolute top-0 end-0 m-2">
                            <span class="badge bg-pink">进行中</span>
                        </div>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title course-title fw-bold">${course.title}</h5>
                        <p class="card-text text-muted small flex-grow-1">
                            ${course.description}
                        </p>
                        
                        <div class="mt-2">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <small class="text-muted">
                                    <i class="fas fa-chalkboard-teacher me-1"></i>${course.teacher}
                                </small>
                                <small class="text-muted">
                                    <i class="fas fa-book me-1"></i>${course.completedLessons}/${course.totalLessons}
                                </small>
                            </div>
                            
                            <div class="progress mb-2" style="height: 8px;">
                                <div class="progress-bar bg-pink" style="width: ${course.progress}%"></div>
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">进度: ${course.progress}%</small>
                                <small class="text-muted">
                                    <i class="fas fa-calendar me-1"></i>${course.startDate}
                                </small>
                            </div>
                        </div>
                        
                        <div class="mt-3 d-grid gap-2">
                            <button class="btn btn-sm btn-pink" onclick="continueLearning(${course.id})">
                                <i class="fas fa-play-circle me-1"></i>继续学习
                            </button>
                            <button class="btn btn-sm btn-outline-pink" onclick="viewCourseDetails(${course.id})">
                                <i class="fas fa-info-circle me-1"></i>课程详情
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        courseList.innerHTML = `
            <div class="row g-3">
                ${courseHTML}
            </div>
        `;

        console.log('✅ 课程加载完成');

    } catch (error) {
        console.error('❌ 加载课程失败:', error);
        const courseList = document.getElementById('courseList');
        if (courseList) {
            courseList.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    加载课程失败: ${error.message}
                </div>
            `;
        }
    }
}

/**
 * 设置用户导航栏活动状态
 */
function setupUserNav() {
    try {
        const navLinks = document.querySelectorAll('.user-nav .list-group-item');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                // 移除所有active类
                navLinks.forEach(l => l.classList.remove('active'));

                // 添加当前active类
                link.classList.add('active');

                // 滚动到对应区域
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    window.scrollTo({
                        top: targetSection.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // 根据当前URL激活对应导航项
        const currentHash = window.location.hash || '#profile';
        const currentLink = document.querySelector(`.user-nav .list-group-item[href="${currentHash}"]`);
        if (currentLink) {
            currentLink.classList.add('active');
        }

    } catch (error) {
        console.error('❌ 设置导航失败:', error);
    }
}

/**
 * 设置页面事件监听
 */
function setupEventListeners() {
    try {
        // 编辑个人信息按钮
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', function () {
                alert('编辑个人信息功能开发中...');
            });
        }

        // 退出登录按钮
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function () {
                if (confirm('确定要退出登录吗？')) {
                    auth.logout();
                }
            });
        }

        // 返回首页按钮
        const backHomeBtn = document.getElementById('backHomeBtn');
        if (backHomeBtn) {
            backHomeBtn.addEventListener('click', function () {
                window.location.href = 'YuXin05.html';
            });
        }

        // 页面滚动时更新导航状态
        window.addEventListener('scroll', updateNavOnScroll);

        console.log('✅ 事件监听器设置完成');

    } catch (error) {
        console.error('❌ 设置事件监听失败:', error);
    }
}

/**
 * 页面滚动时更新导航状态
 */
function updateNavOnScroll() {
    try {
        const sections = document.querySelectorAll('.user-section');
        const navLinks = document.querySelectorAll('.user-nav .list-group-item');

        let currentSectionId = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.clientHeight;

            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSectionId = '#' + section.id;
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentSectionId) {
                link.classList.add('active');
            }
        });

    } catch (error) {
        // 静默处理滚动事件错误
    }
}

/**
 * 继续学习课程
 */
function continueLearning(courseId) {
    console.log('🎮 继续学习课程:', courseId);

    const courseLinks = {
        1: 'https://mooc2-ans.chaoxing.com/mooc2-ans/mycourse/stu?courseid=254816963&clazzid=126346929&cpi=279976322&enc=22f51db5b6d8cf60b083baa21dca18d9&t=1764924665048&pageHeader=21&v=2&hideHead=0',
        2: 'https://mooc2-ans.chaoxing.com/mooc2-ans/mycourse/stu?courseid=250446686&clazzid=116171323&cpi=279976322&enc=7e4745463df2f27122f76b98d719c508&t=1764925090899&pageHeader=21&v=2&hideHead=0',
        3: 'https://mooc2-ans.chaoxing.com/mooc2-ans/mycourse/stu?courseid=255021473&clazzid=126884990&cpi=279976322&enc=cf3012b131ce9b72386fd4bf0dceac18&t=1764924968258&pageHeader=21&v=2&hideHead=0',
        4: 'https://mooc2-ans.chaoxing.com/mooc2-ans/mycourse/stu?courseid=255449864&clazzid=128013214&cpi=279976322&enc=35419f23eb92c808abebaa66765aad5f&t=1764925281543&pageHeader=21&v=2&hideHead=0'
    };

    const link = courseLinks[courseId];
    if (link) {
        window.open(link, '_blank');
    } else {
        alert('课程链接未找到，请稍后再试');
    }
}

/**
 * 查看课程详情
 */
function viewCourseDetails(courseId) {
    console.log('📖 查看课程详情:', courseId);

    const courseName = ['Web应用开发', 'Unity游戏开发', '数字图像处理', '工程创新实践训练（三）'][courseId - 1] || '未知课程';

    // 创建详情弹窗
    const modalHTML = `
        <div class="modal fade" id="courseDetailModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${courseName} - 课程详情</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>课程详情页面正在开发中...</p>
                        <p>点击"继续学习"按钮可以直接开始学习。</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 如果已经有modal，先移除
    const existingModal = document.getElementById('courseDetailModal');
    if (existingModal) {
        existingModal.remove();
    }

    // 添加modal到页面
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // 显示modal
    const modal = new bootstrap.Modal(document.getElementById('courseDetailModal'));
    modal.show();
}

// ================= 工具函数 =================

/**
 * 获取性别文本
 */
function getGenderText(genderCode) {
    const genderMap = {
        'man': '男',
        'woman': '女',
        'male': '男',
        'female': '女',
        '男': '男',
        '女': '女'
    };
    return genderMap[genderCode] || '未设置';
}

/**
 * 格式化手机号
 */
function formatPhoneNumber(phone) {
    if (!phone) return '未设置';

    // 简单格式化：中间加空格
    if (phone.length === 11) {
        return `${phone.substring(0, 3)} **** ${phone.substring(7)}`;
    }
    return phone;
}

/**
 * 获取城市名称
 */
function getCityName(cityCode) {
    const cityMap = {
        'Beijing': '北京',
        'beijing': '北京',
        'shanghai': '上海',
        'Shanghai': '上海',
        'Guangzhou': '广州',
        'guangzhou': '广州',
        'Shenzhen': '深圳',
        'shenzhen': '深圳'
    };
    return cityMap[cityCode] || cityCode || '未设置';
}

/**
 * 获取学历名称
 */
function getEducationName(educationCode) {
    const educationMap = {
        '1': '职中/高中',
        '2': '大专',
        '3': '本科',
        '4': '研究生',
        '5': '博士'
    };
    return educationMap[educationCode] || educationCode || '未设置';
}

/**
 * 格式化出生日期
 */
function formatBirthDate(user) {
    if (user.birth_year && user.birth_month && user.birth_day) {
        return `${user.birth_year}年${user.birth_month}月${user.birth_day}日`;
    }
    return '未设置';
}

// ================= UI 辅助函数 =================

/**
 * 显示加载状态
 */
function showLoading(message = '加载中...') {
    // 移除现有的加载状态
    hideLoading();

    // 创建加载遮罩
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loadingOverlay';
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loading-content text-center">
            <div class="spinner-border text-pink" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <div class="loading-text mt-3 fw-medium">${message}</div>
        </div>
    `;

    // 添加样式
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;

    // 添加到页面
    document.body.appendChild(loadingOverlay);
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

/**
 * 显示错误信息
 */
function showError(message) {
    // 创建错误提示
    const errorAlert = document.createElement('div');
    errorAlert.className = 'alert alert-danger alert-dismissible fade show position-fixed';
    errorAlert.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    errorAlert.innerHTML = `
        <strong><i class="fas fa-exclamation-circle me-1"></i>错误！</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // 添加到页面
    document.body.appendChild(errorAlert);

    // 5秒后自动消失
    setTimeout(() => {
        if (errorAlert.parentNode) {
            errorAlert.remove();
        }
    }, 5000);
}

/**
 * 显示成功信息
 */
function showSuccess(message) {
    // 创建成功提示
    const successAlert = document.createElement('div');
    successAlert.className = 'alert alert-success alert-dismissible fade show position-fixed';
    successAlert.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    successAlert.innerHTML = `
        <strong><i class="fas fa-check-circle me-1"></i>成功！</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // 添加到页面
    document.body.appendChild(successAlert);

    // 3秒后自动消失
    setTimeout(() => {
        if (successAlert.parentNode) {
            successAlert.remove();
        }
    }, 3000);
}

// ================= 全局导出 =================

/**
 * 导出函数到全局作用域
 */
window.loadUserProfile = loadUserProfile;
window.loadUserCourses = loadUserCourses;
window.setupUserNav = setupUserNav;
window.continueLearning = continueLearning;
window.viewCourseDetails = viewCourseDetails;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showError = showError;
window.showSuccess = showSuccess;

console.log('✅ user.js 加载完成 - 版本: 1.2.0 (修复兴趣爱好显示问题)');

// 添加一些CSS样式增强
document.addEventListener('DOMContentLoaded', function () {
    const style = document.createElement('style');
    style.textContent = `
        .bg-pink { background-color: #FD8291 !important; }
        .text-pink { color: #FD8291 !important; }
        .bg-pink-light { background-color: #ffe6ea !important; color: #c44569; }
        .btn-pink { 
            background-color: #FD8291 !important; 
            color: white !important; 
            border-color: #FD8291 !important;
        }
        .btn-outline-pink { 
            color: #FD8291 !important; 
            border-color: #FD8291 !important;
        }
        .btn-outline-pink:hover { 
            background-color: #FD8291 !important; 
            color: white !important;
        }
        .signature-text { 
            font-style: italic; 
            color: #666;
            font-size: 1.1em;
        }
        .hover-shadow {
            transition: all 0.3s ease;
        }
        .hover-shadow:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
        .info-card {
            transition: all 0.3s ease;
        }
        .info-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.08) !important;
        }
    `;
    document.head.appendChild(style);
});