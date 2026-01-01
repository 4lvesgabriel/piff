$(document).ready(function() {
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
        }, 1000);
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
            alert(`Sua resposta: ${answer}`);
            $('#questionInput').val('');
            
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