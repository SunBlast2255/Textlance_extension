function displayNote(){
    chrome.storage.local.get(["Count"]).then((result) => {
        if(result.Count == 0 || result.Count == undefined || result.Count == null){
            const container = document.getElementById("note-container");
            container.innerHTML = "";
            container.style.alignItems = "center";
            container.style.justifyContent = "center";

            document.getElementById("notes").innerHTML = "0";

            let span = document.createElement("span");
            span.innerHTML = "You have no notes";
            span.classList.add("no-notes-msg")
            container.appendChild(span);

            chrome.storage.local.set({"Count": "0" }, function(){});

        }else if(result.Count > 0 && result.Count != undefined && result.Count != null){
            const container = document.getElementById("note-container");
            container.innerHTML = "";

            let count;

            chrome.storage.local.get("Count", function(result) {
                count = result.Count;
                document.getElementById("notes").innerHTML = count;

                getAllNotes(function(notes) {
                        for (let noteId in notes) {
                            if (notes.hasOwnProperty(noteId) && noteId !== "Count" && noteId !== "Size" && noteId !== "wrapping" && noteId !== "existNoteId" && noteId !== "existNoteEdit") {
                                let div = document.createElement("div");
                                div.setAttribute("class", "note");
                                div.setAttribute("id", noteId);

                                let span = document.createElement("span");
                                span.innerHTML = escapeHTML(notes[noteId]);
                                div.appendChild(span);

                                let icons = document.createElement("div");
                                icons.setAttribute("class", "icon-block flex center");
                                div.appendChild(icons);

                                let delIcon = document.createElement("img");
                                delIcon.src = "../images/delete.png";
                                delIcon.setAttribute("class", "icon-small");
                                delIcon.title = "Delete";
                                delIcon.alt = "Del";
                                icons.appendChild(delIcon);
                                delIcon.addEventListener("click", function(e) {
                                    let id = e.target.parentNode.parentNode.id;
                                    chrome.storage.local.remove(id, function(){
                                        chrome.storage.local.get("Count", function(result) {
                                            let count = result.Count - 1;
                                            chrome.storage.local.set({"Count": count}, function(){
                                                displayNote();
                                            });
                                        });
                                    });
                                });

                                let editIcon = document.createElement("img");
                                editIcon.src = "../images/edit.png";
                                editIcon.setAttribute("class", "icon-small");
                                editIcon.title = "Edit";
                                editIcon.alt = "Edit";
                                icons.appendChild(editIcon);
                                editIcon.addEventListener("click", function(e) {
                                    let id = e.target.parentNode.parentNode.id;
                                    chrome.storage.local.set({"existNoteEdit": true, "existNoteId": id}, function(){});
                                    openEditor(id);
                                });

                                let viewIcon = document.createElement("img");
                                viewIcon.src = "../images/view.png";
                                viewIcon.setAttribute("class", "icon-small");
                                viewIcon.title = "View";
                                viewIcon.alt = "View";
                                icons.appendChild(viewIcon);
                                viewIcon.addEventListener("click", function(e) {
                                    let id = e.target.parentNode.parentNode.id;

                                    document.getElementById("viewer-window").style.display = "flex";
                                    chrome.storage.local.get(id, function(result) {
                                        document.getElementById("textarea-readonly").value = result[id];
                                    });
                            
                                    document.getElementById("header").style.display = "none";
                                    document.getElementById("main").style.display = "none"; 
                                });


                                document.getElementById("note-container").appendChild(div);
                            }
                        }
                });    
            });

        }
    });
}

function getAllNotes(callback){
    chrome.storage.local.get(null, function(result) {
        callback(result);
    });
}

//Text

function copyAll(textareaID){
    navigator.clipboard.writeText(document.getElementById(textareaID).value);
}

function copySelected(textareaID){
    var txtarea = document.getElementById(textareaID);
    var start = txtarea.selectionStart;
    var finish = txtarea.selectionEnd;
    var selected = txtarea.value.substring(start, finish);

    navigator.clipboard.writeText(selected);
}

async function pasteText(textareaID){
    try {
        let clipboardText = await navigator.clipboard.readText();
        
        let textarea = document.getElementById(textareaID);
        let start = textarea.selectionStart;
        let end = textarea.selectionEnd;

        let currentValue = textarea.value;

        textarea.value = currentValue.slice(0, start) + clipboardText + currentValue.slice(end);
        
        let newPosition = start + clipboardText.length;
        textarea.setSelectionRange(newPosition, newPosition);
    } catch (err) {}
}

async function cutText(textareaID){
    try {
        let textarea = document.getElementById(textareaID);
        let start = textarea.selectionStart;
        let end = textarea.selectionEnd;
        let cutText = textarea.value.slice(start, end);

        await navigator.clipboard.writeText(cutText);
        textarea.value = textarea.value.slice(0, start) + textarea.value.slice(end);
        textarea.selectionStart = textarea.selectionEnd = start;
    } catch (err) {}
}

function selectAll(){
    document.getElementById("textarea").select();
}

window.onload = function() {
    displayNote();
    
    chrome.storage.local.get(["Size", "wrapping"], function(result) {
        if(!result.Size || result.wrapping == undefined || result.wrapping == null){
            chrome.storage.local.set({"Size": "16" }, function(){});
            chrome.storage.local.set({"wrapping": "off" }, function(){});
            fontSize = 16;
            wrapping = "off";
        }else if(result.Size && result.wrapping){
            fontSize = result.Size;
            wrapping = result.wrapping;
        }

        document.querySelectorAll("textarea").forEach((textarea) => {
            textarea.style.fontSize = `${fontSize}px`;
            textarea.setAttribute("wrap", wrapping);
        });

    });

    chrome.storage.local.set({"existNoteId": "", "existNoteEdit": false}, function(){});
}

//Main panel

document.getElementById("add-btn").addEventListener("click", function(){
    openEditor();
});

document.getElementById("del-all").addEventListener("click", function(){
    chrome.storage.local.clear(function(){
        displayNote();
    });
});

document.getElementById("exit-btn").addEventListener("click", function(){
    window.close();
});

//Settings

document.getElementById("settings-btn").addEventListener("click", function(){
    chrome.storage.local.get(["Size", "wrapping"], function(result){
        document.getElementById("font-size").value = parseInt(result.Size);
        document.getElementById("wrapping").checked = result.wrapping === "on";
        document.getElementById("settings-window").style.display = "flex";
    
        document.getElementById("header").style.display = "none";
        document.getElementById("main").style.display = "none";
    });
});

document.getElementById("apply-btn").addEventListener("click", function(){
    let fontSize = parseInt(document.getElementById("font-size").value);
    let wrapping = document.getElementById("wrapping").checked ? "on" : "off";

    chrome.storage.local.set({"Size": fontSize, "wrapping": wrapping}, function(){
        document.querySelectorAll("textarea").forEach((textarea) => {
            textarea.style.fontSize = `${fontSize}px`;
            textarea.setAttribute("wrap", wrapping);
        });
    
        document.getElementById("settings-window").style.display = "none";

        document.getElementById("header").style.display = "flex";
        document.getElementById("main").style.display = "flex";
    });
});

document.getElementById("reset-settings").addEventListener("click", function(){
    document.getElementById("font-size").value = 16;
    document.getElementById("wrapping").checked = false;
});

//Editor panel

function openEditor(id){

    document.getElementById("editor-window").style.display = "flex";
    
    if(id){
        chrome.storage.local.get(id, function(result) {
            document.getElementById("textarea").value = result[id];
            getCursorPosition("textarea", "ln-editor", "col-editor");
        });
    }else{
        document.getElementById("textarea").value = "";
    }

    document.getElementById("header").style.display = "none";
    document.getElementById("main").style.display = "none";
}

function closeEditor(){
    document.getElementById("textarea").value = "";
    resetCursorPositions("ln-editor", "col-editor");
    document.getElementById("editor-window").style.display = "none";

    chrome.storage.local.set({"existNoteId": "", "existNoteEdit": false}, function(){});

    document.getElementById("header").style.display = "flex";
    document.getElementById("main").style.display = "flex";
}

document.getElementById("exit-editor-btn").addEventListener("click", function(){
    closeEditor();
});

document.getElementById("save-btn").addEventListener("click", function(){
    let text = document.getElementById("textarea").value;

    if(text === ""){
        return;
    }

    chrome.storage.local.get(["existNoteId", "existNoteEdit"], function(result){
        let existNoteEdit = result.existNoteEdit;
        let existNoteId = result.existNoteId;

        if(existNoteEdit == false){
            let date = new Date();
    
            let text = document.getElementById("textarea").value;
    
            let noteId = `${date.getDate()}${date.getMonth() + 1}${date.getFullYear()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;
    
            let note = {};
            note[noteId] = text;
    
            chrome.storage.local.set(note, function(){
                chrome.storage.local.get("Count", function(result) {
                    let count = parseInt(result.Count) + 1;
                    chrome.storage.local.set({"Count": count}, function(){
                        displayNote();
                    });
                });
            });
        }else if(existNoteEdit == true){

            let text = document.getElementById("textarea").value;
            let noteId = existNoteId;
    
            let note = {};
            note[noteId] = text;
    
            chrome.storage.local.set(note, function(){
                displayNote();
                chrome.storage.local.set({"existNoteEdit": false, "existNoteId": ""}, function(){});
            });
        }
    
        closeEditor();

    });
});

function escapeHTML(str) {
    return str.replace(/[&<>"'`]/g, function(match) {
      const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '`': '&#96;'
      };
      return escapeMap[match];
    });
  }

//Listeners
document.getElementById("copy-btn-editor").addEventListener("click", function(){
    copySelected("textarea")
});

document.getElementById("paste-btn-editor").addEventListener("click", function(){
    pasteText("textarea");
});

document.getElementById("cut-btn-editor").addEventListener("click", function(){
    cutText("textarea");
});

document.getElementById("select-btn-editor").addEventListener("click", function(){
    selectAll();
});

//Viewer panel

document.getElementById("exit-viewer-btn").addEventListener("click", function(){
    document.getElementById("viewer-window").style.display = "none";
    document.getElementById("textarea-readonly").value = "";

    document.getElementById("header").style.display = "flex";
    document.getElementById("main").style.display = "flex";
});

document.getElementById("copy-viewer-text").addEventListener("click", function(){
    copyAll("textarea-readonly");
});

document.getElementById("copy-selected-viewer-text").addEventListener("click", function(){
    copySelected("textarea-readonly");
});

//Context

window.oncontextmenu = function(){
    return false;
}

function openContextMenu(textareaID, contextID, e){
    e.preventDefault();

    let context = document.getElementById(contextID);
    context.style.display = "flex";
    
    let clickX = e.pageX + 15;
    let clickY = e.pageY + 15;

    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;

    let menuWidth = context.offsetWidth;
    let menuHeight = context.offsetHeight;

    if ((clickX + menuWidth) > windowWidth) {
        context.style.left = (windowWidth - menuWidth) + "px";
    } else {
        context.style.left = clickX + "px";
    }

    if ((clickY + menuHeight) > windowHeight) {
        context.style.top = (windowHeight - menuHeight) + "px";
    } else {
        context.style.top = clickY + "px";
    }

    document.getElementById(textareaID).style.cursor = "default"
}

document.getElementById("textarea").oncontextmenu = function (e) {
    openContextMenu("textarea", "context", e)
};

document.getElementById("textarea-readonly").oncontextmenu = function (e) {
    openContextMenu("textarea-readonly", "context-viewer", e)
};

window.onclick = function () {
    document.getElementById("context").style.display = "none";
    document.getElementById("textarea").style.cursor = "auto"

    document.getElementById("context-viewer").style.display = "none";
    document.getElementById("textarea-readonly").style.cursor = "auto"
};

document.getElementById("copy-context").addEventListener("click", function() {
    copySelected("textarea");
});

document.getElementById("paste-context").addEventListener("click", async function() {
    pasteText("textarea");
});

document.getElementById("cut-context").addEventListener("click", async function() {
    cutText("textarea");
});

document.getElementById("select-context").addEventListener("click", function() {
    selectAll();
});

document.getElementById("copy-all-context").addEventListener("click",  function() {
    copyAll("textarea-readonly");
});

document.getElementById("copy-selected-context").addEventListener("click", function() {
    copySelected("textarea-readonly");
});

//Cursor position

function getCursorPosition(textareaID, lnID, colID) {
    const textarea = document.getElementById(textareaID);
    const lnSpan = document.getElementById(lnID);
    const colSpan = document.getElementById(colID);

    const position = textarea.selectionStart;
    const textBeforeCursor = textarea.value.slice(0, position);

    const lines = textBeforeCursor.split('\n');
    const row = lines.length;
    const col = position - textBeforeCursor.lastIndexOf('\n');

    lnSpan.textContent = row;
    colSpan.textContent = col;
}

function resetCursorPositions(lnID, colID) {
    document.getElementById(lnID).textContent = "1";
    document.getElementById(colID).textContent = "0";
}

document.getElementById("textarea").addEventListener("click", function() {
    getCursorPosition("textarea", "ln-editor", "col-editor");
});

document.getElementById("textarea").addEventListener("input", function() {
    getCursorPosition("textarea", "ln-editor", "col-editor");
});

document.getElementById("textarea").addEventListener("keydown", function(e) {
    if (e.key == "ArrowUp" || e.key == "ArrowDown" || e.key == "ArrowLeft" || e.key == "ArrowRight") {
        setTimeout(function() {
            getCursorPosition("textarea", "ln-editor", "col-editor");
        }, 0);
    }
});
