let plantsData = [];
let plantNetApiKey = '2b1013KnpQM3yJeivZoMmFm9iu';
const resultModal = document.getElementById('result-modal');
const closeModalBtn = document.getElementById('close-modal');
const closeCameraBtn = document.getElementById('close-camera');
const video = document.getElementById('video');
const cameraView = document.getElementById('camera-view');
const openCameraBtn = document.getElementById('open-camera');
const takePhotoBtn = document.getElementById('take-photo');
const plantList = document.getElementById('plant-list');
const searchInput = document.getElementById('search-input');

// Elementos del modal
const resCategory = document.getElementById('res-category');
const resName = document.getElementById('res-name');
const resScientific = document.getElementById('res-scientific');
const resDescription = document.getElementById('res-description');
const resImages = document.getElementById('res-images');

// Cargar datos
async function loadPlants() {
    try {
        const response = await fetch('plants.json');
        plantsData = await response.json();
        renderPlants(plantsData);
    } catch (error) {
        console.error("Error cargando el catálogo:", error);
    }
}

// Renderizar plantas
function renderPlants(plants) {
    plantList.innerHTML = '';
    plants.forEach(plant => {
        const card = document.createElement('div');
        card.className = 'plant-card';
        card.innerHTML = `
            <h3>${plant.common_name}</h3>
            <p>${plant.scientific_name}</p>
        `;
        card.addEventListener('click', () => showPlantDetails(plant));
        plantList.appendChild(card);
    });
}

function showPlantDetails(plant) {
    resCategory.textContent = plant.category;
    resName.textContent = plant.common_name;
    resScientific.textContent = plant.scientific_name;
    resDescription.textContent = plant.description || "Sin descripción disponible.";
    
    // Mostrar imágenes de la API
    if (plant.images && plant.images.length > 0) {
        resImages.innerHTML = plant.images.slice(0, 3).map(img => 
            `<img src="${img.url?.s || img}" alt="${plant.common_name}" loading="lazy">`
        ).join('');
    } else {
        resImages.innerHTML = '';
    }
    
    resultModal.style.display = 'block';
    setTimeout(() => resultModal.classList.add('active'), 10);
}

closeModalBtn.addEventListener('click', () => {
    resultModal.classList.remove('active');
    setTimeout(() => resultModal.style.display = 'none', 500);
});

// Buscador
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = plantsData.filter(plant => 
        plant.common_name.toLowerCase().includes(term) || 
        plant.scientific_name.toLowerCase().includes(term) ||
        plant.category.toLowerCase().includes(term)
    );
    renderPlants(filtered);
});

// Lógica de Cámara
openCameraBtn.addEventListener('click', async () => {
    try {
        // Intentar primero con la cámara trasera
        const constraints = { 
            video: { 
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }, 
            audio: false 
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        // Asegurar que el video se reproduzca en iOS/Android
        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        
        cameraView.style.display = 'block';
        
        video.play().catch(e => console.error("Error al reproducir video:", e));
        
    } catch (err) {
        console.error("Error cámara:", err);
        // Fallback: intentar cualquier cámara si falla la trasera específica
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            cameraView.style.display = 'block';
            video.play();
        } catch (err2) {
            alert("No se pudo acceder a la cámara. Por favor, asegúrate de dar permisos en tu navegador: " + err2.message);
        }
    }
});

closeCameraBtn.addEventListener('click', () => {
    closeCamera();
});

function closeCamera() {
    const stream = video.srcObject;
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
    }
    video.srcObject = null;
    cameraView.style.display = 'none';
}

takePhotoBtn.addEventListener('click', async () => {
    if (!plantNetApiKey) {
        alert('API key no configurada.');
        return;
    }

    // Capturar foto
    const canvas = document.createElement('canvas');
    // Usar dimensiones reales del video capturado
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir a blob
    canvas.toBlob(async (blob) => {
        if (!blob) {
            alert("Error al capturar la imagen.");
            return;
        }

        takePhotoBtn.style.opacity = '0.5';
        takePhotoBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        takePhotoBtn.style.pointerEvents = 'none';
        
        try {
            const formData = new FormData();
            formData.append('images', blob, 'plant.jpg');
            formData.append('organs', 'auto');
            
            const response = await fetch(
                `https://my-api.plantnet.org/v2/identify/all?lang=es&api-key=${plantNetApiKey}`,
                { method: 'POST', body: formData }
            );
            
            if (!response.ok) throw new Error('Error en la respuesta de la API');
            
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                const plant = {
                    common_name: result.species.commonNames?.[0] || result.species.scientificNameWithoutAuthor,
                    scientific_name: result.species.scientificNameWithoutAuthor,
                    category: result.species.family?.scientificNameWithoutAuthor || 'Planta identificada',
                    description: `Familia: ${result.species.family?.scientificNameWithoutAuthor || 'Desconocida'}. Confianza: ${Math.round(result.score * 100)}%`,
                    images: result.species?.images || []
                };
                showPlantDetails(plant);
            } else {
                alert('No se pudo identificar. Intenta con otra foto.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con Pl@ntNet. Revisa tu API Key y conexión.');
        } finally {
            closeCamera();
            takePhotoBtn.style.opacity = '1';
            takePhotoBtn.innerHTML = '<i class="fa-solid fa-circle" style="font-size: 1.5rem;"></i>';
            takePhotoBtn.style.pointerEvents = 'all';
        }
    }, 'image/jpeg', 0.8);
});

// Guardar API key
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyBtn = document.getElementById('save-api-key');

// Cargar API key guardada
const savedApiKey = localStorage.getItem('plantnet_api_key');
if (savedApiKey) {
    plantNetApiKey = savedApiKey;
    if (apiKeyInput) {
        apiKeyInput.value = savedApiKey;
        apiKeyInput.type = 'password';
        apiKeyInput.placeholder = 'API key guardada ✓';
    }
}

if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            plantNetApiKey = key;
            localStorage.setItem('plantnet_api_key', key);
            apiKeyInput.type = 'password';
            apiKeyInput.placeholder = 'API key guardada ✓';
            apiKeyInput.value = '';
            alert('API key guardada correctamente');
        }
    });
}

// Inicializar
loadPlants();
