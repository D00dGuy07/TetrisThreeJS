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

  playField: new Array(10 * 23).fill(0),

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

  gameState.objects.push(new THREE.Mesh( gameState.geometries.I, new THREE.MeshBasicMaterial( { color: 0x31C7EF, wireframe: true } ) ) );
  gameState.objects.push(new THREE.Mesh( gameState.geometries.O, new THREE.MeshBasicMaterial( { color: 0xF7D308, wireframe: true } ) ) );
  gameState.objects.push(new THREE.Mesh( gameState.geometries.T, new THREE.MeshBasicMaterial( { color: 0xAD4D9C, wireframe: true } ) ) );
  gameState.objects.push(new THREE.Mesh( gameState.geometries.S, new THREE.MeshBasicMaterial( { color: 0x42B642, wireframe: true } ) ) );
  gameState.objects.push(new THREE.Mesh( gameState.geometries.Z, new THREE.MeshBasicMaterial( { color: 0xEF2029, wireframe: true } ) ) );
  gameState.objects.push(new THREE.Mesh( gameState.geometries.J, new THREE.MeshBasicMaterial( { color: 0x5A65AD, wireframe: true } ) ) );
  gameState.objects.push(new THREE.Mesh( gameState.geometries.L, new THREE.MeshBasicMaterial( { color: 0xEF7921, wireframe: true } ) ) );

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

  // Initialize the meshes
  initMeshes();

  blitTetramino(0, 18, gameState.playField, tetraminoData.T[0]);
  blitTetramino(0, 16, gameState.playField, tetraminoData.Z[3]);
  blitTetramino(3, 18, gameState.playField, tetraminoData.I[0]);
  blitTetramino(1, 16, gameState.playField, tetraminoData.O[0]);
  blitTetramino(0, 18, gameState.playField, tetraminoData.T[0]);
  blitTetramino(4, 17, gameState.playField, tetraminoData.J[0]);
  blitTetramino(8, 17, gameState.playField, tetraminoData.J[3]);
  blitTetramino(6, 17, gameState.playField, tetraminoData.L[3]);
  blitTetramino(4, 15, gameState.playField, tetraminoData.T[2]);
  blitTetramino(6, 15, gameState.playField, tetraminoData.I[1]);

  updateMeshes();

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
  let fieldIndex = getFieldIndex(9, 19);
  while (fieldIndex >= 0) {
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
      vertices[vertexIndex++] = -(startCoord.y + 1 - 10);
      vertexIndex++;

      vertices[vertexIndex++] = startCoord.x + 1 - 5;
      vertices[vertexIndex++] = -(startCoord.y + 1 - 10);
      vertexIndex++;

      vertices[vertexIndex++] = startCoord.x + 1 - 5;
      vertices[vertexIndex++] = -(endCoord.y - 10);
      vertexIndex++;

      vertices[vertexIndex++] = endCoord.x - 5;
      vertices[vertexIndex++] = -(endCoord.y - 10);
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

function updateMeshes() {
  let field = gameState.playField.slice();

  createMesh(field, gameState.geometries.I, 1);
  createMesh(field, gameState.geometries.O, 2);
  createMesh(field, gameState.geometries.T, 3);
  createMesh(field, gameState.geometries.S, 4);
  createMesh(field, gameState.geometries.Z, 5);
  createMesh(field, gameState.geometries.J, 6);
  createMesh(field, gameState.geometries.L, 7);
}

function animate() {
	requestAnimationFrame( animate );

	gameState.Renderer.render( gameState.Scene, gameState.Camera );
}

init();