/**
 * Data Catalog Project Starter Code - SEA Stage 2
 *
 * This file is where you should be doing most of your work. You should
 * also make changes to the HTML and CSS files, but we want you to prioritize
 * demonstrating your understanding of data structures, and you'll do that
 * with the JavaScript code you write in this file.
 *
 * The comments in this file are only to help you learn how the starter code
 * works. The instructions for the project are in the README. That said, here
 * are the three things you should do first to learn about the starter code:
 * - 1 - Change something small in index.html or style.css, then reload your browser and make sure you can see that change.
 * - 2 - On your browser, right click anywhere on the page and select
 *    "Inspect" to open the browser developer tools. Then, go to the "console"
 *    tab in the new window that opened up. This console is where you will see
 *    JavaScript errors and logs, which is extremely helpful for debugging.
 *    (These instructions assume you're using Chrome, opening developer tools
 *    may be different on other browsers. We suggest using Chrome.)
 * - 3 - Add another string to the titles array a few lines down. Reload your
 *    browser and observe what happens. You should see a fourth "card" appear
 *    with the string you added to the array, but a broken image.
 *
 */

let numVisibleChars = 40;
let visibleChars = [];
let dictionaryArray = [];
let graphicsArray = [];
let characterFrequencies = [];
let characters = [];

function parseCSV(data) {
    // Split the input CSV into rows (separated by newlines)
    const lines = data.split('\n');
    
    // Get the first line, which contains the column headers
    const headers = lines[0].split(',');
    
    // Create an array to hold the resulting objects
    const result = [];
    
    // Iterate through each line of data (excluding the header)
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');  // Split the row into values
        
        // Create an object for this row, with keys from the header
        const rowObject = {};
        for (let j = 0; j < headers.length; j++) {
            rowObject[headers[j]] = values[j];  // Assign value to the corresponding header
        }
        
        // Add the object to the result array
        result.push(rowObject);
    }
    
    return result;
}


async function parseObjects() {
  const [dictionaryResponse, graphicsResponse] = await Promise.all([
    fetch('http://localhost:8000/dictionary_formatted_v2.json'),
    fetch('http://localhost:8000/graphics_formatted.json')
  ]);

  if (!dictionaryResponse.ok || !graphicsResponse.ok) {
    throw new Error('One of the files failed to load');
  }

  dictionaryArray = await dictionaryResponse.json(); // primary use
  graphicsArray = await graphicsResponse.json();

  const ch_freqResponse = await fetch('http://localhost:8000/ch_freq.csv');
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

  // let sortedCharactersByStrokes = characters.slice(0, numVisibleChars);
  // sortedCharactersByStrokes(sortedCharactersByStrokes, 'Number of strokes -- descending');
  // retrieveMostFrequentCharacters(characterFrequencies, visibleChars, characters, numVisibleChars);

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
    // let svgFilePath = `svg-still/${characters[i].character.charCodeAt(0)}-still.svg`;

    // const newEmbed = document.createElement('embed');
    // newEmbed.src = svgFilePath;

    const newDiv = document.createElement('div');

    // newDiv.appendChild(newEmbed);
    // Add a class to the new div
    newDiv.classList.add('grid-item');

    const divButton = document.createElement('button');
    const popupInfo = document.createElement('p');

    let charDefinition = character[i].definition;
    if (charDefinition === undefined) {
      charDefinition = 'None';
    }

    popupInfo.innerHTML = `
      <p>
        <strong>Unicode: </strong>${characterArr[i].character}<br>
        <strong>Definition: </strong>${charDefinition}<br>
        <strong>Pinyin(pronunciation): </strong>${characterArr[i].pinyin[0]}<br>
        <strong>Number of writing strokes: </strong>${characterArr[i].strokes.length}<br>
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
    var container = el.parentNode; // Find the <div> wrapping the trigger
    var para = container.getElementsByTagName('p')[0]; // Find the first <p> inside the container

    // Initially hide the paragraph
    para.style.display = "none";

    // On hover → show the paragraph
    el.onmouseover = function () {
      para.style.display = '';
      return false;
    };

    // On mouse out → hide the paragraph
    el.onmouseout = function () {
      para.style.display = 'none';
      return false;
    };

    // On click → toggle visibility
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
// Your final submission should have much more data than this, and
// you should use more than just an array of strings to store it all.

// This function adds cards the page to display the data in the array
// function showCards() {
//   const cardContainer = document.getElementById("card-container");
//   cardContainer.innerHTML = "";
//   const templateCard = document.querySelector(".card");
// 
//   for (let i = 0; i < titles.length; i++) {
//     let title = titles[i];
// 
//     // This part of the code doesn't scale very well! After you add your
//     // own data, you'll need to do something totally different here.
//     let imageURL = "";
//     if (i == 0) {
//       imageURL = FRESH_PRINCE_URL;
//     } else if (i == 1) {
//       imageURL = CURB_POSTER_URL;
//     } else if (i == 2) {
//       imageURL = EAST_LOS_HIGH_POSTER_URL;
//     }
// 
//     const nextCard = templateCard.cloneNode(true); // Copy the template card
//     editCardContent(nextCard, title, imageURL); // Edit title and image
//     cardContainer.appendChild(nextCard); // Add new card to the container
//   }
// }
// 
// function editCardContent(card, newTitle, newImageURL) {
//   card.style.display = "block";
// 
//   const cardHeader = card.querySelector("h2");
//   cardHeader.textContent = newTitle;
// 
//   const cardImage = card.querySelector("img");
//   cardImage.src = newImageURL;
//   cardImage.alt = newTitle + " Poster";
// 
//   // You can use console.log to help you debug!
//   // View the output by right clicking on your website,
//   // select "Inspect", then click on the "Console" tab
//   console.log("new card:", newTitle, "- html: ", card);
// }
// 
// // This calls the addCards() function when the page is first loaded
// document.addEventListener("DOMContentLoaded", showCards);
// 
// function quoteAlert() {
//   console.log("Button Clicked!");
//   alert(
//     "I guess I can kiss heaven goodbye, because it got to be a sin to look this good!"
//   );
// }
// 
// function removeLastCard() {
//   titles.pop(); // Remove last item in titles array
//   showCards(); // Call showCards again to refresh
// }
