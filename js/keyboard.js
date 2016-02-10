document.addEventListener("keydown", keyDownTextField, false);

function keyDownTextField(e) {
    var keyCode = e.keyCode;
    switch(keyCode) {
        case 48:
        playPause();
        break;
        case 49:
        document.querySelector("input[value='1']").checked = true;
        v.playbackRate = 1;
        break;
        case 50:
        document.querySelector("input[value='2']").checked = true;
        v.playbackRate = 2;
        break;
        case 51:
        document.querySelector("input[value='3']").checked = true;
        v.playbackRate = 3;
        break;
        case 52:
        document.querySelector("input[value='4']").checked = true;
        v.playbackRate = 4;
        break;
        case 53:
        document.querySelector("input[value='5']").checked = true;
        v.playbackRate = 5;
        break;
        case 32:
        playPause();
        break;
        case 39:
        v.currentTime += 5;
        break;
        case 37:
        v.currentTime -= 5;
        break;
        case 82:
        rewind();
        break;
        case 121:
        fullScreen();
        default:
        break;
    }
}