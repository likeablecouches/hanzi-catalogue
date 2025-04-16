let numVisibleChars = 40;
let visibleChars = [];
let dictionaryArray = [];
let graphicsArray = [];
let characterFrequencies = [];
let characters = [];

function parseCSV(data) {
    const lines = data.split('\n');
    
    const headers = lines[0].split(',');
    
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');  // Split the row into values
        
        const rowObject = {};
        for (let j = 0; j < headers.length; j++) {
            rowObject[headers[j]] = values[j];  
        }
        
        result.push(rowObject);
    }
    
    return result;
}


async function parseObjects() {
  const [dictionaryResponse, graphicsResponse] = await Promise.all([
    fetch('./dictionary_formatted_v2.json'),
    fetch('./graphics_formatted.json')
  ]);

  if (!dictionaryResponse.ok || !graphicsResponse.ok) {
    throw new Error('One of the files failed to load');
  }

  dictionaryArray = await dictionaryResponse.json(); // primary use
  graphicsArray = await graphicsResponse.json();

  const ch_freqResponse = await fetch('./ch_freq.csv');
  const ch_freqData = await ch_freqResponse.text();
  characterFrequencies = parseCSV(ch_freqData);

  // every character in this array will contain stroke information
  characters = dictionaryArray.map((obj, index) => {
    return { ...obj, strokes: graphicsArray[index].strokes};
  });

}

function showGrid() {

  console.log('character-grid element: ');
  console.log(document.getElementById('character-grid'));
  let gridContainer = document.getElementById('character-grid');
  gridContainer.innerHTML = "";
  console.log('Grid container:');
  console.log(gridContainer);

  console.log('Visible characters');
  console.log(visibleChars);
  
  placeCharacters(gridContainer, visibleChars);

  const gridButtons = gridContainer.getElementsByTagName('button');

  for (let i = 0; i < gridButtons.length; i++) {
    oVTog.toggle(gridButtons[i]);
  }


}


function placeCharacters(documentGrid, characterArr) {
  for (let i = 0; i < characterArr.length; i++) {
    const newDiv = document.createElement('div');

    // Add a class to the new div
    newDiv.classList.add('grid-item');

    const divButton = document.createElement('button');
    const popupInfo = document.createElement('p');

    let charDefinition = characterArr[i].definition;
    if (charDefinition === undefined) {
      charDefinition = 'None';
    }

    popupInfo.innerHTML = `
      <p>
        <strong>Character: </strong>${characterArr[i].character}<br>
        <strong>Definition: </strong>${charDefinition}<br>
        <strong>Pinyin(pronunciation): </strong>${characterArr[i].pinyin[0]}<br>
        <strong>Writing strokes: </strong>${characterArr[i].strokes.length}<br>
        <strong> Writing demo:</strong><br>
        <object data = "./svgs/${characterArr[i].character.charCodeAt(0)}.svg"
           width="100"
           height="100"/>
      </p>
    `;

    popupInfo.classList.add('toggleContent');

    // Add text content to the new div

    divButton.classList.add('toggleButton');
    divButton.textContent = characterArr[i].character;
    divButton.style.fontSize = '100px';

    newDiv.appendChild(divButton);
    newDiv.appendChild(popupInfo);
    // Append the new div to the parent container
    documentGrid.appendChild(newDiv);
  }
}

function retrieveMostFrequentCharacters(frequencyList, characterArr, originalSet, numChars) {
  characterArr.length = 0;
  for (let i = 0; i < numChars; i++) {
    let curCharacter = frequencyList[i].word;
    characterArr.push(originalSet.filter(entry => entry.character === curCharacter)[0]);
  }
}

function sortedCharactersByStrokes(characterArr, option) {
  /*options:
    * number of strokes -- ascending
    * number of strokes -- descending
    */

  if (option === 'strokeAsc') {
    characterArr.sort((a, b) => a.strokes.length - b.strokes.length);
  }
  else if (option === 'strokeDesc') {
    characterArr.sort((a, b) => b.strokes.length - a.strokes.length);
  }
}

function updateGrid() {
  let filterDropdown = document.getElementById('filterOptions');
  filterDropdown.addEventListener('change', () => {
    console.log('Dropdown changed!');
    const filterOption = filterDropdown.value;

    if (filterOption === 'strokeAsc' || filterOption === 'strokeDesc') {
      sortedCharactersByStrokes(characters, filterOption);
      visibleChars = characters.slice(0, numVisibleChars);
    } else if (filterOption === 'frequency') {
      retrieveMostFrequentCharacters(characterFrequencies,
        visibleChars, 
        characters, 
        numVisibleChars);
    }

    showGrid();
  });
}

function searchByPinyin() {
  const searchInput = document.getElementById('searchBar').value.toLowerCase();
  const searchResults = document.getElementById('searchResults');

  searchResults.innerHTML = "";

  visibleChars.length = 0

  for (let i = 0; i < characters.length; i++) {
    if (visibleChars.length == numVisibleChars) {
      break;
    }

    if (searchInput === characters[i].pinyin[1] ||
      searchInput === characters[i].character) {
      visibleChars.push(characters[i]);
    }
  }

  showGrid();

}

var oVTog = {
  toggle: function (el) {
    var container = el.parentNode; 
    var para = container.getElementsByTagName('p')[0];

    para.style.display = "none";

    el.onmouseover = function () {


      para.getElementsByTagName('object');
      const svgObject = document.createElement('object');
      svgObject.setAttribute("data", para.data);
      svgObject.setAttribute("width", "150");
      svgObject.setAttribute("height", "150");

      para.style.display = '';
      return false;
    };

    el.onmouseout = function () {
      para.style.display = 'none';
      return false;
    };

    el.onclick = function () {
      para.style.display = para.style.display == 'none' ? '' : 'none';
      return false;
    };
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  await parseObjects();
  // debugging
  console.log('Dictionary Array: ');
  console.log(dictionaryArray);
  console.log('Graphics array: ');
  console.log(graphicsArray);
  console.log('Characters array: ');
  console.log(characters);
  console.log('Frequency list ');
  console.log(characterFrequencies);
  retrieveMostFrequentCharacters(characterFrequencies,
    visibleChars, 
    characters, 
    numVisibleChars);
  showGrid();
});

document.addEventListener("DOMContentLoaded", updateGrid);

// pagination feature: in progress
document.addEventListener("DOMContentLoaded", () => {
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const viewportHeight = window.innerHeight;
    const fullHeight = document.documentElement.scrollHeight;

    if (scrollTop + viewportHeight >= fullHeight - 1) {
      console.log('You reached the bottom!');
    }
  });
});
