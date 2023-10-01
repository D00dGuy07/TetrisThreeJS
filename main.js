import * as THREE from "three";
import WebGL from "three/addons/capabilities/WebGL.js";

if ( !WebGL.isWebGLAvailable() ) {
	const warning = WebGL.getWebGLErrorMessage();
	document.getElementById( "container" ).appendChild( warning );
}

// This is the worst case scenario max number of squares that could have to be rendered for a single color
const MAX_SQUARES = 100;

let gameState = {
  Scene: null,
  Camera: null,
  Renderer: null,
  Clock: null,

  playField: new Array(10 * 23).fill(0),

  currentPiece: {
    position: null,
    tetraminos: null,
    rotation: 0,
    timeTillDrop: 0,
    superDrop: false
  },

  geometries: {
    I: new THREE.BufferGeometry(),
    O: new THREE.BufferGeometry(),
    T: new THREE.BufferGeometry(),
    S: new THREE.BufferGeometry(),
    Z: new THREE.BufferGeometry(),
    J: new THREE.BufferGeometry(),
    L: new THREE.BufferGeometry()
  },

  objects: []
};

const tetraminoData = {
  I: [
    [
      0, 0, 0, 0,
      1, 1, 1, 1,
      0, 0, 0, 0,
      0, 0, 0, 0
    ],
    [
      0, 0, 1, 0,
      0, 0, 1, 0,
      0, 0, 1, 0,
      0, 0, 1, 0
    ],
    [
      0, 0, 0, 0,
      0, 0, 0, 0,
      1, 1, 1, 1,
      0, 0, 0, 0
    ],
    [
      0, 1, 0, 0,
      0, 1, 0, 0,
      0, 1, 0, 0,
      0, 1, 0, 0
    ]
  ],
  O: [
    [
      0, 0, 0, 0,
      0, 2, 2, 0,
      0, 2, 2, 0,
      0, 0, 0, 0
    ],
    [
      0, 0, 0, 0,
      0, 2, 2, 0,
      0, 2, 2, 0,
      0, 0, 0, 0
    ],
    [
      0, 0, 0, 0,
      0, 2, 2, 0,
      0, 2, 2, 0,
      0, 0, 0, 0
    ],
    [
      0, 0, 0, 0,
      0, 2, 2, 0,
      0, 2, 2, 0,
      0, 0, 0, 0
    ]
  ],
  T: [
    [
      0, 3, 0, 0,
      3, 3, 3, 0,
      0, 0, 0, 0,
      0, 0, 0, 0
    ],
    [
      0, 3, 0, 0,
      0, 3, 3, 0,
      0, 3, 0, 0,
      0, 0, 0, 0
    ],
    [
      0, 0, 0, 0,
      3, 3, 3, 0,
      0, 3, 0, 0,
      0, 0, 0, 0
    ],
    [
      0, 3, 0, 0,
      3, 3, 0, 0,
      0, 3, 0, 0,
      0, 0, 0, 0
    ]
  ],
  S: [
    [
      0, 4, 4, 0,
      4, 4, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0
    ],
    [
      0, 4, 0, 0,
      0, 4, 4, 0,
      0, 0, 4, 0,
      0, 0, 0, 0
    ],
    [
      0, 0, 0, 0,
      0, 4, 4, 0,
      4, 4, 0, 0,
      0, 0, 0, 0
    ],
    [
      4, 0, 0, 0,
      4, 4, 0, 0,
      0, 4, 0, 0,
      0, 0, 0, 0
    ]
  ],
  Z: [
    [
      5, 5, 0, 0,
      0, 5, 5, 0,
      0, 0, 0, 0,
      0, 0, 0, 0
    ],
    [
      0, 0, 5, 0,
      0, 5, 5, 0,
      0, 5, 0, 0,
      0, 0, 0, 0
    ],
    [
      0, 0, 0, 0,
      5, 5, 0, 0,
      0, 5, 5, 0,
      0, 0, 0, 0
    ],
    [
      0, 5, 0, 0,
      5, 5, 0, 0,
      5, 0, 0, 0,
      0, 0, 0, 0
    ]
  ],
  J: [
    [
      6, 0, 0, 0,
      6, 6, 6, 0,
      0, 0, 0, 0,
      0, 0, 0, 0
    ],
    [
      0, 6, 6, 0,
      0, 6, 0, 0,
      0, 6, 0, 0,
      0, 0, 0, 0
    ],
    [
      0, 0, 0, 0,
      6, 6, 6, 0,
      0, 0, 6, 0,
      0, 0, 0, 0
    ],
    [
      0, 6, 0, 0,
      0, 6, 0, 0,
      6, 6, 0, 0,
      0, 0, 0, 0
    ]
  ],
  L: [
    [
      0, 0, 7, 0,
      7, 7, 7, 0,
      0, 0, 0, 0,
      0, 0, 0, 0
    ],
    [
      0, 7, 0, 0,
      0, 7, 0, 0,
      0, 7, 7, 0,
      0, 0, 0, 0
    ],
    [
      0, 0, 0, 0,
      7, 7, 7, 0,
      7, 0, 0, 0,
      0, 0, 0, 0
    ],
    [
      7, 7, 0, 0,
      0, 7, 0, 0,
      0, 7, 0, 0,
      0, 0, 0, 0
    ]
  ]
};

function initBufferGeometry(geometry) {
  geometry.setAttribute( "position", new THREE.BufferAttribute( new Float32Array(MAX_SQUARES * 4 * 3), 3 ) );
  geometry.setIndex(new THREE.BufferAttribute( new Uint16Array(MAX_SQUARES * 6), 3 ));
  geometry.setDrawRange(0, 0);
}

function initMeshes() {
  initBufferGeometry(gameState.geometries.I);
  initBufferGeometry(gameState.geometries.O);
  initBufferGeometry(gameState.geometries.T);
  initBufferGeometry(gameState.geometries.S);
  initBufferGeometry(gameState.geometries.Z);
  initBufferGeometry(gameState.geometries.J);
  initBufferGeometry(gameState.geometries.L);

  gameState.objects.push(new THREE.Mesh( gameState.geometries.I, new THREE.MeshBasicMaterial( { color: 0x31C7EF, wireframe: false } ) ) );
  gameState.objects.push(new THREE.Mesh( gameState.geometries.O, new THREE.MeshBasicMaterial( { color: 0xF7D308, wireframe: false } ) ) );
  gameState.objects.push(new THREE.Mesh( gameState.geometries.T, new THREE.MeshBasicMaterial( { color: 0xAD4D9C, wireframe: false } ) ) );
  gameState.objects.push(new THREE.Mesh( gameState.geometries.S, new THREE.MeshBasicMaterial( { color: 0x42B642, wireframe: false } ) ) );
  gameState.objects.push(new THREE.Mesh( gameState.geometries.Z, new THREE.MeshBasicMaterial( { color: 0xEF2029, wireframe: false } ) ) );
  gameState.objects.push(new THREE.Mesh( gameState.geometries.J, new THREE.MeshBasicMaterial( { color: 0x5A65AD, wireframe: false } ) ) );
  gameState.objects.push(new THREE.Mesh( gameState.geometries.L, new THREE.MeshBasicMaterial( { color: 0xEF7921, wireframe: false } ) ) );

  gameState.objects.forEach(object => gameState.Scene.add(object));
}

function init() {
  // Set up the basic context like objects
  gameState.Scene = new THREE.Scene();

  const height = 20;
  const width = height * (window.innerWidth / window.innerHeight);
  gameState.Camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 0.1, 100.0 );
  gameState.Camera.position.z = 5;

  gameState.Renderer = new THREE.WebGLRenderer();
  gameState.Renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( gameState.Renderer.domElement );

  gameState.Clock = new THREE.Clock();

  // Initialize the meshes
  initMeshes();

  // Begin the render loop
  animate();
}

function blitTetramino(x, y, field, tetramino) {
  tetramino.forEach((state, index) => {
    if (state != 0) {
      const fX = x + index % 4;
      const fY = y + Math.floor(index / 4);
      field[fX + fY * 10] = state;
    }
  })
}

function setFieldState(x, y, state) {
  gameState.playField[x + y * 10] = state;
}

function getFieldState(x, y) {
  return gameState.playField[x + y * 10];
}

function getFieldIndex(x, y) {
  return x + y * 10;
}

function getFieldCoordinates(index) {
  return new THREE.Vector2(index % 10, Math.floor(index / 10));
}

function createMesh(field, geometry, state) {
  const vertices = geometry.getAttribute("position").array;
  const indices = geometry.getIndex().array;
  let vertexIndex, indexIndex;
  vertexIndex = indexIndex = 0;

  // Generate the mesh using the greedy meshing algorithm
  let fieldIndex = getFieldIndex(9, 22);
  while (fieldIndex >= getFieldIndex(0, 3)) {
    if (field[fieldIndex] == state) {
      const startCoord = getFieldCoordinates(fieldIndex);
      let endCoord = startCoord;

      // Expand on the X axis
      while (endCoord.x - 1 >= 0 && field[getFieldIndex(endCoord.x - 1, endCoord.y)] === state) {
        endCoord = new THREE.Vector2(endCoord.x - 1, endCoord.y);
      }

      // Expand on the Y axis
      let shouldContinue = true;
      while (shouldContinue) {
        // Stay within bounds on the bottom
        if (endCoord.y - 1 < 0) {
          break;
        }

        // Test the whole next row
        for (let i = startCoord.x; i >= endCoord.x && shouldContinue; i--) {
          shouldContinue = field[getFieldIndex(i, endCoord.y - 1)] === state;
        }

        // Decrement the y coordinate if the whole row matches
        if (shouldContinue) {
          endCoord = new THREE.Vector2(endCoord.x, endCoord.y - 1);
        }
      }

      // Fill the area with zeros
      for (let y = startCoord.y; y >= endCoord.y; y--) {
        for (let x = startCoord.x; x >= endCoord.x; x--) {
          field[getFieldIndex(x, y)] = 0
        }
      }

      // Add this rectangle to the mesh
      const squareIndex = (vertexIndex / 12) * 4

      vertices[vertexIndex++] = endCoord.x - 5;
      vertices[vertexIndex++] = -(startCoord.y + 1 - 10) + 3;
      vertexIndex++;

      vertices[vertexIndex++] = startCoord.x + 1 - 5;
      vertices[vertexIndex++] = -(startCoord.y + 1 - 10) + 3;
      vertexIndex++;

      vertices[vertexIndex++] = startCoord.x + 1 - 5;
      vertices[vertexIndex++] = -(endCoord.y - 10) + 3; 
      vertexIndex++;

      vertices[vertexIndex++] = endCoord.x - 5;
      vertices[vertexIndex++] = -(endCoord.y - 10) + 3;
      vertexIndex++;

      indices[indexIndex++] = squareIndex + 0;
      indices[indexIndex++] = squareIndex + 1;
      indices[indexIndex++] = squareIndex + 2;

      indices[indexIndex++] = squareIndex + 2;
      indices[indexIndex++] = squareIndex + 3;
      indices[indexIndex++] = squareIndex + 0;
    }

    fieldIndex--;
  }

  // Tell Three.js that these changed
  geometry.getAttribute("position").needsUpdate = true;
  geometry.getIndex().needsUpdate = true;
  geometry.setDrawRange(0, indexIndex);

  // If there is no mesh then this will throw an exception
  try {
    geometry.computeBoundingBox();
  } catch (e) {}
}

function draw() {
  let field = gameState.playField.slice();

  if (gameState.currentPiece.position !== null) {
    const tetramino = gameState.currentPiece.tetraminos[gameState.currentPiece.rotation];
    blitTetramino(gameState.currentPiece.position.x, gameState.currentPiece.position.y, field, tetramino)
  }

  createMesh(field, gameState.geometries.I, 1);
  createMesh(field, gameState.geometries.O, 2);
  createMesh(field, gameState.geometries.T, 3);
  createMesh(field, gameState.geometries.S, 4);
  createMesh(field, gameState.geometries.Z, 5);
  createMesh(field, gameState.geometries.J, 6);
  createMesh(field, gameState.geometries.L, 7);
}

function testCollision(x, y, tetramino) {
  var isColliding = false;

  // Modified version of the blit function
  tetramino.forEach((state, index) => {
    if (state != 0) {
      const fX = x + index % 4;
      const fY = y + Math.floor(index / 4);
      isColliding = (gameState.playField[fX + fY * 10] !== 0) || (fY > 22) || (fX < 0) || (fX > 9) || isColliding;
    }
  })

  return isColliding;
}

function nudgePiece(x, y) {
  if (gameState.currentPiece.position === null) return;

  const newPosition = gameState.currentPiece.position.clone().add(new THREE.Vector2(x, y));
  if (!testCollision(newPosition.x, newPosition.y, gameState.currentPiece.tetraminos[gameState.currentPiece.rotation])) {
    gameState.currentPiece.position = newPosition;
  }
}


function tryRotate() {
  if (gameState.currentPiece.position === null) return;

  const newRotation = (gameState.currentPiece.rotation + 1) % 4;
  if (!testCollision(gameState.currentPiece.position.x, gameState.currentPiece.position.y, gameState.currentPiece.tetraminos[newRotation])) {
    gameState.currentPiece.rotation = newRotation;
  }
}

document.onkeydown = function(e) {
  e.preventDefault();
  switch (e.key) {
    case "ArrowLeft":
      nudgePiece(-1, 0);
      break;
    case "ArrowRight":
      nudgePiece(1, 0);
      break;
    case "ArrowDown":
      nudgePiece(0, 1);
      break;
    case "ArrowUp":
      tryRotate();
      break;
  }
}

document.onkeyup = function(e) {
  switch (e.key) {
    case "ArrowDown":
      gameState.currentPiece.superDrop = false;
      gameState.currentPiece.timeTillDrop = 1000;
      break;
  }
}

function animate() {
	requestAnimationFrame( animate );

  const deltaTime = gameState.Clock.getDelta() * 1000;

  if (gameState.currentPiece.position === null) {
    gameState.currentPiece.position = new THREE.Vector2(3, 1);
    gameState.currentPiece.rotation = 0;
    gameState.currentPiece.timeTillDrop = gameState.currentPiece.superDrop ? 100 : 1000;

    switch(Math.floor(Math.random() * 6)) {
      case 0:
        gameState.currentPiece.tetraminos = tetraminoData.I;
        break;
      case 1:
        gameState.currentPiece.tetraminos = tetraminoData.O;
        break;
      case 2:
        gameState.currentPiece.tetraminos = tetraminoData.T;
        break;
      case 3:
        gameState.currentPiece.tetraminos = tetraminoData.S;
        break;
      case 4:
        gameState.currentPiece.tetraminos = tetraminoData.Z;
        break;
      case 5:
        gameState.currentPiece.tetraminos = tetraminoData.J;
        break;
      case 6:
        gameState.currentPiece.tetraminos = tetraminoData.L;
        break;
    }
  }

  function lockPiece(x, y, tetramino) {
    // Lock the piece
    blitTetramino(x, y, gameState.playField, tetramino);
    gameState.currentPiece.position = null;

    // Skip the next part if the bottom row isn't full
    for (let i = getFieldIndex(0, 22); i <= getFieldIndex(9, 22); i++) {
      if (gameState.playField[i] === 0) {
        return;
      }
    }

    // Tetris!
    //gameState.playField.splice(getFieldIndex(0, 1), Infinity, gameState.playField.slice(getFieldIndex(0, getFieldIndex(0, 22))));
    //for (let i = 0; i <= getFieldIndex(9, 0); i++) { // I don't know if this is actually important but I'm still clearing the top row
    //  gameState.playField[i] = 0;
    //}
  }

  if (gameState.currentPiece.timeTillDrop <= 0) {
    gameState.currentPiece.timeTillDrop = gameState.currentPiece.superDrop ? 100 : 1000;
    const nextPosition = gameState.currentPiece.position.clone().add(new THREE.Vector2(0, 1));

    // Lock the piece if it's colliding
    const tetramino = gameState.currentPiece.tetraminos[gameState.currentPiece.rotation];
    if (testCollision(nextPosition.x, nextPosition.y, tetramino)) {
      lockPiece(gameState.currentPiece.position.x, gameState.currentPiece.position.y, tetramino);
    } else {
      gameState.currentPiece.position = nextPosition;
    }

  } else {
    gameState.currentPiece.timeTillDrop -= deltaTime;
  }

  draw();
	gameState.Renderer.render( gameState.Scene, gameState.Camera );
}

init();