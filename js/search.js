// Create the select lists
GenerateLists(option.polesArrSize);
GenerateListReferenceDivs(option.polesArrSize);

// Do the search and UI update
document.addEventListener("change", () => {
    UpdateReferences();
    let results = FindCode();
    console.log(results);
    PrintResults(results)
  });
  
  
  // Create the select lists on the page.
  function GenerateLists(num) {
    let lists = document.getElementById("lists");
  
    for (let i = 1; i <= num; i++) {
      // Column
      let div = document.createElement("div");
      div.classList.add('col-lg-2', 'col-sm-4');
  
      // Dropdown
      let list = document.createElement("select");
      list.classList.add('form-select', 'form-select-lg', 'mb-3', 'poles-list');
      list.id = `cara-${i}`;
  
      // Options
      for (let j = 0; j <= 16; j++) {
        let opt = document.createElement('option');
        if (j == 0) {
          opt.value = null;
          opt.innerHTML = `Pole ${i}`;
        } else {
          opt.value = (j - 1).toString(16);
          opt.innerHTML = j - 1;
        }
        list.appendChild(opt);
      }
  
      // Add ?
      let opt = document.createElement('option');
      opt.value = '.';
      opt.innerHTML = '?';
      list.appendChild(opt);
  
  
      div.appendChild(list);
      lists.appendChild(div);
    }
  }
  
  function GenerateListReferenceDivs(num) {
    let lists = document.getElementById("list-references");
  
    for (let i = 1; i <= num; i++) {
      // Column
      let div = document.createElement("div");
      div.classList.add('col', 'text-center');
      div.id = `cara-${i}-ref`;
      div.innerHTML = `-`;
      lists.appendChild(div);
    }
  }
  
  function UpdateReferences() {
    var elems = document.querySelectorAll(".poles-list");
  
    [].forEach.call(elems, function (el) {
      document.getElementById(`${el.id}-ref`).innerHTML = el.options[el.selectedIndex].text
    });
  }
  
  function FindCode() {
  
    let searchArr = [];
  
    for (let i = 1; i <= option.polesArrSize; i++) {
      let val = document.getElementById(`cara-${i}`).value;
  
      if (val != "null")
        searchArr.push(val);
    }
  
    let pat = searchArr.join("");
    let exp = new RegExp(pat + "$");
  
    // Search for the entered poles!
    let filteredArray = codes.filter(entry => exp.test(entry.polesHex));
    let backupArray = [];
    filteredArray.map(entry => {
      entry.backup = codes.find(code => code.index == entry.index + 2);
    })
  
    return filteredArray;
  }
  
  function GetSelectValueInt(id) {
    let val = parseInt();
    return isNaN(val) ? null : val;
  }
  
  function ClearResults() {
    document.getElementById('results').innerHTML = '';
  }
  
  function PrintResults(resultsArray) {
    let results = document.getElementById('results');
    ClearResults();
    resultsArray.forEach(entry => {
      let result = CreateResult(entry);
      results.appendChild(result);
    });
  }
  
  function CreateResult(el) {
    console.log(el);
    let container = document.createElement("div");
    container.classList.add('my-3', 'container', 'text-center');
  
    let mainCode = document.createElement("div"),
      backupCode = document.createElement("div"),
      firstRow = document.createElement("div"),
      station = document.createElement("div"),
      escalator = document.createElement("div"),
      street = document.createElement("div"),
      bus = document.createElement("div"),
      secondRow = document.createElement("div"),
      backup = document.createElement("div"),
      separator = document.createElement("hr");
  
    mainCode.classList.add('col', 'display-2');
    backupCode.classList.add('col', 'display-6');
    firstRow.classList.add('row');
    station.classList.add('col');
    escalator.classList.add('col');
    street.classList.add('col');
    bus.classList.add('col');
    separator.classList.add('border', 'border-dark', 'border-2', 'w-25', 'mx-auto');
  
    secondRow.classList.add('row');
    backup.classList.add('col');
  
    mainCode.innerHTML = el.code;
    backupCode.innerHTML = `<span class="badge rounded-pill text-bg-info">${el.input}</span>`;
    station.innerHTML = "Station<br />" + el.station;
    escalator.innerHTML = "Escalator<br />" + el.escalator;
    street.innerHTML = "Street<br />" + el.street;
    bus.innerHTML = "Bus<br />" + el.bus;
    backup.innerHTML = (el.backup) ? `Backup<br />${el.backup.code} <span class="badge rounded-pill text-bg-info">${el.backup.input}</span>` : '';
  
    firstRow.appendChild(station);
    firstRow.appendChild(escalator);
    firstRow.appendChild(street);
    firstRow.appendChild(bus);
    secondRow.appendChild(backup);
  
    container.appendChild(mainCode);
    container.appendChild(backupCode);
    container.appendChild(firstRow);
    container.appendChild(secondRow);
    container.appendChild(separator);
  
    return container;
  }
  
  UpdateReferences();