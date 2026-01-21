var viewer = OpenSeadragon({
    id: "openseadragon1",
    prefixUrl: "openseadragon/images/",
    tileSources: [
        {
            width: 15000,
            height: 13500,
            tileSize: 512,
            getTileUrl: function(level, x, y) { return "map.png"; }
        },
        {
            type: 'image',
            url: 'mapa_b42.jpg',
            buildPyramid: false
        },
        {
            type: 'image',
            url: 'grid_transparente.png',
            buildPyramid: false
        }
    ],
    maxZoomLevel: 10,
    showNavigator: true
});

viewer.addHandler('open', function () {
    var positionEl = document.getElementById('coords-display');
    var officialLayer = viewer.world.getItemAt(0); 
    var backgroundMap = viewer.world.getItemAt(1); 
    var gridLayer = viewer.world.getItemAt(2);

    if (backgroundMap && officialLayer && gridLayer) {
        var zoomWidth = 1.56;
        var mapPos = new OpenSeadragon.Point(0.05, 0.052);

        backgroundMap.setWidth(zoomWidth); 
        backgroundMap.setPosition(mapPos, true); 
        gridLayer.setWidth(zoomWidth);
        gridLayer.setPosition(mapPos, true);

        var gridCheckbox = document.getElementById('chk_ShowGrid');
        if (gridCheckbox) {
            gridLayer.setOpacity(gridCheckbox.checked ? 1.0 : 0.0);
            gridCheckbox.addEventListener('change', function() {
                gridLayer.setOpacity(this.checked ? 1.0 : 0.0);
            });
        }
    }

    window.officialLayer = officialLayer;

    var anno = OpenSeadragon.Annotorious(viewer, {
        allowEmpty: true,
        disableEditor: true,
        drawOnSingleClick: true
    });

    window.anno = anno;

new OpenSeadragon.MouseTracker({
        element: viewer.container,
        stopDelay: 0,
        moveHandler: function (event) {
            if (!officialLayer || !positionEl || !event.position) return;

            try {
                var viewportPoint = viewer.viewport.pointFromPixel(event.position);
                var imagePoint = officialLayer.viewportToImageCoordinates(viewportPoint);

                var correctedX = Math.floor(imagePoint.x - 2647);
                var correctedY = Math.floor(imagePoint.y - 2804);

                var cellX = Math.floor((imagePoint.x - 600) / 300) - 1;
                var cellY = Math.floor((imagePoint.y - 900) / 300);

                positionEl.innerHTML = `Location: ${correctedX}, ${correctedY} | <span class="text-warning">Cell: ${cellX}, ${cellY}</span>`;
                
            } catch (e) {
            }
        }
    });
});