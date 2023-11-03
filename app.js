import PianoRoll from './pianoroll.js';

class PianoRollDisplay {
  constructor(csvURL) {
    this.csvURL = csvURL;
    this.data = null;
  }

  async loadPianoRollData() {
    try {
      const response = await fetch('https://pianoroll.ai/random_notes');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      this.data = await response.json();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  preparePianoRollCard(rollId) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('piano-roll-card');

    // Create and append other elements to the card container as needed
    const descriptionDiv = document.createElement('div');
    descriptionDiv.classList.add('description');
    descriptionDiv.textContent = `This is a piano roll number ${rollId}`;
    cardDiv.appendChild(descriptionDiv);

    // Add event listener to cards, so it can open main view
    cardDiv.addEventListener('click', (e) => {
      const mainPianoRoll = document.getElementById('mainPianoRoll');
      if (e.currentTarget === mainPianoRoll.firstChild) return;

      this.putBackPianoRoll();
      this.handleMainPianoRoll(rollId);
      this.openMainView();
    });

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('piano-roll-svg');
    svg.setAttribute('width', '80%');
    svg.setAttribute('height', '150');

    // Append the SVG to the card container
    cardDiv.appendChild(svg);

    return { cardDiv, svg };
  }

  async generateSVGs() {
    if (!this.data) await this.loadPianoRollData();
    if (!this.data) return;

    const listPianoRoll = document.getElementById('listPianoRoll');
    listPianoRoll.innerHTML = '';
    for (let it = 0; it < 20; it++) {
      const start = it * 60;
      const end = start + 60;
      const partData = this.data.slice(start, end);

      const { cardDiv, svg } = this.preparePianoRollCard(it);

      listPianoRoll.appendChild(cardDiv);
      const roll = new PianoRoll(svg, partData);
    }

    // Update mainView piano roll
    const pianoRollContainer = document.getElementById('pianoRollContainer');
    if (pianoRollContainer.classList.contains('mainView')) {
      const mainPianoRoll = document.getElementById('mainPianoRoll');
      this.handleMainPianoRoll(+mainPianoRoll.dataset.rollId);
    }
  }

  openMainView() {
    const pianoRollContainer = document.getElementById('pianoRollContainer');
    pianoRollContainer.classList.add('mainView');
  }

  handleMainPianoRoll(rollId) {
    const mainPianoRoll = document.getElementById('mainPianoRoll');
    const listPianoRoll = document.getElementById('listPianoRoll');

    // Set new rollId dataset value
    mainPianoRoll.dataset.rollId = rollId;

    // Clear main view
    mainPianoRoll.innerHTML = '';

    // Grab and append clicked piano roll
    const clickedRoll = listPianoRoll.childNodes[rollId];
    mainPianoRoll.appendChild(clickedRoll);
  }

  putBackPianoRoll() {
    const mainPianoRoll = document.getElementById('mainPianoRoll');
    const listPianoRoll = document.getElementById('listPianoRoll');

    const rollId = +mainPianoRoll.dataset.rollId;

    if (!isNaN(rollId)) {
      listPianoRoll.insertBefore(
        mainPianoRoll.firstChild.cloneNode(true),
        listPianoRoll.childNodes[rollId],
      );

      listPianoRoll.childNodes[rollId].addEventListener('click', (e) => {
        if (e.currentTarget === mainPianoRoll.firstChild) return;

        this.putBackPianoRoll();
        this.handleMainPianoRoll(rollId);
        this.openMainView();
      });
    }
  }
}

document.getElementById('loadCSV').addEventListener('click', async () => {
  const csvToSVG = new PianoRollDisplay();
  await csvToSVG.generateSVGs();
});
