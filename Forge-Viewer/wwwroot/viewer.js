/// import * as Autodesk from "@types/forge-viewer";

async function getAccessToken(callback) {
    try {
        const resp = await fetch('/api/auth/token');
        if (!resp.ok) {
            throw new Error(await resp.text());
        }
        const { access_token, expires_in } = await resp.json();
        callback(access_token, expires_in);
    } catch (err) {
        alert('Could not obtain access token. See the console for more details.');
        console.error(err);
    }
}

//Coloring
export function colorElement(viewer, dbId, hexColor) {
    // Convert HEX to RGB (0-1 range)
    const color = hexToRgbNormalized(hexColor);
    
    // Apply color to the element
    viewer.setThemingColor(dbId, color, viewer.model);
    
    // Optional: Force viewer refresh
    viewer.impl.invalidate(true);
}

function hexToRgbNormalized(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // Parse hex to RGB (0-255)
    const num = parseInt(hex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    
    // Normalize to 0-1 range (required by Forge Viewer)
    return {
        r: r / 255,
        g: g / 255,
        b: b / 255
    };
}

export function initViewer(container) {
    return new Promise(function (resolve, reject) {
        Autodesk.Viewing.Initializer({ env: 'AutodeskProduction', getAccessToken }, function () {
            const config = {
                extensions: ['Autodesk.DocumentBrowser']
            };
            const viewer = new Autodesk.Viewing.GuiViewer3D(container, config);
            viewer.start();
            viewer.setTheme('light-theme');
            resolve(viewer);
        });
    });
}

export function loadModel(viewer, urn) {
    return new Promise(function (resolve, reject) {
        function onDocumentLoadSuccess(doc) {
            // Add selection handler
            viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, (e) => {
                console.log('Selected dbIds:', e.dbIdArray);
            });
            resolve(viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry()));
        }
        function onDocumentLoadFailure(code, message, errors) {
            reject({ code, message, errors });
        }
        viewer.setLightPreset(0);
        Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
    });
}
