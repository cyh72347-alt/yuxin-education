console.log('=== TOOL.JS 开始执行 ===');
document.addEventListener('DOMContentLoaded', function () {
    console.log('🎨 开始修复页面层级...');

    // 等待一切加载完成
    setTimeout(applyLayerFix, 500);
});

function applyLayerFix() {
    // 1. 给导航栏设置明确的z-index
    const nav = document.querySelector('nav.navbar');
    if (nav) {
        Object.assign(nav.style, {
            position: 'relative',
            zIndex: '1030', // Bootstrap默认的导航栏z-index
            background: '#FD8291 !important',
            borderBottom: '30px solid #ece9e9 !important'
        });
        console.log('✅ 导航栏层级修复');
    }

    // 2. 给落叶容器设置极低的z-index
    const leaves = document.getElementById('leaves-container');
    if (!leaves) {
        // 如果没有，创建一个
        createLeavesContainer();
        console.log('✅ 创建落叶容器');
    } else {
        leaves.style.zIndex = '-9999';
        console.log('✅ 落叶容器层级修复');
    }

    // 3. 给主要内容设置中间层
    const mainContainers = document.querySelectorAll('.container, .container-fluid, main, .card, footer');
    mainContainers.forEach(container => {
        container.style.position = 'relative';
        container.style.zIndex = '1';
    });
    console.log(`✅ ${mainContainers.length} 个主要内容容器修复`);

    // 4. 添加CSS规则到head
    addLayerStyles();

    console.log('🎉 页面层级修复完成');
}

function createLeavesContainer() {
    const container = document.createElement('div');
    container.id = 'leaves-container';

    Object.assign(container.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: '-9999',
        overflow: 'hidden'
    });

    // 生成叶子
    generateLeaves(container);

    document.body.insertBefore(container, document.body.firstChild);
}

function generateLeaves(container) {
    const colors = ['#e67e22', '#e74c3c', '#d35400', '#f39c12', '#f1c40f'];

    for (let i = 0; i < 35; i++) {
        const leaf = document.createElement('div');

        Object.assign(leaf.style, {
            position: 'absolute',
            top: '-50px',
            left: `${Math.random() * 100}%`,
            width: `${12 + Math.random() * 20}px`,
            height: `${12 + Math.random() * 20}px`,
            background: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: getRandomShape(),
            opacity: '0',
            animation: `leafFall ${10 + Math.random() * 15}s linear ${Math.random() * 5}s infinite`
        });

        container.appendChild(leaf);
    }
}

function getRandomShape() {
    const shapes = ['50%', '30% 70% 70% 30% / 30% 30% 70% 70%', '50% 0 50% 0'];
    return shapes[Math.floor(Math.random() * shapes.length)];
}

function addLayerStyles() {
    const style = document.createElement('style');
    style.id = 'layer-fix-styles';

    style.textContent = `
        /* 强制层级修复 */
        nav.navbar {
            position: relative !important;
            z-index: 1030 !important;
            background-color: #FD8291 !important;
            border-bottom: 30px solid #ece9e9 !important;
        }
        
        #leaves-container {
            z-index: -9999 !important;
        }
        
        .container, .container-fluid, main, .card, footer {
            position: relative !important;
            z-index: 1 !important;
        }
        
        @keyframes leafFall {
            0% { transform: translateY(-100px) rotate(0deg); opacity: 0; }
            10% { opacity: 0.7; }
            90% { opacity: 0.7; }
            100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
    `;

    document.head.appendChild(style);
}

// 提供调试方法
window.layerDebug = {
    showLayers: function () {
        console.log('📊 当前层级信息:');

        const elements = [
            { selector: 'nav.navbar', name: '导航栏' },
            { selector: '#leaves-container', name: '落叶容器' },
            { selector: '.container:first-child', name: '内容容器' },
            { selector: 'footer', name: '页脚' }
        ];

        elements.forEach(item => {
            const el = document.querySelector(item.selector);
            if (el) {
                const style = window.getComputedStyle(el);
                console.log(`${item.name}: z-index = ${style.zIndex}, position = ${style.position}`);
            }
        });
    }
};

/*回到顶部按钮*/
const backToTopBtn = document.getElementById('backToTop');
if (backToTopBtn) {
// 滚动显示按钮
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
});

// 点击回到顶部
backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});
console.log('✅ 回到顶部按钮初始化完成');
} else {
    console.log('⚠️ 回到顶部按钮不存在，跳过初始化');
}

// music-player.js - 完整独立音乐播放器
console.log('=== 开始创建音乐播放器 ===');
 
(function() {
    'use strict';
    
    // 创建样式
    const style = document.createElement('style');
    style.textContent = `
        #musicPlayerBtn {
            position: fixed;
            top: 120px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #ee6d69ff 0%, #fadcecff 100%);
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            z-index: 1000;
            box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
            user-select: none;
            border: 2px solid white;
        }
        
        #musicPlayerBtn:hover {
            transform: scale(1.1);
        }
        
        #musicPlayerBtn.playing {
            background: linear-gradient(135deg, #f2b7f8ff 0%, #f5576c 100%);
            animation: spin 2s linear infinite;
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    // 创建元素
    const btn = document.createElement('div');
    btn.id = 'musicPlayerBtn';
    btn.innerHTML = '♪';
    btn.title = '点击播放/暂停音乐';
    
    const audio = document.createElement('audio');
    audio.id = 'backgroundMusic';
    audio.loop = true;
    audio.volume = 0.7;
    
    // 使用你正确的音乐URL
    audio.src = '/images/M500001kIWDl2qDBvV.mp3';
    
    // 添加到页面
    document.body.appendChild(btn);
    document.body.appendChild(audio);
    
    // 从LocalStorage获取播放状态
    function getPlaybackState() {
        const state = localStorage.getItem('musicPlayerState');
        return state ? JSON.parse(state) : {
            isPlaying: false,
            currentTime: 0,
            volume: 0.7
        };
    }
    
    // 保存播放状态到LocalStorage
    function savePlaybackState(isPlaying, currentTime, volume) {
        const state = {
            isPlaying: isPlaying,
            currentTime: currentTime,
            volume: volume,
            timestamp: Date.now()
        };
        localStorage.setItem('musicPlayerState', JSON.stringify(state));
    }
    
    // 定时保存当前播放位置
    function startAutoSave() {
        setInterval(() => {
            if (!audio.paused) {
                savePlaybackState(true, audio.currentTime, audio.volume);
            }
        }, 2000); // 每2秒保存一次
    }
    
    // 初始化播放器
    function initPlayer() {
        const savedState = getPlaybackState();
        
        // 设置音量
        audio.volume = savedState.volume;
        
        // 如果是播放状态，且保存时间在5分钟内，则自动播放
        const timeDiff = Date.now() - (savedState.timestamp || 0);
        const shouldAutoPlay = savedState.isPlaying && timeDiff < 5 * 60 * 1000;
        
        if (shouldAutoPlay) {
            // 尝试从上次位置开始播放
            audio.currentTime = savedState.currentTime || 0;
            
            // 延迟一点播放，确保页面加载完成
            setTimeout(() => {
                audio.play()
                    .then(() => {
                        btn.classList.add('playing');
                        console.log('从上次位置继续播放');
                    })
                    .catch(e => {
                        console.log('自动播放被阻止，需要用户点击');
                        // 保存为暂停状态
                        savePlaybackState(false, 0, audio.volume);
                    });
            }, 500);
        } else {
            // 重置为暂停状态
            savePlaybackState(false, 0, audio.volume);
        }
        
        // 开始自动保存
        startAutoSave();
    }
    
    // 点击事件处理
    btn.addEventListener('click', function() {
        if (audio.paused) {
            audio.play()
                .then(() => {
                    btn.classList.add('playing');
                    savePlaybackState(true, audio.currentTime, audio.volume);
                })
                .catch(e => {
                    console.error('播放失败:', e);
                });
        } else {
            audio.pause();
            btn.classList.remove('playing');
            savePlaybackState(false, audio.currentTime, audio.volume);
        }
    });
    
    // 监听音频结束事件（循环播放时不会触发）
    audio.addEventListener('ended', () => {
        savePlaybackState(false, 0, audio.volume);
    });
    
    // 页面卸载前保存状态
    window.addEventListener('beforeunload', () => {
        savePlaybackState(!audio.paused, audio.currentTime, audio.volume);
    });
    
    // 页面可见性变化处理（切换标签页）
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            savePlaybackState(!audio.paused, audio.currentTime, audio.volume);
        }
    });
    
    // 初始化
    document.addEventListener('DOMContentLoaded', initPlayer);
    
    // 导出API
    window.musicPlayer = {
        play: () => {
            audio.play();
            btn.classList.add('playing');
            savePlaybackState(true, audio.currentTime, audio.volume);
        },
        pause: () => {
            audio.pause();
            btn.classList.remove('playing');
            savePlaybackState(false, audio.currentTime, audio.volume);
        },
        toggle: () => btn.click(),
        setVolume: (vol) => {
            audio.volume = vol;
            savePlaybackState(!audio.paused, audio.currentTime, vol);
        }
    };
})();