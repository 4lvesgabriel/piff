$(document).ready(() => {
        $('.textbox').hide();
        $('#piff2').hide();

    setTimeout(function() {
        $('#piff1').hide();
        $('#piff2').show();
    }, 5000);

    setTimeout(function() {
        $('#piff2').addClass("blur");
        $('.textbox').show();
    }, 6000);
});