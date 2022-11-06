//let tilts = document.getElementById('tilts');

let lists = document.querySelectorAll("select.poles-list");
console.log(`Got ${lists.length} lists.`);

let selectedList;

// Init
selectList(1);

function dir(dir) {
    console.log(dir);
    switch (dir) {
        case "up": selectOption('+'); break;
        case "down": selectOption('-'); break;
        case "left": selectList(selectedList - 1); break;
        case "right": selectList(selectedList + 1); break;
    }
}

function selectList(num) {
    if (num < 1) num = 1;
    if (num > lists.length) num = lists.length;

    selectedList = num;

    // Remove class from select lists
    var elems = document.querySelectorAll(".border-danger");

    [].forEach.call(elems, function (el) {
        el.classList.remove("border");
        el.classList.remove("border-danger");
    });

    // Remove class from reference divs
    var elems = document.querySelectorAll(".text-decoration-underline");

    [].forEach.call(elems, function (el) {
        el.classList.remove("text-decoration-underline");
    });

    // Add selected class to selected list
    document.getElementById(`cara-${num}`).classList.add('border', 'border-danger');
    document.getElementById(`cara-${num}-ref`).classList.add('text-decoration-underline');
}

function selectOption(direction) {
    let list = document.getElementById(`cara-${selectedList}`);

    if (direction == '+') {
        if(list.options.selectedIndex >= list.options.length - 1) return;
        list.options.selectedIndex++;
    } else if (direction == '-') {
        if(list.options.selectedIndex <= 0) return;
        list.options.selectedIndex--;
    }

    // Trigger onchange event
    list.dispatchEvent(new Event('change'));
    document.dispatchEvent(new Event('change'));
}

document.body.onkeydown = function (e) {
    switch (e.which) {
        case 37: dir('left'); break; // left
        case 39: dir('right'); break; // right
        case 38: e.preventDefault(); dir('up'); break; // up + prevent scrolling
        case 40: e.preventDefault(); dir('down'); break; // down + prevent scrolling
        case 65: dir('left'); break; // a
        case 68: dir('right'); break; // d
        case 87: dir('up'); break; // w
        case 83: dir('down'); break; //s
    }
};

let arrows = document.getElementsByClassName('dpad');
for (var i = 0; i < arrows.length; i++) {
    arrows[i].addEventListener('click', function (e) {
        let input = e.target.id;
        dir(input);
    });
}