document.getElementById('addToFolder').addEventListener('click', async () => {
    let Coords = await getFilearr();
    if (!Coords) return;
    let LineArr = CreateLineArray(Coords);
    let rectList = LineArrToRect(LineArr);
    drawRectangles(rectList);
});

function updateProgressBar(filesInArea, currentFile, totalAreas, areasDone) {
    const currentBar = document.getElementById('CurrentprogressBar');
    const statusText = document.getElementById('statusText');

    if (currentBar) {

        let progressPerArea = 100 / totalAreas;
        let currentAreaProgress = (currentFile / filesInArea) * progressPerArea;
        let totalPercent = Math.floor((areasDone * progressPerArea) + currentAreaProgress);

        currentBar.style.width = totalPercent + "%";
        currentBar.innerText = `Progreso Total: ${totalPercent}%`;
    }

    if (statusText && totalAreas > 1) {
        statusText.innerText = `Procesando zona ${areasDone + 1} de ${totalAreas}...`;
    }
}

function toggleprogressbar(show) {
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.style.display = show ? 'block' : 'none';
}

document.getElementById('test').addEventListener('click', async () => {
    let annolist = anno.getAnnotations();
    if (annolist.length == 0) return;

    let deleteMapData = document.getElementById('chk_Mapdata').checked;
    let deleteChunkData = document.getElementById('chk_Chunkdata').checked;
    let deleteZPopData = document.getElementById('chk_ZpopData').checked;
    let deleteApopData = document.getElementById('chk_Animals').checked;

    if (!deleteMapData && !deleteChunkData && !deleteZPopData && !deleteApopData) {
        alert("Selecciona al menos un tipo de archivo para borrar");
        return;
    }

    if (!confirm("¡ATENCIÓN! Se borrarán los archivos de la zona seleccionada. ¿Continuar?")) return;

    toggleprogressbar(true);
    let areasCleared = 0;
    let AreasToClear = annolist.length;

    for (let an of annolist) {
        let rectinfo = annoCoordToPZCoord(an.target.selector.value);
        
        const [rawX, rawY, rawW, rawH] = an.target.selector.value.replace("xywh=pixel:", "").split(",").map(Number);
        const offX = 600; 
        const offY = 900;
        let rectCal = {
            sx: Math.floor((rawX - offX + 10) / 300),
            sy: Math.floor((rawY - offY + 10) / 300)
        };

        let totalX = rectinfo.ex - rectinfo.sx + 1;
        let totalY = rectinfo.ey - rectinfo.sy + 1;
        let FilesToCheck = totalX * totalY;
        let filesChecked = 0;

        for (let i = rectinfo.sx; i <= rectinfo.ex; i++) {
            let xFolderHandle = null;
            if (deleteMapData) {
                try {
                    const mapRoot = await directory.getDirectoryHandle('map');
                    xFolderHandle = await mapRoot.getDirectoryHandle(i.toString());
                } catch (e) {}
            }

            for (let j = rectinfo.sy; j <= rectinfo.ey; j++) {
                filesChecked++;
                
                if (filesChecked % 10 === 0) {
                    updateProgressBar(FilesToCheck, filesChecked, AreasToClear, areasCleared);
                    await new Promise(r => setTimeout(r, 1));
                }

                if (deleteMapData) {
                    try {
                        if (xFolderHandle) await xFolderHandle.removeEntry(j.toString() + ".bin");
                    } catch (e) { }

                    let realI = rectCal.sx + (i - rectinfo.sx);
                    let realJ = rectCal.sy + (j - rectinfo.sy);
                    try {
                        const metaDir = await directory.getDirectoryHandle('metagrid');
                        await metaDir.removeEntry(`metacell_${realI}_${realJ}.bin`);
                    } catch (e) {}
                }

                let rI = rectCal.sx + (i - rectinfo.sx);
                let rJ = rectCal.sy + (j - rectinfo.sy);
                let suff = `${rI}_${rJ}.bin`;

                if (deleteApopData) try {
                    const d = await directory.getDirectoryHandle('apop');
                    await d.removeEntry(`apop_${suff}`);
                } catch (e) {}

                if (deleteChunkData) try {
                    const d = await directory.getDirectoryHandle('chunkdata');
                    await d.removeEntry(`chunkdata_${suff}`);
                } catch (e) {}

                if (deleteZPopData) try {
                    const d = await directory.getDirectoryHandle('zpop');
                    await d.removeEntry(`zpop_${suff}`);
                } catch (e) {}
            }

            if (deleteMapData && xFolderHandle) {
                try {
                    const mapRoot = await directory.getDirectoryHandle('map');
                    await mapRoot.removeEntry(i.toString(), { recursive: false });
                } catch (e) {}
            }
        }
        areasCleared++;
        updateProgressBar(FilesToCheck, filesChecked, AreasToClear, areasCleared);
    }

    viewer.clearOverlays();
    let Coords = await reloadFileArr();
    let LineArr = CreateLineArray(Coords);
    let rectList = LineArrToRect(LineArr);
    drawRectangles(rectList);

    toggleprogressbar(false);
    alert("Proceso de borrado finalizado con éxito.");
});

if (window.anno) {
    window.anno.clearAnnotations();
}
document.getElementById('overlay').style.display = 'none';