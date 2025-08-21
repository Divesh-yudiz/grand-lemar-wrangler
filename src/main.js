import * as THREE from "https://esm.sh/three@0.169.0";
import { OrbitControls } from "https://esm.sh/three@0.169.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://esm.sh/three@0.169.0/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "https://esm.sh/three@0.169.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://esm.sh/three@0.169.0/examples/jsm/postprocessing/RenderPass.js";
import poloCoaModel from './assets/Raglan.glb';
import fabric1 from './assets/fabrics/color2.png';
import uv1 from './assets/fabrics/uv2.png';
import fabric2 from './assets/fabrics/color.jpeg';
import uv2 from './assets/fabrics/uv.png';
import buttonFabric3 from './assets/fabrics/C221-2.png';
import buttonFabric2 from './assets/fabrics/MH1_Black-with-small-stain.png';
import buttonFabric1 from './assets/fabrics/MH3_Dark-Brown_.png';

// ----- Global Variables -----
let scene, camera, renderer, controls, suitGroup, composer, renderPass;
let aLight = [], dirLight2, dirLight3, backLight;
let cameraFollowLight; // Add this new variable
const loadedMeshes = {};

// Remove GUI variables and keep only the light offset
let lightOffset = {
  x: -20,
  y: 16.8,
  z: 10
};

// Remove lapel-related variables
let currentButtoning, currentShoulder, currentMartingaleBelt, currentInvertedBoxPleat = true, currentFront, currentChestPocket, currentSidePocket, currentSleeveDesign, currentLinings;

// Add collar-related variables
let currentCollar = 'unconstructed';

// ----- Configuration Data -----
const CONFIG = {
  defaults: {
    buttoning: 'Unconstructed',
    shoulder: 'Unconstructed',
    martingaleBelt: true,
    invertedBoxPleat: true,
    chestPocket: "boat",
    sidePocket: "slanted-welt",
    sleeveDesign: "cuffed",
    linings: true,
    fabric: "fabric1",
    buttonFabric: "button-fabric1", // Add button fabric default
    liningFabric: "lining-fabric1",  // Add lining fabric default
    collar: "unconstructed" // Add collar default
  },

  assets: {
    buttoning: {
      Unconstructed: '2mm_Button',
      double_breasted_6: '6_buttons',
    },
    shoulder: {
      Unconstructed: '_Unconstructed',
      Lightly_Padded: '_Lightly_Padded'
    },

  },
  // Add fabric assets mapping
  fabrics: {
    fabric1: {
      color: fabric1,
      normal: uv1,
      name: 'Charcoal Grey'
    },
    fabric2: {
      color: fabric2,
      normal: uv2,
      name: 'Light Beige'
    }
  },

  // Add button fabric assets mapping
  buttonFabrics: {
    'button-fabric1': {
      color: buttonFabric1, // MH3_Dark-Brown_.png
      normal: '',
      name: 'Dark Brown'
    },
    'button-fabric2': {
      color: buttonFabric2, // MH1_Black-with-small-stain.png
      normal: '',
      name: 'Black'
    },
    'button-fabric3': {
      color: buttonFabric3, // C221-2.png
      normal: '',
      name: 'Navy'
    }
  },

  // Add lining fabric assets mapping
  liningFabrics: {
    'lining-fabric1': {
      color: fabric1,
      normal: uv1,
      name: 'Charcoal Grey'
    },
    'lining-fabric2': {
      color: fabric2,
      normal: uv2,
      name: 'Light Beige'
    }
  }
};

// Add new global variables for the flow control
let selectedMainFabric = null;
let currentScreen = 'fabric-selection'; // 'fabric-selection' or 'config'

// ----- Three.js Initialization -----
function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  // Get the viewer div dimensions
  const viewerDiv = document.getElementById("viewer");
  const viewerWidth = viewerDiv.clientWidth;
  const viewerHeight = viewerDiv.clientHeight;

  camera = new THREE.OrthographicCamera(
    viewerWidth / -650,
    viewerWidth / 650,
    viewerHeight / 650,
    viewerHeight / -650,
    1,
    1000
  );
  camera.position.set(0, 0, 12);
  camera.updateProjectionMatrix();
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });

  renderer.shadowMap.enabled = true;
  renderer.gammaInput = true;
  renderer.gammaOutput = true;

  renderer.setSize(viewerWidth, viewerHeight);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  composer = new EffectComposer(renderer);
  renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  document.getElementById("viewer").appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  backLight = new THREE.DirectionalLight(0xffffff, 1);
  scene.add(backLight);
  backLight.position.set(10, 0, 10);

  cameraFollowLight = new THREE.DirectionalLight(0xffffff, 3.9);
  cameraFollowLight.castShadow = true;
  cameraFollowLight.shadow.mapSize.width = 2048;
  cameraFollowLight.shadow.mapSize.height = 2048;
  cameraFollowLight.shadow.camera.near = 0.5;
  cameraFollowLight.shadow.camera.far = 50;
  cameraFollowLight.shadow.camera.left = -10;
  cameraFollowLight.shadow.camera.right = 10;
  cameraFollowLight.shadow.camera.top = 10;
  cameraFollowLight.shadow.camera.bottom = -10;
  scene.add(cameraFollowLight);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  // controls.enableDamping = true;
  // controls.enablePan = false;
  // controls.minPolarAngle = Math.PI / 2;
  // controls.maxPolarAngle = Math.PI / 2;
  // controls.minZoom = 0.75;
  // controls.maxZoom = 1.5;
  // controls.enableZoom = false;


  suitGroup = new THREE.Group();
  scene.add(suitGroup);

  // Remove GUI initialization
  // initGUI();

  animate();
}

// Remove the entire initGUI function

function animate() {
  if (cameraFollowLight) {
    const offset = new THREE.Vector3(lightOffset.x, lightOffset.y, lightOffset.z);
    offset.applyQuaternion(camera.quaternion);
    cameraFollowLight.position.copy(camera.position).add(offset);
    if (suitGroup) {
      cameraFollowLight.target.position.copy(suitGroup.position);
      cameraFollowLight.target.updateMatrixWorld();
    }
  }

  requestAnimationFrame(animate);
  composer.render();
}

function loadJacketModel(url) {
  const loader = new GLTFLoader();
  loader.load(url, async gltf => {
    const model = gltf.scene;
    suitGroup.clear();
    suitGroup.add(model);
    centerModel(model);
    await storeTopLevelGroups(model);  // Add await here
    applyDefaultConfig();              // Now this runs after meshes are stored
  }, undefined, function (error) {
    console.error('An error occurred loading the model:', error);
  });
}

function centerModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  model.position.sub(center);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2 / maxDim;
  model.scale.setScalar(scale);
  box.setFromObject(model);
  const newCenter = box.getCenter(new THREE.Vector3());
  model.position.sub(newCenter);
}

function setAllMeshesInvisible(object) {
  object.traverse((child) => {
    child.visible = false;
  });
}

async function storeTopLevelGroups(root) {
  return new Promise((resolve) => {
    root.children.forEach(child => {
      if (child.name) {
        loadedMeshes[child.name] = child; // group of options
        setAllMeshesInvisible(child);
      }
    });

    console.log("Loaded meshes:", loadedMeshes);

    resolve();
  });
}

function updateVariant(groupName, visibleChildName, toggle = true, visibility = true) {
  const group = loadedMeshes[groupName]; // e.g., Buttons, Shoulder


  if (!group) {
    console.warn(`Group '${groupName}' not found`);
    return;
  }
  if (!group.visible) {
    group.visible = true;
  }

  if (group.isMesh) {
    group.visible = visibility;
    return;
  }

  if (visibleChildName === "none") {
    group.children.forEach(child => {
      child.visible = false;
    });
  } else {
    group.children.forEach(child => {
      if (child.name === visibleChildName) {
        child.visible = visibility; // Use the visibility parameter here
        child.traverse(subChild => {
          subChild.visible = visibility; // Also apply visibility to sub-children
        });
      } else {
        if (toggle) {
          child.visible = false;
        } else {
          child.visible = true;
        }
      }
    });
  }
}

function applyDefaultConfig() {
  // scaleButtonsOnXAxis(1.09);
  updateBack(); // Changed from updateFront() to updateBack()
  updateButtoning(CONFIG.defaults.buttoning);
  updateShoulder(CONFIG.defaults.shoulder);
  martingaleBelt(CONFIG.defaults.martingaleBelt);
  invertedBoxPleat(CONFIG.defaults.invertedBoxPleat);
  updateChestPocket(CONFIG.defaults.chestPocket);
  updateSidePocket(CONFIG.defaults.sidePocket);
  updateSleeveDesign(CONFIG.defaults.sleeveDesign);
  updateLinings(); // Remove parameter, let it determine dynamically
  updateFabric(CONFIG.defaults.fabric); // Add fabric update
  updateButtonFabric(CONFIG.defaults.buttonFabric); // Add button fabric update
  updateLiningFabric(CONFIG.defaults.liningFabric); // Add lining fabric update
}



///Start of update functions----------------------------------------------------------
function updateButtoning(styleKey, toggle = true, visibility = true) {
  const buttoningMap = {
    Unconstructed: '2mm_Button',
    Lightly_Padded: '0mm_Buttons',
    belt_buttons: 'belt_button',
    slanted_buttons: 'slated_button',
    one_strap: 'one_strap_button',
    pleat_buttons: 'pleat_buttons',
    sec_strap: 'sec_strap'
  };

  currentButtoning = styleKey;
  updateVariant('Buttons', buttoningMap[styleKey], toggle, visibility);
}

function updateBack() {
  if (currentInvertedBoxPleat === "false" || currentInvertedBoxPleat === false) {
    if (currentShoulder == "Unconstructed") {
      updateVariant('back', "2mm_back", true, true);
    } else {
      updateVariant('back', "0mm_back", true, true);
    }
  } else {
    if (currentShoulder == "Unconstructed") {
      updateVariant('back', "2mm_back", true, false);
    } else {
      updateVariant('back', "0mm_back", true, false);
    }
  }
}


function updateShoulder(styleKey) {
  const shoulderMap = {
    Unconstructed: '2mm_front',
    Lightly_Padded: '0mm_front',
  };


  currentShoulder = styleKey;

  updateCollar(styleKey);
  updateButtoning(styleKey)
  updateBack()

  const shoulderGroup = loadedMeshes['Shoulder'];
  if (!shoulderGroup) {
    console.warn('Shoulder group not found');
    return;
  }

  shoulderGroup.visible = true;

  const targetName = shoulderMap[styleKey];
  let found = false;

  // Hide all variants; show only the target
  shoulderGroup.children.forEach((variant) => {
    const isTarget = variant.name === targetName;
    if (isTarget) found = true;

    variant.visible = isTarget;
    variant.traverse((subChild) => {
      subChild.visible = isTarget;
    });
  });

  if (!found) {
    console.warn(`Shoulder variant not found for "${styleKey}"`);
    // Ensure nothing is shown if we don't find the target
    shoulderGroup.children.forEach((variant) => {
      variant.visible = false;
      variant.traverse((subChild) => {
        subChild.visible = false;
      });
    });
  }
}


function martingaleBelt(styleKey, visibility = true) {
  currentMartingaleBelt = styleKey;
  updateVariant('belt', "Martingle_blet", true, visibility);
}


function invertedBoxPleat(styleKey = currentInvertedBoxPleat, visibility = true) {

  function updatePleatButtons(visibility) {
    const pleatButtonsGroup = loadedMeshes['Buttons'];
    if (pleatButtonsGroup) {
      pleatButtonsGroup.traverse((child) => {
        if (child.name === "pleat_button") {
          child.visible = visibility;
          child.traverse((subChild) => {
            subChild.visible = visibility;
          });
        }
      });
    }
  }

  if (styleKey == "false" || styleKey == false || styleKey == "true" || styleKey == true) {
    currentInvertedBoxPleat = styleKey;
  }

  if (currentInvertedBoxPleat === "false" || currentInvertedBoxPleat === false) {
    updateVariant('pleat', "none", true, false);
    updateBack(false);
    if (styleKey === "false") {
      updatePleatButtons(false);
    } else {
      updatePleatButtons(true);
    }
    return;
  }

  const shoulderConfig = currentShoulder || CONFIG.defaults.shoulder;

  // Map buttoning and shoulder configuration to the appropriate pleat variant
  const pleatVariantMap = {
    'Lightly_Padded': '0mm_inverted_pleat',
    'Unconstructed': '2mm_invert_box_pleat',
  };

  // Create the key based on buttoning and shoulder
  let pleatKey;
  pleatKey = `${shoulderConfig}`;

  const targetPleatVariant = pleatVariantMap[pleatKey];
  if (targetPleatVariant) {
    updatePleatButtons(styleKey);
    updateBack(false);
    updateVariant('pleat', targetPleatVariant, true, visibility);
  } else {
    console.warn(`No pleat variant found for buttoning: ${shoulderConfig}, shoulder: ${shoulderConfig}`);
  }
}

function updateChestPocket(styleKey) {
  currentChestPocket = styleKey;
  const chestPocketMap = {
    'boat': 'boat',
    'none': 'none',
  };
  updateVariant('ChestPocket', chestPocketMap[styleKey]);
}

function updateSidePocket(styleKey) {
  const sidePocketMap = {
    'path-with-flaps': 'Patch',
    'slanted-welt': 'slanted',
    'slanted-welt-buttons': 'slanted',
  };
  currentSidePocket = styleKey;
  if (styleKey === 'slanted-welt-buttons') {
    updateVariant('Sidepocket', sidePocketMap[styleKey]);
    updateVariant('Buttons', 'slated_button', false, true);
  } else {
    updateVariant('Buttons', 'slated_button', false, false);
    updateVariant('Sidepocket', sidePocketMap[styleKey]);
  }
}

// Fix the sleeve design function to use correct mesh names
function updateSleeveDesign(styleKey) {
  const sleeveDesignMap = {
    'un-cuffed': 'un_cuffed',
    'cuffed': 'cuffed',
    'sleeve-strap': 'Sleeve_Strap',
    'sleeve-strap-with-buttons': 'Full_Sleeve_Strap_with_buttons'
  };

  // Handle sleeve-specific buttons separately without affecting main buttoning
  if (styleKey === 'sleeve-strap-with-buttons') {
    updateVariant('sleave_buttons', 'sec_strap', true);
  } else if (styleKey === 'sleeve-strap') {
    updateVariant('sleave_buttons', 'one_strap_button', true);
  } else if (styleKey === 'un-cuffed') {
    updateVariant('sleave_buttons', 'none', true);
  }

  currentSleeveDesign = styleKey;
  updateVariant('Sleeve_design', sleeveDesignMap[styleKey]);
}

function updateLinings(visibility = true) {
  currentLinings = visibility;

  function updateSleeveLinings() {
    const sleeveLiningsGroup = loadedMeshes['lining'];
    if (sleeveLiningsGroup) {
      sleeveLiningsGroup.children.forEach(child => {
        if (child.name === "2mm_Lining" || child.name === "Lining") {
          child.visible = visibility;
          child.traverse(subChild => {
            subChild.visible = visibility;
          });
        }
      });
    }
  }

  updateVariant('lining', 'Lining', true, visibility);
  updateSleeveLinings();
}

// Add collar update function after the other update functions
function updateCollar(styleKey) {
  const collarMap = {
    'Unconstructed': '2mm_collar',
    'Lightly_Padded': '00mm_collar'
  };

  currentCollar = styleKey;
  updateVariant('Collar', collarMap[styleKey]);
}

///End of update functions

/**
 * Get the current active configuration from the UI
 * @returns {Object} Current configuration object
 */
function getCurrentConfig() {
  const config = {};

  // Map of select IDs to their corresponding config keys
  const selectMapping = {
    'buttoning-select': 'buttoning',
    'shoulder-select': 'shoulder',
    'martingale-belt-select': 'belt',
    'inverted-box-pleat-select': 'invertedBoxPleat',
    'chest-pocket-select': 'chestPocket',
    'side-pocket-select': 'sidePocket',
    'sleeve-design-select': 'sleeveDesign',
    'lining-select': 'linings',
    'collar-select': 'collar' // Add collar mapping
  };

  // Get values from all select elements
  Object.entries(selectMapping).forEach(([selectId, configKey]) => {
    const selectElement = document.getElementById(selectId);
    if (selectElement) {
      let value = selectElement.value;

      // Convert string boolean values to actual booleans
      if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      }

      config[configKey] = value;
    }
  });

  // Add fabric configurations
  config.fabric = CONFIG.defaults.fabric;
  config.buttonFabric = CONFIG.defaults.buttonFabric;
  config.liningFabric = CONFIG.defaults.liningFabric;

  // Also include the current global variables for completeness
  config.currentButtoning = currentButtoning;
  config.currentShoulder = currentShoulder;
  config.currentMartingaleBelt = currentMartingaleBelt;
  config.currentInvertedBoxPleat = currentInvertedBoxPleat;
  config.currentFront = currentFront;
  config.currentChestPocket = currentChestPocket;
  config.currentSidePocket = currentSidePocket;
  config.currentSleeveDesign = currentSleeveDesign;
  config.currentLinings = currentLinings;
  config.currentCollar = currentCollar; // Add current collar

  return config;
}

/**
 * Get a specific configuration value
 * @param {string} configKey - The configuration key to retrieve
 * @returns {*} The configuration value
 */
function getConfigValue(configKey) {
  const config = getCurrentConfig();
  return config[configKey];
}

/**
 * @param {THREE.Texture} colorTexture
 * @param {THREE.Texture} normalTexture
 * @param {Array} targetGroups
 * @param {Object} materialOptions
 * @param {Array} excludeGroups
 */
function applyTexturesToGroups(colorTexture, normalTexture, targetGroups, materialOptions = {}, excludeGroups = []) {
  if (!suitGroup || !targetGroups || targetGroups.length === 0) return;

  // Configure texture settings
  const configureTexture = (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.encoding = THREE.sRGBEncoding;

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.anisotropy = maxAnisotropy;

    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const repeatX = materialOptions.repeat?.[0] || 10;
    const repeatY = materialOptions.repeat?.[1] || 10;
    texture.repeat.set(repeatX, repeatY);
  };

  // Configure both textures
  configureTexture(colorTexture);
  if (normalTexture) {
    configureTexture(normalTexture);
  }

  // Function to check if a mesh belongs to target groups
  function isTargetGroup(mesh) {
    if (!mesh.name) return false;

    // Check if mesh is in exclude groups
    if (excludeGroups.some(exclude => mesh.name.toLowerCase().includes(exclude.toLowerCase()))) {
      return false;
    }

    // Check if mesh is in target groups
    return targetGroups.some(target => mesh.name.toLowerCase().includes(target.toLowerCase()));
  }

  // Function to check if a mesh belongs to target groups (including parent hierarchy)
  function isInTargetGroup(mesh) {
    if (isTargetGroup(mesh)) return true;

    let parent = mesh.parent;
    while (parent) {
      if (isTargetGroup(parent)) return true;
      parent = parent.parent;
    }
    return false;
  }

  // Function to apply textures to a mesh
  function applyTexturesToMesh(mesh) {
    if (mesh.isMesh && mesh.material && isInTargetGroup(mesh)) {
      mesh.material.map = colorTexture;
      if (normalTexture) {
        mesh.material.normalMap = normalTexture;
        mesh.material.normalMap.needsUpdate = true;
      }

      mesh.material.polygonOffset = true;
      mesh.material.polygonOffsetFactor = 1;
      mesh.material.polygonOffsetUnits = 1;

      mesh.material.depthWrite = true;
      mesh.material.depthTest = true;
      mesh.material.roughness = 1;
      mesh.material.metalness = 0.5;

      mesh.material.needsUpdate = true;
    }
  }

  // Traverse and apply textures
  suitGroup.traverse((child) => {
    applyTexturesToMesh(child);
  });
}

/**
 * Load and apply fabric textures to the model
 * @param {string} colorTextureUrl - URL or path to the fabric color texture
 * @param {string} normalTextureUrl - URL or path to the fabric normal texture
 * @param {Object} materialOptions - Additional material properties
 */
function loadAndApplyFabric(colorTextureUrl, normalTextureUrl, materialOptions = {}, targetGroups = ['Front', 'Shoulder', 'Collar', 'back', 'ChestPocket', 'Sidepocket', 'Sleeve_design', 'pleat', 'belt'], excludeGroups = ['Buttons', 'lining',]) {
  const textureLoader = new THREE.TextureLoader();
  let colorTextureLoaded = false;
  let normalTextureLoaded = false;
  let colorTexture, normalTexture;

  // Load color texture
  textureLoader.load(
    colorTextureUrl,
    (texture) => {
      colorTexture = texture;
      colorTextureLoaded = true;

      if (colorTextureLoaded && normalTextureLoaded) {
        applyTexturesToGroups(colorTexture, normalTexture, targetGroups, materialOptions, excludeGroups);
      }
    },
    undefined,
    (error) => {
      console.error('❌ Error loading color texture:', error);
    }
  );

  // Load normal texture
  textureLoader.load(
    normalTextureUrl,
    (texture) => {
      normalTexture = texture;
      normalTextureLoaded = true;

      if (colorTextureLoaded && normalTextureLoaded) {
        applyTexturesToGroups(colorTexture, normalTexture, targetGroups, materialOptions, excludeGroups);
        // Force a second application after a short delay to ensure consistency
        setTimeout(() => {
          // Removed buttonhole lapel texture application as lapel functionality is removed
        }, 100);
      }
    },
    undefined,
    (error) => {
      console.error('❌ Error loading normal texture:', error);
    }
  );
}

// Add fabric update function
function updateFabric(fabricKey) {
  const fabricConfig = CONFIG.fabrics[fabricKey];
  if (!fabricConfig) {
    console.warn(`❌ Fabric configuration not found for: ${fabricKey}`);
    return;
  }

  // Load and apply the new fabric
  loadAndApplyFabric(fabricConfig.color, fabricConfig.normal, {
    repeat: [20, 20],
  });

  // Update UI to show selected fabric
  updateFabricSelectionUI(fabricKey);
}

// Add button fabric update function
function updateButtonFabric(fabricKey) {
  const fabricConfig = CONFIG.buttonFabrics[fabricKey];
  if (!fabricConfig) {
    console.warn(`❌ Button fabric configuration not found for: ${fabricKey}`);
    return;
  }

  // Load and apply the new button fabric
  loadAndApplyButtonFabric(fabricConfig.color, null, {
    repeat: [1, 1],
  });

  // Update UI to show selected button fabric
  updateButtonFabricSelectionUI(fabricKey);
}

// Add lining fabric update function
function updateLiningFabric(fabricKey) {
  const fabricConfig = CONFIG.liningFabrics[fabricKey];
  if (!fabricConfig) {
    console.warn(`❌ Lining fabric configuration not found for: ${fabricKey}`);
    return;
  }

  // Load and apply the new lining fabric
  loadAndApplyLiningFabric(fabricConfig.color, fabricConfig.normal, {
    repeat: [20, 20],
  });

  // Update UI to show selected lining fabric
  updateLiningFabricSelectionUI(fabricKey);
}

// Add function to update button fabric selection UI
function updateButtonFabricSelectionUI(selectedFabric) {
  const fabricOptions = document.querySelectorAll('[data-fabric^="button-fabric"]');
  fabricOptions.forEach(option => {
    option.classList.remove('selected');
    if (option.dataset.fabric === selectedFabric) {
      option.classList.add('selected');
    }
  });
}

// Add function to update lining fabric selection UI
function updateLiningFabricSelectionUI(selectedFabric) {
  const fabricOptions = document.querySelectorAll('[data-fabric^="lining-fabric"]');
  fabricOptions.forEach(option => {
    option.classList.remove('selected');
    if (option.dataset.fabric === selectedFabric) {
      option.classList.add('selected');
    }
  });
}

// ----- Update On Config Change -----
function handleConfigChange(event) {
  const configType = event.target.id.replace('-select', '');
  const value = event.target.value;
  CONFIG.defaults[configType] = value;

  if (configType === 'shoulder') {
    updateShoulder(value);
    updateBack();
    invertedBoxPleat();
  }

  if (configType === 'inverted-box-pleat') {
    currentInvertedBoxPleat = value;
    invertedBoxPleat(value);
  }

  if (configType === 'martingale-belt') {
    const isVisible = value === 'true';
    currentMartingaleBelt = value;
    martingaleBelt(value, isVisible);
  }

  if (configType === 'chest-pocket') {
    updateChestPocket(value);
  }

  if (configType === 'side-pocket') {
    updateSidePocket(value);
  }

  if (configType === 'sleeve-design') {
    updateSleeveDesign(value);
  }

  if (configType === 'lining') {
    if (value === 'full-lining') {
      updateLinings(true);
    } else {
      updateLinings(false);
    }
  }
}

/**
 * @param {string} colorTextureUrl
 * @param {string} normalTextureUrl
 * @param {Object} materialOptions
 */
function loadAndApplyButtonFabric(colorTextureUrl, normalTextureUrl, materialOptions = {}) {
  const textureLoader = new THREE.TextureLoader();
  let colorTextureLoaded = false;
  let normalTextureLoaded = false;
  let colorTexture, normalTexture;

  // Load color texture
  textureLoader.load(
    colorTextureUrl,
    (texture) => {
      colorTexture = texture;
      colorTextureLoaded = true;

      if (colorTextureLoaded) {
        // Apply button fabric texture to all button elements
        applyTexturesToGroups(colorTexture, null, [
          'Buttons', '2_Buttons', '6_buttons', 'belt_button', 'belt_buttons',
          'pleat_buttons', 'sleave_buttons', 'sec_strap', 'one_strap_button', 'pleat_button'
        ], materialOptions, [
          'Full_Sleeve_Strap_with_buttons', 'Sleeve_Eqaulettes003',
          'one_strap002'
        ]);
      }
    },
    undefined,
    (error) => {
      console.error('❌ Error loading button color texture:', error);
    }
  );

  if (normalTextureUrl !== null) {
    // Load normal texture
    textureLoader.load(
      normalTextureUrl,
      (texture) => {
        normalTexture = texture;
        normalTextureLoaded = true;

        if (colorTextureLoaded && normalTextureLoaded) {
          // Apply button fabric texture to all button elements
          applyTexturesToGroups(colorTexture, normalTexture, [
            'Buttons', '2_Buttons', '6_buttons', 'belt_button', 'belt_buttons',
            'pleat_buttons', 'sleave_buttons', 'sec_strap', 'one_strap_button', 'pleat_button'
          ], materialOptions, [
            'Full_Sleeve_Strap_with_buttons', 'Sleeve_Eqaulettes003',
            'one_strap002'
          ]);
        }
      },
      undefined,
      (error) => {
        console.error('❌ Error loading button normal texture:', error);
      }
    );
  }
}



/**
 * Load and apply lining fabric textures
 * @param {string} colorTextureUrl - URL or path to the lining fabric color texture
 * @param {string} normalTextureUrl - URL or path to the lining fabric normal texture
 * @param {Object} materialOptions - Additional material properties
 */
function loadAndApplyLiningFabric(colorTextureUrl, normalTextureUrl, materialOptions = {}) {
  const textureLoader = new THREE.TextureLoader();
  let colorTextureLoaded = false;
  let normalTextureLoaded = false;
  let colorTexture, normalTexture;

  // Load color texture
  textureLoader.load(
    colorTextureUrl,
    (texture) => {
      colorTexture = texture;
      colorTextureLoaded = true;

      if (colorTextureLoaded && normalTextureLoaded) {
        applyTexturesToGroups(colorTexture, normalTexture, ['lining'], materialOptions, ['Front', 'Shoulder', 'vent', 'ChestPocket', 'Sidepocket', 'Sleeve_design', 'Inverted_Box_Pleat', 'Martingale_Belt', 'Buttons']);
      }
    },
    undefined,
    (error) => {
      console.error('❌ Error loading lining color texture:', error);
    }
  );

  // Load normal texture
  textureLoader.load(
    normalTextureUrl,
    (texture) => {
      normalTexture = texture;
      normalTextureLoaded = true;

      if (colorTextureLoaded && normalTextureLoaded) {
        applyTexturesToGroups(colorTexture, normalTexture, ['Lining'], materialOptions, ['Front', 'Shoulder', 'vent', 'ChestPocket', 'Sidepocket', 'Sleeve_design', 'Inverted_Box_Pleat', 'Martingale_Belt', 'Buttons']);
      }
    },
    undefined,
    (error) => {
      console.error('❌ Error loading lining normal texture:', error);
    }
  );
}

// ----- Initialize Fabric Selection UI -----
function initFabricSelectionUI() {
  const fabricCards = document.querySelectorAll('.fabric-card');
  fabricCards.forEach(card => {
    card.addEventListener('click', () => {
      fabricCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedMainFabric = card.dataset.fabric;
      updateFabric(selectedMainFabric);
    });
  });

  const fabricNextBtn = document.getElementById('fabric-next-btn');
  if (fabricNextBtn) {
    fabricNextBtn.addEventListener('click', () => {
      if (selectedMainFabric) {
        showConfigurationUI();
      } else {
        alert('Please select a fabric first');
      }
    });
  }

  // Add back button event listener in config UI
  const backToFabricBtn = document.getElementById('back-to-fabric-btn');
  if (backToFabricBtn) {
    backToFabricBtn.addEventListener('click', () => {
      showFabricSelectionUI();
    });
  }
}

// ----- Show/Hide UI Functions -----
function showConfigurationUI() {
  currentScreen = 'config';
  document.getElementById('fabric-selection-screen').style.display = 'none';
  document.getElementById('config-sidebar').style.display = 'flex';

  // Initialize the configuration UI if not already done
  if (!window.configUIInitialized) {
    initConfigUI();
    window.configUIInitialized = true;
  }
}

function showFabricSelectionUI() {
  currentScreen = 'fabric-selection';
  document.getElementById('config-sidebar').style.display = 'none';
  document.getElementById('fabric-selection-screen').style.display = 'flex';
}

// ----- Update Fabric Selection UI -----
function updateFabricSelectionUI(selectedFabric) {
  // Update fabric cards in the fabric selection screen
  const fabricCards = document.querySelectorAll('.fabric-card');
  fabricCards.forEach(card => {
    card.classList.remove('selected');
    if (card.dataset.fabric === selectedFabric) {
      card.classList.add('selected');
    }
  });

  // Also update fabric options in the config UI if they exist
  const fabricOptions = document.querySelectorAll('.fabric-option');
  fabricOptions.forEach(option => {
    option.classList.remove('selected');
    if (option.dataset.fabric === selectedFabric) {
      option.classList.add('selected');
    }
  });
}

// ----- Initialize DOM Selectors & Events -----
function initConfigUI() {
  const selects = [
    'buttoning', 'shoulder', 'martingale-belt',
    'inverted-box-pleat', 'chest-pocket', 'side-pocket', 'sleeve-design', 'lining', 'collar' // Add collar
  ];

  selects.forEach(id => {
    const domId = `${id}-select`;
    const element = document.getElementById(domId);
    if (element) {
      element.addEventListener('change', handleConfigChange);
    }
  });

  // Add button fabric selection event listeners
  const buttonFabricOptions = document.querySelectorAll('[data-fabric^="button-fabric"]');
  buttonFabricOptions.forEach(option => {
    option.addEventListener('click', () => {
      const fabricKey = option.dataset.fabric;
      handleButtonFabricChange(fabricKey);
    });
  });

  // Add lining fabric selection event listeners
  const liningFabricOptions = document.querySelectorAll('[data-fabric^="lining-fabric"]');
  liningFabricOptions.forEach(option => {
    option.addEventListener('click', () => {
      const fabricKey = option.dataset.fabric;
      handleLiningFabricChange(fabricKey);
    });
  });

  // Initialize button and lining fabric selection UIs
  updateButtonFabricSelectionUI(CONFIG.defaults.buttonFabric);
  updateLiningFabricSelectionUI(CONFIG.defaults.liningFabric);
}

// Add button fabric change handler
function handleButtonFabricChange(fabricKey) {
  CONFIG.defaults.buttonFabric = fabricKey;
  updateButtonFabric(fabricKey);
}

// Add lining fabric change handler
function handleLiningFabricChange(fabricKey) {
  CONFIG.defaults.liningFabric = fabricKey;
  updateLiningFabric(fabricKey);
}

// ----- Init Everything on Load -----
document.addEventListener('DOMContentLoaded', () => {
  initThree();
  initFabricSelectionUI(); // Initialize fabric selection UI first
  loadJacketModel(poloCoaModel);

  // Set default fabric selection
  selectedMainFabric = CONFIG.defaults.fabric;
  updateFabricSelectionUI(selectedMainFabric);
  updateFabric(selectedMainFabric);
});

// ----- Handle Resize -----
window.addEventListener('resize', () => {
  const viewerDiv = document.getElementById("viewer");
  const viewerWidth = viewerDiv.clientWidth;
  const viewerHeight = viewerDiv.clientHeight;

  camera.left = viewerWidth / -650;
  camera.right = viewerWidth / 650;
  camera.top = viewerHeight / 650;
  camera.bottom = viewerHeight / -650;
  camera.updateProjectionMatrix();
  renderer.setSize(viewerWidth, viewerHeight);
});
