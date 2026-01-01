$(document).ready(function() {
    const firebaseConfig = {
        apiKey: API_CONFIG.API_KEY,
        authDomain: API_CONFIG.AUTH_DOMAIN,
        projectId: API_CONFIG.PROJECT_ID,
        storageBucket: API_CONFIG.STORAGE_BUCKET,
        messagingSenderId: API_CONFIG.MESSAGING_SENDER_ID,
        appId: API_CONFIG.APP_ID
    };

    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    $('.textbox-container').hide();
    $('.video-container').hide();
    
    const $videoIntro = $('#video-intro');
    const $videoLoop = $('#video-loop');
    const $audio = $('#background-audio')[0];
    const $textboxContainer = $('.textbox-container');
    const $startScreen = $('#startScreen');
    const $videoContainer = $('.video-container');
    const $blurOverlay = $('.blur-overlay');
    
    let audioUnlocked = false;
    
    $('#startButton').on('click', function() {
        startExperience();
    });
    
    $startScreen.on('click', function(e) {
        if (e.target === this) { 
            startExperience();
        }
    });
    
    function startExperience() {
        $startScreen.fadeOut(800, function() {
            $videoContainer.show().addClass('active');
            
            unlockAudio();
            
            initVideoSequence();
        });
    }
    
    function unlockAudio() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            try {
                const audioContext = new AudioContext();
                const buffer = audioContext.createBuffer(1, 1, 22050);
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start(0);
                
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                
                console.log("Audio context unlocked");
            } catch(e) {
                console.log("Web Audio API not supported:", e);
            }
        }
        
        const silentAudio = new Audio();
        silentAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
        silentAudio.volume = 0.001;
        silentAudio.play().then(() => {
            console.log("Silent audio played to unlock");
            silentAudio.pause();
        }).catch(e => {
            console.log("Silent audio play failed:", e);
        });
    }
    
    function initVideoSequence() {
        $videoLoop.hide();
        
        $videoIntro.prop('playsinline', true);
        $videoIntro.prop('webkit-playsinline', true);
        $videoIntro.prop('muted', true); 
        
        const videoPromise = $videoIntro[0].play();
        
        if (videoPromise !== undefined) {
            videoPromise.then(() => {
                console.log("Video playing (muted)");
                
                setTimeout(() => {
                    $videoIntro.prop('muted', false);
                    console.log("Video unmuted");
                }, 100);
                
            }).catch(error => {
                console.log("Video autoplay prevented:", error);
                showVideoFallback();
            });
        }
        
        setTimeout(() => {
            playBackgroundAudio();
        }, 12000);
    }
    
    function playBackgroundAudio() {
        $audio.currentTime = 0;
        $audio.volume = 0.8;
        $audio.muted = false;
        
        const audioPromise = $audio.play();
        
        if (audioPromise !== undefined) {
            audioPromise.then(() => {
                console.log("Audio playing successfully");
                audioUnlocked = true;
            }).catch(error => {
                console.log("Audio play failed:", error);
                
                if (!audioUnlocked) {
                    showAudioEnableButton();
                }
            });
        }
    }
    
    function showAudioEnableButton() {
        const audioButton = $(`
            <div class="audio-enable-overlay">
                <div class="audio-enable-content">
                    <p>Áudio não foi carregado automaticamente</p>
                    <button class="btn-enable-audio">ATIVAR ÁUDIO</button>
                </div>
            </div>
        `);
        
        $('body').append(audioButton);
        
        $('.btn-enable-audio').on('click', function() {
            $audio.play().then(() => {
                audioUnlocked = true;
                audioButton.fadeOut(300, function() {
                    $(this).remove();
                });
            }).catch(e => {
                console.log("Still can't play audio:", e);
                alert("Não foi possível ativar o áudio. Verifique as permissões do navegador.");
            });
        });
    }
    
    function showVideoFallback() {
        const playButton = $('<button class="video-play-button">Tocar Vídeo</button>');
        $('.video-container').append(playButton);
        
        playButton.on('click', function() {
            $(this).remove();
            $videoIntro[0].play().then(() => {
                $videoIntro.prop('muted', false);
            });
        });
    }

    function startMessageListener() {
        const messagesRef = database.ref('messages');
        
        $('#messages-background').empty();
        
        messagesRef.orderByChild('timestamp').limitToLast(20).once('value', (snapshot) => {
            let delay = 0;
            const messagesArray = [];
            
            snapshot.forEach((childSnapshot) => {
                const message = childSnapshot.val();
                messagesArray.push(message);
            });
            
            messagesArray.forEach((message, index) => {
                setTimeout(() => {
                    createFloatingMessage(message.text);
                }, index * 300);
            });
            
            setTimeout(() => {
                const currentMessages = $('.floating-message').length;
                if (currentMessages < 10) {
                    for (let i = 0; i < 5; i++) {
                        setTimeout(() => {
                            if (messagesArray.length > 0) {
                                const randomIndex = Math.floor(Math.random() * messagesArray.length);
                                createFloatingMessage(messagesArray[randomIndex].text);
                            }
                        }, i * 500);
                    }
                }
            }, 2000);
        });
        
        messagesRef.orderByChild('timestamp').limitToLast(1).on('child_added', (snapshot) => {
            const message = snapshot.val();
            
            setTimeout(() => {
                createFloatingMessage(message.text);
                
                setTimeout(() => {
                    createFloatingMessage(message.text);
                }, 2000);
            }, 100);
        });
    }

    function createFloatingMessage(text) {
        const message = document.createElement('div');
        message.className = 'floating-message';
        message.textContent = text;
        message.style.position = 'absolute';
        
        const topPos = Math.random() * 80 + 5; 
        
        const direction = Math.random() > 0.5 ? 'right' : 'left';
        
        const useDrift = Math.random() > 0.5;
        
        let animationName;
        if (direction === 'right') {
            animationName = useDrift ? 'floatFromRightDrift' : 'floatFromRight';
        } else {
            animationName = useDrift ? 'floatFromLeftDrift' : 'floatFromLeft';
        }
        
        const duration = 20 + Math.random() * 30;
        
        const fontSize = 1 + Math.random() * 1.5; 
        
        const maxOpacity = 0.8 + Math.random() * 0.2;
        
        message.style.top = topPos + '%';
        message.style.left = direction === 'right' ? '100vw' : '-100px';
        message.style.right = direction === 'left' ? '100vw' : 'auto';
        message.style.opacity = '0'; 
        message.style.fontSize = fontSize + 'rem';
        message.style.color = 'white';
        message.style.textShadow = '2px 2px 5px rgba(0,0,0,0.9)';
        message.style.whiteSpace = 'nowrap';
        message.style.fontFamily = "'pokemon', sans-serif";
        message.style.animation = `${animationName} ${duration}s linear infinite`;
        message.style.animationTimingFunction = 'linear';
        message.style.fontWeight = 'bold';
        message.style.letterSpacing = '1px'; 
        
        document.getElementById('messages-background').appendChild(message);
        
        void message.offsetWidth;
        
        const messageId = Date.now() + Math.random();
        message.dataset.messageId = messageId;
        
        const allMessages = document.querySelectorAll('.floating-message');
        const MAX_MESSAGES = 25; 
        
        if (allMessages.length > MAX_MESSAGES) {
            const oldestMessage = allMessages[0];
            if (oldestMessage.parentNode) {
                oldestMessage.parentNode.removeChild(oldestMessage);
            }
        }
        
        setTimeout(() => {
            message.style.opacity = maxOpacity;
        }, 100);
        
        return message;
    }

    function setupMessageCleanup() {
        setInterval(() => {
            const allMessages = document.querySelectorAll('.floating-message');
            const MAX_MESSAGES_AGE = 10 * 60 * 1000; 
            
            allMessages.forEach((message) => {
                const messageId = message.dataset.messageId;
                if (messageId) {
                    const messageTime = parseInt(messageId);
                    const currentTime = Date.now();
                    
                    if (currentTime - messageTime > MAX_MESSAGES_AGE) {
                        if (message.parentNode) {
                            message.parentNode.removeChild(message);
                        }
                    }
                }
            });
        }, 60000);
    }


    let verificado = false;

    $videoIntro.on('timeupdate', function() {
        const video = this;
        const porcentagem = (video.currentTime / video.duration) * 100;
        
        if (porcentagem >= 80 && !verificado) {
            verificado = true;
            showTextbox()
        }

        if(porcentagem < 80) {
            verificado = false;
        }
    });
    
    $videoIntro.on('ended', function() {
        $videoIntro.hide();
        $videoLoop.show();
        $videoLoop[0].play();        
    });
    
    function showTextbox() {
        $blurOverlay.addClass('active');

        setTimeout(() => {
            $textboxContainer.fadeIn(800);
        }, 300);
        
        setTimeout(() => {
            $('#questionInput').focus();
            startMessageListener();
            setupMessageCleanup();
        }, 1000);

        startMessageListener();
    }
    
    $('.btn-submit').on('click', function(e) {
        e.preventDefault();
        handleSubmission();
    });
    
    $('#questionInput').on('keypress', function(e) {
        if (e.which === 13) { 
            handleSubmission();
        }
    });
    
    function handleSubmission() {
        const answer = $('#questionInput').val().trim();
        if (answer) {
            const messagesRef = database.ref('messages');
            messagesRef.push({
                text: answer,
                timestamp: firebase.database.ServerValue.TIMESTAMP 
            }).then(() => {
                console.log("Message saved!");
                $('#questionInput').val('');
            }).catch((error) => {
                console.error("Error saving message: ", error);
            });
            
        } else {
            alert('Por favor, digite sua resposta.');
            $('#questionInput').focus();
        }
    }
    
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        console.log("Mobile device detected - applying optimizations");
        
        $('.btn-start').on('touchstart', function() {
            $(this).css('transform', 'scale(0.95)');
        });
        
        $('.btn-start').on('touchend', function() {
            $(this).css('transform', 'scale(1)');
        });
        
        document.addEventListener('touchstart', function() {
            if (!audioUnlocked && $audio.paused) {
                $audio.play().then(() => {
                    audioUnlocked = true;
                    $audio.pause();
                    $audio.currentTime = 0;
                });
            }
        }, { once: true });
    }
});