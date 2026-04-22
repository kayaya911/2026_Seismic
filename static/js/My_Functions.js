// await is a keyword in JavaScript that pauses execution of an async function until a Promise is settled

//-----------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------
// stricter parsing and error handling
"use strict";

// Declaration of global variable
let ChannelList        = [];
let PageNo             = 0;
let MaxPlotly_Graphs   = 8;  // This variable should not be less than 8
let Current_Plotly_Num = 0;

//-----------------------------------------------------------------------------------------------
function OnLoad() {

    initResizablePanels();
    initHorizontalResizer();
    initHamburgerMenu();
    Right_Click_ALL();

    // Hide the AnalysisMenu at start-up
    document.getElementById("Analysis_Menu").style.display = "none";
    
    // Close the Analysis_Menu on mouse-clicks anywhere outside of the Analysis_Menu
    document.body.addEventListener("click", (event) => { 
        const menu = document.getElementById("Analysis_Menu");
        const menuButton = document.getElementById("Main_Menu_Button");
        
        // Don't close if clicking the menu button or inside the menu
        if (!menuButton.contains(event.target) && !menu.contains(event.target)) {
            menu.style.display = "none";
        }
    });


    // Add event listener to the button to upload vibration-files
    document.getElementById('LoadInputFiles').addEventListener('change', function(e) {

        // Loads user-selected files for analysis
        Load_Files(e); 

        // Upon successful loading of all user-selected files, return to the Load_Data page
        AnalysisMenu_Selection(document.getElementById("MainMenu_LoadData")); 
    });

    // Set Initial Parameters
    Filter_Name_Change();
    Filter_Type_Change();
    SDOF_AnalysisType();
    ResSpec_AnalysisType();
    SM_Par_AnalysisType();

    // Load_Data item from Analysis_Menu is selected 
    AnalysisMenu_Selection(document.getElementById("MainMenu_LoadData"));

}
//-----------------------------------------------------------------------------------------------
function IsElementExists(id) {
    // Return true is an element with id exists
    return document.getElementById(id) !== null;
}
//-----------------------------------------------------------------------------------------------
function ShowHide_AnalysisMenu() {
    // Decleration of variables 
    var x = document.getElementById("Analysis_Menu");
    
    // Close hamburger menu if it's open
    const hamburger = document.getElementById('hamburgerToggle');
    const mobileMenu = document.querySelector('.Header_Buttons');
    if (hamburger && mobileMenu && mobileMenu.classList.contains('mobile-menu-open')) {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('mobile-menu-open');
    }
    
    // Show or hide Analysis Menu
    if (x.style.display === "none") { 
        x.style.display = "flex"; 
    } else {
        x.style.display = "none"; 
    }
}
//-----------------------------------------------------------------------------------------------
async function AnalysisMenu_Selection(a) {

    // First, hide ALL parameter sections
    document.getElementById("Table_Channel_Div").style.display = "none";
    document.getElementById("Parameters_Filter").style.display = "none";
    document.getElementById("Parameters_Integration").style.display = "none";
    document.getElementById("Parameters_SDOF").style.display = "none";
    document.getElementById("Parameters_ResSpec").style.display = "none";
    document.getElementById("Parameters_ResSpec2").style.display = "none";
    document.getElementById("Parameters_SM_Par").style.display = "none";
    document.getElementById("Parameters_Newmark").style.display = "none";
    document.getElementById("Parameters_Output_Units").style.display = "none";

    // Run_Button on Header
    document.getElementById('Run_Button_Div').style.display = 'flex';
    document.getElementById("Run_Button_SVG").setAttribute('fill', 'green');

    // Then show only the relevant ones based on selection
    if (a.id == "MainMenu_LoadData") {
        // Load Data
        document.getElementById('Run_Button_Div').style.display = 'none';
        document.getElementById("Table_Channel_Div").style.display = "flex";
        document.getElementById("Logo_Text").innerHTML = "Seismic Data Analysis  -  Data";
        PageNo = 0;
    }
    else if (a.id == "MainMenu_Filter") {
        // Filter 
        document.getElementById("Parameters_Filter").style.display = "flex";
        document.getElementById("Logo_Text").innerHTML = "Seismic Data Analysis  -  Filter";
        PageNo = 1;
    }
    else if (a.id == "MainMenu_Integral") {
        // Integration
        document.getElementById("Parameters_Filter").style.display = "flex";
        document.getElementById("Parameters_Integration").style.display = "flex";
        document.getElementById("Logo_Text").innerHTML = "Seismic Data Analysis  -  Integral";
        PageNo = 2;
    }
    else if (a.id == "MainMenu_SDOF") {
        // SDOF
        document.getElementById("Parameters_Filter").style.display = "flex";
        document.getElementById("Parameters_SDOF").style.display   = "flex";
        document.getElementById("Logo_Text").innerHTML = "Seismic Data Analysis  -  SDOF";
        // Get the index number of the SDOF_Analysis
        let Indx = document.getElementById('SDOF_Analysis').selectedIndex;
        if (Indx == 0 || Indx == 1) { document.getElementById("Parameters_Filter").style.display = "none"; } // Disable Filter Window 
        else                        { document.getElementById("Parameters_Filter").style.display = "flex"; } // Enable Filter Window 

        PageNo = 3;
    }
    else if (a.id == "MainMenu_ResSpec") {
        // Response Spectrum
        document.getElementById("Parameters_Filter").style.display = "flex";
        document.getElementById("Parameters_ResSpec").style.display = "flex";
        document.getElementById("Parameters_ResSpec2").style.display = "flex";
        document.getElementById("Logo_Text").innerHTML = "Seismic Data Analysis  -  Response Spec";
        
        PageNo = 4;
    }
    else if (a.id == "MainMenu_Spectrum") {
        // Spectrum
        document.getElementById("Parameters_Filter").style.display = "flex";
        document.getElementById("Logo_Text").innerHTML = "Seismic Data Analysis  -  Spectrum";
        
        PageNo = 5;
    }
    else if (a.id == "MainMenu_SM_Parameters") {
        // SM Parameters
        document.getElementById("Parameters_Filter").style.display = "flex";
        document.getElementById("Parameters_SM_Par").style.display = "flex";
        document.getElementById("Logo_Text").innerHTML = "Seismic Data Analysis  -  SM Paremeters";
        
        PageNo = 6;
    }
    else if ((a.id == "MainMenu_Settings") || (a.id == "Header_Settings")) {
        document.getElementById("Parameters_Newmark").style.display = "flex";
        document.getElementById("Parameters_Output_Units").style.display = "flex";
    }

    // Hide the Analysis_Menu on the screen
    document.getElementById("Analysis_Menu").style.display = "none";
    
    // Update UI (Screen)
    for (let i=0; i<ChannelList.length; i++) { await Plotly_Graph_Update(i); }
}
//-----------------------------------------------------------------------------------------------
async function Anlysis_Button() {
    if       (PageNo == 0) {                                    } // Load Data Page 
    else if ( PageNo == 1) { await Channel_Filter();            } // Filtering Page
    else if ( PageNo == 2) { await Channel_Integral();          } // Integral Page
    else if ( PageNo == 3) { await Channel_SDOF();              } // SDOF Page
    else if ( PageNo == 4) { await Channel_ResponseSpectrum();  } // Response Spectrum Page
    else if ( PageNo == 5) { await Channel_Spectrum();          } // Spectrum Page
    else if ( PageNo == 6) { await Channel_Parameters();        } // Strong Motion Parameters
}
//-----------------------------------------------------------------------------------------------
function Channel_Click(checkbox) {

    // Decleration of variables 
    let cbID, Indx, status, svg_element

    // ID of the checkbox
    cbID = checkbox.id;

    // status of the checkbox
    status = document.getElementById(cbID).checked;

    // Remove the prefix from checkbox to find the UniqueID of the ChannelList
    cbID = cbID.replace('FileTreeView_Checkbox_','');

    // Find the index of the cbID
    Indx = ChannelList_UniqueID(cbID);

    // Change the Selected attribute of the channel
    ChannelList[Indx].Selected = status;

    // Chage the File-icon on TreeView if needed
    TreeView_File_SVG_Change(Indx);

}
//-----------------------------------------------------------------------------------------------
function TreeView_File_SVG_Change(Indx) {

    // Decleration of variables 
    let svg_element

    // Get the svg-element 
    svg_element = document.getElementById( 'FileTreeView_SVG_' + ChannelList[Indx].TableName );

    // Change the file-icon
    if (Is_A_Channel_InTable_Selected(ChannelList[Indx].TableName)) {
        // File-icon OPEN
        svg_element.querySelector('path').setAttribute('d', 'M 3 4 C 1.355469 4 0 5.355469 0 7 L 0 43.90625 C -0.0625 44.136719 -0.0390625 44.378906 0.0625 44.59375 C 0.34375 45.957031 1.5625 47 3 47 L 42 47 C 43.492188 47 44.71875 45.875 44.9375 44.4375 C 44.945313 44.375 44.964844 44.3125 44.96875 44.25 C 44.96875 44.230469 44.96875 44.207031 44.96875 44.1875 L 45 44.03125 C 45 44.019531 45 44.011719 45 44 L 49.96875 17.1875 L 50 17.09375 L 50 17 C 50 15.355469 48.644531 14 47 14 L 47 11 C 47 9.355469 45.644531 8 44 8 L 18.03125 8 C 18.035156 8.003906 18.023438 8 18 8 C 17.96875 7.976563 17.878906 7.902344 17.71875 7.71875 C 17.472656 7.4375 17.1875 6.96875 16.875 6.46875 C 16.5625 5.96875 16.226563 5.4375 15.8125 4.96875 C 15.398438 4.5 14.820313 4 14 4 Z M 3 6 L 14 6 C 13.9375 6 14.066406 6 14.3125 6.28125 C 14.558594 6.5625 14.84375 7.03125 15.15625 7.53125 C 15.46875 8.03125 15.8125 8.5625 16.21875 9.03125 C 16.625 9.5 17.179688 10 18 10 L 44 10 C 44.5625 10 45 10.4375 45 11 L 45 14 L 8 14 C 6.425781 14 5.171875 15.265625 5.0625 16.8125 L 5.03125 16.8125 L 5 17 L 2 33.1875 L 2 7 C 2 6.4375 2.4375 6 3 6 Z M 8 16 L 47 16 C 47.5625 16 48 16.4375 48 17 L 43.09375 43.53125 L 43.0625 43.59375 C 43.050781 43.632813 43.039063 43.675781 43.03125 43.71875 C 43.019531 43.757813 43.007813 43.800781 43 43.84375 C 43 43.863281 43 43.886719 43 43.90625 C 43 43.917969 43 43.925781 43 43.9375 C 42.984375 43.988281 42.976563 44.039063 42.96875 44.09375 C 42.964844 44.125 42.972656 44.15625 42.96875 44.1875 C 42.964844 44.230469 42.964844 44.269531 42.96875 44.3125 C 42.84375 44.71875 42.457031 45 42 45 L 3 45 C 2.4375 45 2 44.5625 2 44 L 6.96875 17.1875 L 7 17.09375 L 7 17 C 7 16.4375 7.4375 16 8 16 Z');
        svg_element.setAttribute('user-data', 'OPEN');

    } else {
        // File-icon CLOSE
        svg_element.querySelector('path').setAttribute('d', 'M 5 4 C 3.346 4 2 5.346 2 7 L 2 13 L 3 13 L 47 13 L 48 13 L 48 11 C 48 9.346 46.654 8 45 8 L 18.044922 8.0058594 C 17.765922 7.9048594 17.188906 6.9861875 16.878906 6.4921875 C 16.111906 5.2681875 15.317 4 14 4 L 5 4 z M 3 15 C 2.448 15 2 15.448 2 16 L 2 43 C 2 44.657 3.343 46 5 46 L 45 46 C 46.657 46 48 44.657 48 43 L 48 16 C 48 15.448 47.552 15 47 15 L 3 15 z');
        svg_element.setAttribute('user-data', 'CLOSE');
    }

}
//-----------------------------------------------------------------------------------------------
function Is_A_Channel_InTable_Selected(Table_Id) {
    // Returns TRUE if, at least, one channel in Table_Id is selected.

    // Decleration of variables 
    let Indx, i, status

    // Get a list of all Channel Indexes involving Table_Id
    Indx =  ChannelList_TabelID(Table_Id); 

    // Go through all checkbox elements
    for (i=0; i < Indx.length; i++) {

        // Checkbox element in the FileTreeView
        status = document.getElementById('FileTreeView_Checkbox_' + ChannelList[Indx[i]].Unique_ID).checked;

        if (status) { return true; }
    }
    return false;
}
//-----------------------------------------------------------------------------------------------
function FileTreeView_Select_Unselect_Channels(svg_element) {

    // user clicked on File icon
    // this function will check/uncheck the related channels for analysis 
    // It also change the Selected status of the related channels
    
    // Decleration of variables 
    let Table_Id, i, Indx, ce, Open_Status

    // Get the Channel.TableName
    Table_Id = svg_element.id.replace('FileTreeView_SVG_','');

    // Get a list of all Channel Indexes involving Table_Id
    Indx =  ChannelList_TabelID(Table_Id); 

    // Check if the status of the file-icon is OPEN or CLOSE
    Open_Status = svg_element.getAttribute('user-data').toUpperCase();

    // Go through all checkbox elements
    for (i=0; i < Indx.length; i++) {

        // Checkbox element in the FileTreeView
        ce = document.getElementById('FileTreeView_Checkbox_' + ChannelList[Indx[i]].Unique_ID);

        // change the status of each checkbox
        if (Open_Status === 'OPEN') {  
            // uncheck it 
            ce.checked = false;
            Channel_Click(ce);
        } 
        else {  
            // check it 
            ce.checked = true;
            Channel_Click(ce);
        }
    }
}
//-----------------------------------------------------------------------------------------------
function FileTreeView_CollapseFile(a) {
    let Table_Id, fileListTree, liElements, newID

    // user clicked either on FileName or Arrow icon
    // this function will show/hide the related channels in the FileTreeView

    if (a.id.includes('FileTreeView_Arrow_')) {

        Table_Id = a.id.replace('FileTreeView_Arrow_','');
        newID    = document.getElementById(a.id);
    }
    else if (a.id.includes('FileTreeView_FileLabel_')) {

        Table_Id = a.id.replace('FileTreeView_FileLabel_','');
        newID    = document.getElementById( 'FileTreeView_Arrow_' + Table_Id );
    }

    // Change the orientation of arrow 
    if (newID.textContent === '⮞') { newID.textContent = '⮟'; } else {newID.textContent = '⮞'; } 

    fileListTree = document.getElementById('FileListTree');
    liElements   = fileListTree.querySelectorAll(`li[id*="${Table_Id}"]`);

    // go through all list elements
    liElements.forEach(element => {

        if (element.classList.contains('FileListTree_Channel_li')) {
            
            element.classList.remove('FileListTree_Channel_li');
            element.classList.add('FileListTree_Channel_li_hide');

        } else if (element.classList.contains('FileListTree_Channel_li_hide')) {
            
            element.classList.remove('FileListTree_Channel_li_hide');
            element.classList.add('FileListTree_Channel_li');
            
        }
    });
}
//-----------------------------------------------------------------------------------------------
function initResizablePanels() {
    
    // Functions for the Resizable-Container - must be run on startup

    const resizeHandle = document.getElementById('resizeHandle');
    const panel1 = document.getElementById('panel1');
    const panel2 = document.getElementById('panel2');
    const wrapper = document.querySelector('.resizable-panels-wrapper');
    
    // Get minimum heights from CSS variables
    const MIN_HEIGHT1 = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--min-panel1-height')) || 0;
    const MIN_HEIGHT2 = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--min-panel2-height')) || 0;
    
    let isResizing = false;
    let startY = 0;
    let startHeight1 = 0;
    let startHeight2 = 0;
    let savedPanel2Height = null; // Store panel2's height
    
    // Initialize panels with equal heights on first load only
    function initializePanels() {
        const wrapperHeight = wrapper.clientHeight;
        const handleHeight = resizeHandle.offsetHeight;
        const availableHeight = wrapperHeight - handleHeight;
        
        // If panel2 hasn't been set yet, use equal distribution
        if (savedPanel2Height === null) {
            const panelHeight = availableHeight / 2;
            panel1.style.height = `${panelHeight}px`;
            panel2.style.height = `${panelHeight}px`;
            savedPanel2Height = panelHeight;
        } else {
            // Preserve panel2's height and adjust panel1
            const adjustedPanel2Height = Math.max(MIN_HEIGHT2, Math.min(savedPanel2Height, availableHeight - MIN_HEIGHT1));
            panel2.style.height = `${adjustedPanel2Height}px`;
            panel1.style.height = `${availableHeight - adjustedPanel2Height}px`;
        }
    }
    
    // Start resizing
    function startResize(e) {
        isResizing = true;
        startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
        startHeight1 = panel1.offsetHeight;
        startHeight2 = panel2.offsetHeight;
        
        document.body.style.cursor = 'ns-resize';
        e.preventDefault();
    }
    
    // During resize
    function doResize(e) {
        if (!isResizing) return;
        
        const currentY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
        const delta = currentY - startY;
        
        const newHeight1 = startHeight1 + delta;
        const newHeight2 = startHeight2 - delta;
        
        // Check if both panels meet their individual minimum height requirements
        if (newHeight1 >= MIN_HEIGHT1 && newHeight2 >= MIN_HEIGHT2) {
            panel1.style.height = `${newHeight1}px`;
            panel2.style.height = `${newHeight2}px`;
            savedPanel2Height = newHeight2; // Save the new height
        }
        
        e.preventDefault();
    }
    
    // Stop resizing
    function stopResize() {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
        }
    }
    
    // Event listeners for mouse
    resizeHandle.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
    
    // Event listeners for touch devices
    resizeHandle.addEventListener('touchstart', startResize);
    document.addEventListener('touchmove', doResize, { passive: false });
    document.addEventListener('touchend', stopResize);
    
    // Handle window resize - preserve panel2 height
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(initializePanels, 100);
    });

    // Initialize on load
    initializePanels();
}
//-----------------------------------------------------------------------------------------------
function initHorizontalResizer() {
    const resizeHandle = document.getElementById('resizeHandleHorizontal');
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    const MIN_WIDTH = 0;

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    let resizeTimeout = null;

    // Start resizing
    function startResize(e) {
        isResizing = true;
        startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        startWidth = sidebar.offsetWidth;
        document.body.style.cursor = 'ew-resize';
        e.preventDefault();
    }

    // During resize
    function doResize(e) {
        if (!isResizing) return;
        const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const delta = currentX - startX;
        let newWidth = startWidth + delta;
        if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
        sidebar.style.width = `${newWidth}px`;
        
        // Debounce Plotly resize updates during drag
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updatePlotlyGraphs, 50);
        
        e.preventDefault();
    }

    // Stop resizing
    function stopResize() {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            
            // Final update after resize stops
            clearTimeout(resizeTimeout);
            updatePlotlyGraphs();
        }
    }

    // Update all Plotly graphs
    function updatePlotlyGraphs() {
        // Get all Plotly graph divs in panel2
        const panel2 = document.getElementById('panel2');
        if (!panel2) return;
        
        const plotlyDivs = panel2.querySelectorAll('.Plotly_Div');
        
        plotlyDivs.forEach(plotDiv => {
            if (plotDiv && plotDiv.data) {
                // Use Plotly.Plots.resize for efficient responsive updates
                Plotly.Plots.resize(plotDiv);
            }
        });
    }

    // Handle window resize to reset sidebar on mobile
    function handleWindowResize() {
        if (window.innerWidth <= 768) {
            // Remove inline width style on mobile screens
            sidebar.style.width = '';
        }
        
        // Update Plotly graphs on window resize too
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updatePlotlyGraphs, 100);
    }

    // Event listeners for mouse
    resizeHandle.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);

    // Event listeners for touch
    resizeHandle.addEventListener('touchstart', startResize);
    document.addEventListener('touchmove', doResize, { passive: false });
    document.addEventListener('touchend', stopResize);

    // Listen for window resize
    window.addEventListener('resize', handleWindowResize);
    
    // Check on initial load
    handleWindowResize();
}
//-----------------------------------------------------------------------------------------------
function initHamburgerMenu() {
    // Hamburger menu toggle functionality

    const hamburger = document.getElementById('hamburgerToggle');
    const mobileMenu = document.querySelector('.Header_Buttons');
    
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            mobileMenu.classList.toggle('mobile-menu-open');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideMenu = mobileMenu.contains(event.target);
            const isClickOnHamburger = hamburger.contains(event.target);
            const isRunButton = event.target.closest('#Run_Button') || 
                               event.target.closest('.Header_Buttons_Menu_Div:first-child');
            
            if (!isClickInsideMenu && !isClickOnHamburger && 
                mobileMenu.classList.contains('mobile-menu-open') && !isRunButton) {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('mobile-menu-open');
            }
        });

        // Make labels clickable in mobile menu (exclude Run button)
        mobileMenu.querySelectorAll('.Header_Buttons_Menu_Div:not(:first-child) label').forEach(label => {
            label.addEventListener('click', function() {
                // Trigger the associated button click
                const button = this.previousElementSibling || this.parentElement.querySelector('button');
                if (button && button.onclick) {
                    button.click();
                } else if (button && button.id === 'LoadFilesButton') {
                    // Special case for file input
                    document.getElementById('LoadInputFiles').click();
                }
                
                // Close the menu
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('mobile-menu-open');
            });
        });
    }
}
//-----------------------------------------------------------------------------------------------
function sleep(t) {
    return new Promise((resolve) => setTimeout(resolve, t));
}
//-----------------------------------------------------------------------------------------------
function Generate_Unique_ID() {
    // Decleration of variables 
    let id_1, temp;
    
    // Generate a unique ID
    do {
        temp = crypto.randomUUID();
        id_1 = `${temp}`;
    } while (document.getElementById(id_1));

    // replace all "-" in the unique ID with "_" before returning 
    return id_1.replace(/-/gi,"_");
}
//-----------------------------------------------------------------------------------------------
function ChannelList_UniqueID(ID) {
    // Return the index number of channel in ChannelList[] where ID is equal to Unique_ID
    return ChannelList.findIndex(x => x.Unique_ID === ID);
}
//-----------------------------------------------------------------------------------------------
function ChannelList_TabelID(tableName) {
    // returns all index numbers of chnnales in ChannelList[] where TableName is equal to tabelName
    const indices = [];
    for (let i = 0; i < ChannelList.length; i++) {
        if (ChannelList[i].TableName === tableName) {
            indices.push(i);
        }
    }
    return indices;
}
//-----------------------------------------------------------------------------------------------
function ChannelScaleFactor_Update(el) {

    // Updates the ScaleFactor and statistics of channel in the ChannelList[]
    // Updates the graph as required.

    // Declaration of variables
    let ChNum, Scale_Fac, temp;

    // Obtain the channel Number
    ChNum = ChannelList_UniqueID( el.id.replace("Scale_ID_", "") );

    // Ge the user-specified scale factor
    Scale_Fac = Number(document.getElementById(el.id).value);

    // Updates the ScaleFactor
    ChannelList[ChNum].ScaleFactor = Scale_Fac;

    // Update Peak, Mean and RMS for this channel
    temp = Statistics(ChannelList[ChNum].data, ChannelList[ChNum].ScaleFactor);
    ChannelList[ChNum].Peak = temp.Peak;
    ChannelList[ChNum].Mean = temp.Mean;
    ChannelList[ChNum].RMS  = temp.RMS;

    // Delete Results for this channel beacuse the ScaleFactor is changed by user 
    ChannelList[ChNum].DeleteResults();

    // Update Plotly-Graphs if applicable
    if (IsElementExists(el.id.replace('Scale_ID_','Div_ID_'))) { Plotly_Graph_Update(ChNum); }
    
}
//-----------------------------------------------------------------------------------------------
function ChannelType_Update(el, Opt) {

    // Declaration of variables
    let N=24, j, Indx, Indx2, Indx3, opt, temp, TempList, ChNum, Unit_ID, tt;

    if (Opt) {
        // Channel type has been altered

        // Index of the pulldown menu of Type
        Indx = document.getElementById(el.id).selectedIndex;

        // Get Channel Number 
        ChNum = ChannelList_UniqueID(el.id.replace("Type_ID_", ""));

        // Create the corresponding list of units
        TempList = List_Units(Indx, false).Units; 

        // Update the Channel-Units based on the selected Channel-Type
        Unit_ID = el.id.replace("Type_ID", "Unit_ID");
        document.getElementById(Unit_ID).innerText = null;
        for (j = 0; j < TempList.length; j++) {
            opt = document.createElement("option");
            opt.text = TempList[j];
            document.getElementById(Unit_ID).options[j] = opt;
        }

        // Select the unit number of the fist item in the unit-list
        Indx2 = List_Units(Indx, false).UnitNum[0];

        tt='Type_ID_';

    } else {
        // Channel unit has been altered
        
        // Selected Channel-Type index
        Indx = document.getElementById(el.id.replace("Unit_ID", "Type_ID")).selectedIndex;

        // Update the ChannelList[ChNum] accordingly.
        ChNum = ChannelList_UniqueID(el.id.replace("Unit_ID_", ""));

        // Index of the selected channel unit
        Indx3 = document.getElementById(el.id).selectedIndex; 

        // Obtain the unit number of the fist item in the unit-list
        Indx2 = List_Units(Indx, false).UnitNum[Indx3];

        tt='Unit_ID_';
    }

    // Delete Results for this channel beacuse the Type or Unit is changed by user 
    ChannelList[ChNum].DeleteResults();

    // Update the ChannelList[ChNum] accordingly.
    for (j=0; j<N; j++) {

        temp = TypeAndUnit(j, false);
        if ((temp.Type == Indx) && (temp.Unit == Indx2)) {

            temp = TypeAndUnit(temp.TypeAndUnit);

            ChannelList[ChNum].Type         = temp.Type;
            ChannelList[ChNum].TypeAndUnits = temp.TypeAndUnit;
            ChannelList[ChNum].TypeString   = temp.Type_String;
            ChannelList[ChNum].Unit         = temp.Unit;
            ChannelList[ChNum].UnitString   = temp.Unit_String;
            break;
        }
    }

    // Update Plotly-Graphs if applicable
    if (IsElementExists(el.id.replace(tt,'Div_ID_'))) { 
        // Udate the pulldown-menu of Graph-Unit in Statictics Table
        Update_Graph_Unit();

        // Update Plotly Graph
        Plotly_Graph_Update(ChNum); 
    }

    //------------------------------------------------------------------------------------------
    function Update_Graph_Unit() {

        // This sub-function updates the cell for graph-units in Statictics Table 
        // Decleration of variables
        let j, opt, select, Unit_List, Unit_Cell_ID;

        // Get the list of Units for this channel
        Unit_List = List_Units(ChannelList[ChNum].Unit).Units;

        Unit_Cell_ID = "Unit_Cell_ID_" + ChannelList[ChNum].Unique_ID;

        // Empties the content of cell-element for graph-unit in Statictics Table
        document.getElementById(Unit_Cell_ID).innerHTML = "";

        // Create select-element and populate it 
        select  = document.createElement('select');
        select.setAttribute("id", "Unit_Plot_ID_" + ChannelList[ChNum].Unique_ID);
        select.setAttribute('class', 'form-select form-select-sm');
        
        // All options for the select element 
        for (j = 0; j < Unit_List.length; j++) {
            opt = document.createElement("option");
            opt.text = Unit_List[j];
            select.add(opt, null);
        }
        select.setAttribute("onchange", "Plotly_Graph_Update(" + ChNum + ")" );
        
        // Assign select-element to cell-element in Statictics Table
        document.getElementById(Unit_Cell_ID).appendChild(select);
    }

}
//-----------------------------------------------------------------------------------------------
function Toggle_Subtable(mainRow) {

    const subtableRow = mainRow.nextElementSibling;
    
    if (subtableRow.classList.contains('expanded')) {
        subtableRow.classList.remove('expanded');

        mainRow.style.borderBottom = '0.01rem solid black';
    } else {
        subtableRow.classList.add('expanded');
        mainRow.style.borderBottom = '0.0rem solid black';
    }
}
//-----------------------------------------------------------------------------------------------
async function Toggle_Sidebar_Checkbox_For_PlotGraph(chb) {
    
    // Toggles the PlotGraph (checkbox) for the channel

    // Decleration of variables     
    let ChNum, PlotChecbox, DivID

    ChNum       = ChannelList_UniqueID(chb.id.replace('PlotChecbox_', ''));
    PlotChecbox = document.getElementById(chb.id);
    DivID       = document.getElementById(chb.id.replace('PlotChecbox_', 'Div_ID_'));

    if (!PlotChecbox.checked) { 

        // Unselect the channel
        PlotChecbox.checked = false; 
        ChannelList[ChNum].PlotGraph = false;
        if (DivID != null) { DivID.style.display = 'none'; }
        Current_Plotly_Num--;
        
    } else { 

        // Make sure no more than MaxPlotly_Graphs number of graphs are selected 
        if (Current_Plotly_Num >= MaxPlotly_Graphs) {  chb.checked = false;  return; }

        // Select the channel
        PlotChecbox.checked = true; 
        ChannelList[ChNum].PlotGraph = true;
        if (DivID != null) { DivID.style.display = 'flex'; } 
        else {
            
            // All div-elements of Plotly-Graph that are hidden - not visable - and select the last div-element and delete (remove) it
            Get_Plotly_Graphs_Invisable().at(-1).remove();

            // Create new Plotly-Graph
            await Plotly_Create_Graph('panel2', ChannelList[ChNum]);
        }
        Current_Plotly_Num++;
    }
    
    // Update infoTable if PageNo==3
    if (PageNo == 3 ) { SDOF_ResultsDisplay(ChNum);    Update_Units_infoTable(ChNum); }
    if (PageNo == 4 ) { ResSpec_ResultsDisplay(ChNum); Update_Units_infoTable_ResSpec(ChNum); }

    // Update Graph
    Plotly_Graph_Update(ChNum);

    // Order Plotly Graphs
    Order_Plotly_Graphs();
}
//-----------------------------------------------------------------------------------------------
function Toggle_Sidebar_SelectAllChannels_For_Analysis() {
    
    // Decleration of variables 
    let i, status, InputArray, Indx 

    // Get the status of the checkbox
    if (document.getElementById('Right_Click_Select_All_Analysis').checked) { status = true; } else { status = false; }

    // Get an array of all elements with class "File_CheckBox_Ch_Blue"
    InputArray = Array.from( document.querySelectorAll('input[type="checkbox"][class*="File_CheckBox_Ch_Blue"]') );

    for (i=0; i < InputArray.length; i++) {

        // Set the checked property directly
        InputArray[i].checked = status;    

        // Get the index number of the channel
        Indx =  ChannelList_UniqueID( InputArray[i].id.replace('FileTreeView_Checkbox_', '') );
        
        // 
        ChannelList[Indx].Selected = status;

        // Chage the File-icon on TreeView if needed
        TreeView_File_SVG_Change(Indx);
    }
}
//-----------------------------------------------------------------------------------------------
async function Toggle_SidebBar_SelectAllChannels_For_Plotting() {
    
    // Decleration of variables 
    let i, status, InputArray, ChNum, MPG, DivID, Div_Status

    // Get an array of all elements with class "File_CheckBox_Ch_Green"
    InputArray = Array.from( document.querySelectorAll('input[type="checkbox"][class*="File_CheckBox_Ch_Green"]') );

    // Get the status of the checkbox
    if (document.getElementById('Right_Click_Select_All_Plotting').checked) { 

        MPG = Math.min(MaxPlotly_Graphs, InputArray.length);  console.log(MPG, Current_Plotly_Num)
        
        // No plotly-graph
        Turn_off_Plotly_Graphs(InputArray, MPG);
        
        // Start counting the graphs 
        Current_Plotly_Num = 0;

        // Loop-over the fist MaxPlotly_Graphs - 
        for (i=0; i < MPG; i++) {

            Current_Plotly_Num++; 

            // Set the checked property directly
            InputArray[i].checked = true;    

            // Get the channel number - change the status of plotting
            ChNum =  ChannelList_UniqueID( InputArray[i].id.replace('PlotChecbox_', '') );
            ChannelList[ChNum].PlotGraph = true;

            // Div_ID of the Plotly graph /  Do not show the graph
            DivID = document.getElementById(InputArray[i].id.replace('PlotChecbox_', 'Div_ID_'));
            if (DivID != null) { DivID.style.display = 'flex'; } 
            else { 
                
                // All div-elements of Plotly-Graph that are hidden - not visable - and select the last div-element and delete (remove) it
                Get_Plotly_Graphs_Invisable().at(-1).remove();

                // Create new Plotly-Graph
                await Plotly_Create_Graph('panel2', ChannelList[ChNum]);
            }
            
        }

    } else {
        
        Current_Plotly_Num = 0;

        // Turn-off all graphs 
        Turn_off_Plotly_Graphs(InputArray);

    }

    // Order Plotly Graphs
    Order_Plotly_Graphs();

    // Helper function
    function Turn_off_Plotly_Graphs(InputArray, startIndex) {

        if (startIndex == null) { startIndex = 0; }

        for (i=0; i < InputArray.length; i++) {

            // Set the checked property directly
            InputArray[i].checked = false;    

            // Get the channel number - and unselect it for plotting
            ChNum =  ChannelList_UniqueID( InputArray[i].id.replace('PlotChecbox_', '') );
            ChannelList[ChNum].PlotGraph = false;

            // Div_ID of the Plotly graph /  Do not show the graph (invisable - hidden)
            DivID = document.getElementById(InputArray[i].id.replace('PlotChecbox_', 'Div_ID_'));
            if (DivID != null) { DivID.style.display = 'none'; }

        }
    }
    
}
//-----------------------------------------------------------------------------------------------
function Toggel_Sidebar_Collapse_Expand_Files() {
    // Collapes or Expands all the files in the side-bar

    //Decleration of variables 
    let Items

    Items = document.querySelectorAll('#FileListTree li[class*="FileListTree_Channel_li"]');

    // Get the status of the checkbox
    if (document.getElementById('Right_Click_Select_All_Collapse_Sidebar').checked) {
        
        Items.forEach( item => {  item.className = 'FileListTree_Channel_li';  })

    } else {
        Items.forEach( item => {  item.className = 'FileListTree_Channel_li_hide';  })
    }
}
//-----------------------------------------------------------------------------------------------
function Toggle_Tabels_Collapse_Files() {

    // Decleration of variables 
    let i, status, Subtable, FileNameheaders

    // Get the status of the checkbox
    if (document.getElementById('Right_Click_Select_All_Collapse_Tables').checked) { status = true; } else { status = false; }

    // Get an array of all elements with class subtable-container
    Subtable = Array.from( document.querySelectorAll('#Table_FileNames .subtable-container, #Table_FileNames .subtable-container.expanded') ); 

    // For each element in Subtable, change the className of Subtable and chnage the text of ExpandIcon if neccessary
    for (i=0; i< Subtable.length; i++) {
        if (status) {
            // Extend all SubContainers
            Subtable[i].className = "subtable-container expanded";
        } else {
            // Collapse all SubContainers
            Subtable[i].className = "subtable-container";
        }
    }

    // Get an array of all elements with class File-Name-Header
    FileNameheaders = Array.from( document.querySelectorAll('#Table_FileNames .File-Name-Header') ); 

    // For each element in FileNameheaders,      change the className of Subtable and chnage the text of ExpandIcon if neccessary
    for (i=0; i< FileNameheaders.length; i++) {
        if (status) {
            // Extend all SubContainers
            FileNameheaders[i].style.borderBottom = '0.00rem solid black';

        } else {
            // Collapse all SubContainers
            FileNameheaders[i].style.borderBottom = '0.01rem solid black';
        }
    }
}
//-----------------------------------------------------------------------------------------------
function Toggle_Tables_SingleTable() {

    let Temp, screenSize, status

    // Screen size
    if (window.innerWidth <= 768) { screenSize = 'none';  } else {  screenSize = 'table-cell'; }

    // Display property of main-table-tr
    status = document.querySelector('.main-table-tr').style.display;

    if (status.includes('none') ||status == '') {

        // Form the Single table

        // Disable the Expand/Collapse option
        document.getElementById('Right_Click_Select_All_Collapse_Tables').checked = true;
        document.getElementById('Right_Click_Select_All_Collapse_Tables').disabled = true;
        Toggle_Tabels_Collapse_Files();

        // main-table-tr
        document.querySelector('.main-table-tr').style.display = 'flex';        

        // Channels Table Head 
        Temp = document.querySelectorAll('.Channels_Table_Thead');
        Temp.forEach(Item => {
            Item.setAttribute('style', 'display: none;');
        });
        
        // Channels Tabels 
        Temp = document.querySelectorAll('.Channels_Table');
        Temp.forEach(Item => {
            Item.setAttribute('style', 'margin-bottom: 0.5rem;  border-top: 0.01rem solid black;');
        });
        
        // FileName Column
        Temp = document.querySelectorAll('.Channels_Table td:nth-child(1)');
         Temp.forEach(Item => {
            Item.setAttribute('style', 'display:'+ screenSize + ';   font-weight: bold;');
        });

        // File Name header 
        Temp = document.querySelectorAll('.File-Name-Header');
        Temp.forEach(Item => {
            Item.setAttribute('style', 'margin-top: 0.0rem;    display: none;');
        });

    } else {

        // Form the Multiple tables

        // Enable the Expand/Collapse option
        document.getElementById('Right_Click_Select_All_Collapse_Tables').disabled = false;

        // main-table-tr
        document.querySelector('.main-table-tr').style.display = 'none';

        // Channels Table Head 
        Temp = document.querySelectorAll('.Channels_Table_Thead');
        Temp.forEach(Item => {
            Item.setAttribute('style', 'display: table-row;');
        });

        // Channels Tabels 
        Temp = document.querySelectorAll('.Channels_Table');
        Temp.forEach(Item => {
            Item.setAttribute('style', 'margin-bottom: 1.5rem;   border-top: 0.0rem solid black;');
        });

         // FileName Column
        Temp = document.querySelectorAll('.Channels_Table td:nth-child(1)');
         Temp.forEach(Item => {
            Item.setAttribute('style', 'display: none;');
        });

        // File Name header 
        Temp = document.querySelectorAll('.File-Name-Header');
        Temp.forEach(Item => {
            Item.setAttribute('style', 'margin-top: 0.3rem;    display: flex;');
        });

    }
}
//-----------------------------------------------------------------------------------------------
function ProgressBar_Update(msg, msg_color) {

    document.getElementById("ProgressBar_Label").innerHTML   = msg;
    document.getElementById("ProgressBar_Label").style.color = msg_color;

}
//-----------------------------------------------------------------------------------------------


