$(document).ready(() => {
    $("#piff2").addClass('dnone');

    setTimeout(function() {
        $('#piff1').hide();
        $('#piff2').show();
    }, 5000);
});