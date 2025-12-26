$(document).ready(function() {
    const firebaseConfig = {
    apiKey: "AIzaSyBRbR0KP88QrnKL5mgUBXRTGuaetKKuYZQ",
    authDomain: "teste-56051.firebaseapp.com",
    projectId: "teste-56051",
    storageBucket: "teste-56051.firebasestorage.app",
    messagingSenderId: "197708078650",
    appId: "1:197708078650:web:a275f73a411f3d8c159f03"
    };

    // Initialize Firebase
    // firebase.initializeApp(firebaseConfig);
    // const database = firebase.database();

    $('.textbox-container').hide();
    $('.video-container').hide();
    
    const $videoIntro = $('#video-intro');
    const $videoLoop = $('#video-loop');
    const $audio = $('#background-audio')[0];
    const $textboxContainer = $('.textbox-container');
    const $startScreen = $('#startScreen');
    const $videoContainer = $('.video-container');
    
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
        
        // This fires once for initial data, and again whenever new data is added[citation:4]
        messagesRef.orderByChild('timestamp').on('value', (snapshot) => {
            // Clear existing displayed messages (optional, or let them accumulate)
            // $('#messages-background').empty();
            
            snapshot.forEach((childSnapshot) => {
                const message = childSnapshot.val();
                createFloatingMessage(message.text);
            });
        });
    }

    function createFloatingMessage(text) {
        const $message = $('<div class="floating-message"></div>').text(text);
        $('#messages-background').append($message);
        
        // Randomize vertical position and animation delay
        const topPos = Math.random() * 80 + 5; // Between 5% and 85%
        const delay = Math.random() * 5; // Up to 5 seconds delay
        
        $message.css({
            top: topPos + '%',
            animationDelay: delay + 's'
        });
    }

    
    $videoIntro.on('ended', function() {
        $videoIntro.hide();
        $videoLoop.show();
        $videoLoop[0].play();
        
        setTimeout(showTextbox, 1500);
    });
    
    function showTextbox() {
        $videoLoop.addClass('blur');
        $textboxContainer.fadeIn(800);
        
        setTimeout(() => {
            $('#questionInput').focus();
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
            // Save to Firebase Realtime Database
            const messagesRef = database.ref('messages'); // 'messages' is your data path
            messagesRef.push({
                text: answer,
                timestamp: firebase.database.ServerValue.TIMESTAMP // Adds a server timestamp
            }).then(() => {
                console.log("Message saved!");
                $('#questionInput').val(''); // Clear the input
            }).catch((error) => {
                console.error("Error saving message: ", error);
            });
            
            // Optional: Keep or remove the old alert
            // alert(`Sua resposta: ${answer}`);
            
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