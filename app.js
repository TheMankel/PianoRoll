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

    this.handleSelection();
  }

  putBackPianoRoll() {
    const mainPianoRoll = document.getElementById('mainPianoRoll');
    const listPianoRoll = document.getElementById('listPianoRoll');

    // Save current rollId
    const rollId = +mainPianoRoll.dataset.rollId;

    if (!isNaN(rollId)) {
      this.resetSelection();

      listPianoRoll.insertBefore(
        mainPianoRoll.firstChild.cloneNode(true),
        listPianoRoll.childNodes[rollId],
      );

      // Add event listener to put back card, so it can open main view
      listPianoRoll.childNodes[rollId].addEventListener('click', (e) => {
        if (e.currentTarget === mainPianoRoll.firstChild) return;

        this.putBackPianoRoll();
        this.handleMainPianoRoll(rollId);
        this.openMainView();
      });
    }
  }

  handleSelection() {
    const mainPianoRollSvg = document
      .getElementById('mainPianoRoll')
      .querySelector('.piano-roll-svg');

    let isSelecting = false;
    const startCoords = { x: 0, y: 0 };
    const endCoords = { x: 0, y: 0 };

    mainPianoRollSvg.addEventListener('mousedown', (e) => {
      if (isSelecting) return;

      isSelecting = true;

      const svgCoords = mainPianoRollSvg.getBoundingClientRect();
      startCoords.x = Math.max(e.clientX - svgCoords.left, 0);
      startCoords.y = Math.max(e.clientY - svgCoords.top, 0);

      this.resetSelection();

      const selectionRectangle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect',
      );
      selectionRectangle.id = 'selectionRectangle';
      mainPianoRollSvg.appendChild(selectionRectangle);
    });

    mainPianoRollSvg.addEventListener('touchstart', (e) => {
      if (isSelecting) return;

      isSelecting = true;

      const svgCoords = mainPianoRollSvg.getBoundingClientRect();
      startCoords.x = Math.max(e.touches[0].clientX - svgCoords.left, 0);
      startCoords.y = Math.max(e.touches[0].clientY - svgCoords.top, 0);

      this.resetSelection();

      const selectionRectangle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect',
      );
      selectionRectangle.id = 'selectionRectangle';
      mainPianoRollSvg.appendChild(selectionRectangle);
    });

    mainPianoRollSvg.addEventListener('mousemove', (e) => {
      if (isSelecting) {
        const svgCoords = mainPianoRollSvg.getBoundingClientRect();
        endCoords.x = Math.max(e.clientX - svgCoords.left, 0);
        endCoords.y = Math.max(e.clientY - svgCoords.top, 0);

        this.drawSelectionRectangle(startCoords, endCoords);
      }
    });

    mainPianoRollSvg.addEventListener('touchmove', (e) => {
      if (isSelecting) {
        const svgCoords = mainPianoRollSvg.getBoundingClientRect();
        endCoords.x = Math.max(e.touches[0].clientX - svgCoords.left, 0);
        endCoords.y = Math.max(e.touches[0].clientY - svgCoords.top, 0);

        this.drawSelectionRectangle(startCoords, endCoords);
      }
    });

    mainPianoRollSvg.addEventListener('mouseup', (e) => {
      if (isSelecting) {
        const svgCoords = mainPianoRollSvg.getBoundingClientRect();
        endCoords.x = Math.max(e.clientX - svgCoords.left, 0);
        endCoords.y = Math.max(e.clientY - svgCoords.top, 0);

        this.drawSelectionRectangle(startCoords, endCoords);
      }

      console.log(`Start Coords: x: ${startCoords.x}, y: ${startCoords.y}`);
      console.log(`End Coords: x: ${endCoords.x}, y: ${endCoords.y}`);

      isSelecting = false;
      startCoords.x = 0;
      startCoords.y = 0;
      endCoords.x = 0;
      endCoords.y = 0;
    });

    mainPianoRollSvg.addEventListener('touchend', (e) => {
      if (isSelecting) {
        const svgCoords = mainPianoRollSvg.getBoundingClientRect();
        endCoords.x = Math.max(e.changedTouches[0].clientX - svgCoords.left, 0);
        endCoords.y = Math.max(e.changedTouches[0].clientY - svgCoords.top, 0);

        this.drawSelectionRectangle(startCoords, endCoords);
      }

      console.log(`Start Coords: x: ${startCoords.x}, y: ${startCoords.y}`);
      console.log(`End Coords: x: ${endCoords.x}, y: ${endCoords.y}`);

      isSelecting = false;
      startCoords.x = 0;
      startCoords.y = 0;
      endCoords.x = 0;
      endCoords.y = 0;
    });
  }

  drawSelectionRectangle(startCoords, endCoords) {
    const mainPianoRollSvg = document
      .getElementById('mainPianoRoll')
      .querySelector('.piano-roll-svg');
    const svgCoords = mainPianoRollSvg.getBoundingClientRect();

    // Create coords and size variables
    const x = Math.min(startCoords.x, endCoords.x) / svgCoords.width;
    const y = Math.min(startCoords.y, endCoords.y) / svgCoords.height;
    const width = Math.abs(startCoords.x - endCoords.x) / svgCoords.width;
    const height = Math.abs(startCoords.y - endCoords.y) / svgCoords.height;

    const selectionRectangle = document.getElementById('selectionRectangle');

    selectionRectangle.setAttribute('x', x);
    selectionRectangle.setAttribute('y', y);
    selectionRectangle.setAttribute('width', width);
    selectionRectangle.setAttribute('height', height);

    this.countNoteRectangles();
  }

  countNoteRectangles() {
    const mainPianoRoll = document.getElementById('mainPianoRoll');
    const noteRectangles = mainPianoRoll.querySelectorAll('.note-rectangle');
    const selectionRectangle = document.getElementById('selectionRectangle');
    const selectionBounding = selectionRectangle.getBoundingClientRect();
    let noteCounter = 0;

    noteRectangles.forEach((noteRectangle) => {
      const noteBounding = noteRectangle.getBoundingClientRect();

      if (
        noteBounding.x < selectionBounding.x + selectionBounding.width &&
        noteBounding.x + noteBounding.width > selectionBounding.x &&
        noteBounding.y < selectionBounding.y + selectionBounding.height &&
        noteBounding.y + noteBounding.height > selectionBounding.y
      ) {
        noteCounter++;
        noteRectangle.classList.add('highlightNote');
      } else {
        noteRectangle.classList.remove('highlightNote');
      }
    });

    const countMessageDiv =
      document.getElementById('selectionCounter') ||
      document.createElement('div');

    if (!countMessageDiv.id) {
      countMessageDiv.id = 'selectionCounter';
      mainPianoRoll.appendChild(countMessageDiv);
    }

    countMessageDiv.textContent = `Selected Notes Count: ${noteCounter}`;
  }

  resetSelection() {
    const oldSelectionRect = document.getElementById('selectionRectangle');

    if (oldSelectionRect) oldSelectionRect.remove();

    const countMessageDiv = document.getElementById('selectionCounter');

    if (countMessageDiv) countMessageDiv.remove();

    // Grab all highlighted notes
    const mainPianoRoll = document.getElementById('mainPianoRoll');
    const highlightedRectangles = mainPianoRoll.querySelectorAll(
      '.note-rectangle.highlightNote',
    );

    // Remove highlight class from highlighted notes
    highlightedRectangles.forEach((noteRectangle) => {
      noteRectangle.classList.remove('highlightNote');
    });
  }
}

document.getElementById('loadCSV').addEventListener('click', async () => {
  const csvToSVG = new PianoRollDisplay();
  await csvToSVG.generateSVGs();
});
