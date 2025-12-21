$(document).ready(function() {
    // Initialize
    $('.textbox-container').hide();
    
    const $videoIntro = $('#video-intro');
    const $videoLoop = $('#video-loop');
    const $audio = $('#background-audio')[0];
    const $textboxContainer = $('.textbox-container');
    
    // Set initial volume
    $audio.volume = 0.8;
    
    // Play sequence
    function initVideoSequence() {
        $videoLoop.hide();
        
        // Unmute and play intro video
        $videoIntro.prop('muted', false);
        $videoIntro[0].play().catch(error => {
            console.log("Autoplay prevented:", error);
            // Fallback: show play button or handle accordingly
        });
        
        // Start audio after 14.5 seconds
        setTimeout(() => {
            $audio.play().catch(error => {
                console.log("Audio autoplay prevented:", error);
            });
        }, 14500);
    }
    
    // Handle intro video end
    $videoIntro.on('ended', function() {
        $videoIntro.hide();
        $videoLoop.show();
        $videoLoop[0].play();
        
        // Show textbox after 5 seconds
        setTimeout(showTextbox, 5000);
    });
    
    // Show textbox function
    function showTextbox() {
        $videoLoop.addClass('blur');
        $textboxContainer.fadeIn(800);
        
        // Focus on input field
        setTimeout(() => {
            $('#questionInput').focus();
        }, 1000);
    }
    
    // Handle form submission
    $('.btn-submit').on('click', function(e) {
        e.preventDefault();
        handleSubmission();
    });
    
    $('#questionInput').on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            handleSubmission();
        }
    });
    
    function handleSubmission() {
        const answer = $('#questionInput').val().trim();
        if (answer) {
            alert(`Sua resposta: ${answer}`);
            // Here you would typically send to a server
            $('#questionInput').val('');
        } else {
            alert('Por favor, digite sua resposta.');
            $('#questionInput').focus();
        }
    }
    
    // Initialize video sequence
    initVideoSequence();
    
    // Fallback for autoplay restrictions
    function handleAutoplayFallback() {
        const playButton = $('<button class="play-button">Iniciar Experiência</button>');
        $('body').append(playButton);
        
        playButton.on('click', function() {
            $(this).remove();
            $videoIntro[0].play();
            $audio.play();
        });
    }
    
    // Check if autoplay was successful
    setTimeout(() => {
        if ($videoIntro[0].paused) {
            handleAutoplayFallback();
        }
    }, 1000);
});